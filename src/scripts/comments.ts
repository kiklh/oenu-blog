/**
 * 文章页讨论区（giscus）的运行时控制。
 *
 * 为什么单独抽成模块而不是写在 Comments.astro 里：
 * swup 每次换页都会重跑新页面里的 <script>，若挂载逻辑跟着页面走，
 * `page:view` 钩子与 MutationObserver 会随换页次数线性累积，
 * 同一个 iframe 被反复销毁重建。把逻辑放在 Layout 引入的常驻脚本里，
 * 只初始化一次，并配合 window.__commentsBooted 做幂等。
 *
 * 加载策略：
 * - 容器进入视口前 400px 才注入 giscus client.js，未读评论不产生第三方请求
 * - 骨架屏常驻，避免 iframe 到位时卡片从 0 高度暴涨（CLS）
 * - 8 秒未就绪视为失败，给出「重试 / 去 GitHub 讨论」兜底
 */

type CommentState = "idle" | "loading" | "ready" | "error";

const GISCUS_ORIGIN = "https://giscus.app";
const CLIENT_SCRIPT = `${GISCUS_ORIGIN}/client.js`;
const PRELOAD_MARGIN = "400px 0px";
const LOAD_TIMEOUT = 8000;

let observer: IntersectionObserver | null = null;
let timeoutId: number | null = null;

function getCard(): HTMLElement | null {
	return document.querySelector<HTMLElement>("[data-comments-card]");
}

function currentTheme(): "light" | "dark" {
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function setState(card: HTMLElement, state: CommentState): void {
	card.dataset.state = state;
}

function clearTimer(): void {
	if (timeoutId !== null) {
		window.clearTimeout(timeoutId);
		timeoutId = null;
	}
}

function disconnect(): void {
	observer?.disconnect();
	observer = null;
	clearTimer();
}

function syncThemeToFrame(): void {
	const frame = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
	frame?.contentWindow?.postMessage(
		{ giscus: { setConfig: { theme: currentTheme() } } },
		GISCUS_ORIGIN,
	);
}

function fail(card: HTMLElement): void {
	clearTimer();
	setState(card, "error");
	card
		.querySelector<HTMLElement>("[data-comments-host]")
		?.classList.add("hidden");
	card
		.querySelector<HTMLElement>("[data-comments-fallback]")
		?.classList.remove("hidden");
}

function injectClient(card: HTMLElement): void {
	const host = card.querySelector<HTMLElement>("[data-comments-host]");
	if (!host) return;

	host.innerHTML = "";
	host.classList.remove("hidden");
	setState(card, "loading");

	const script = document.createElement("script");
	script.src = CLIENT_SCRIPT;
	script.crossOrigin = "anonymous";
	script.async = true;

	const source = host.dataset;
	const attributes: Record<string, string | undefined> = {
		repo: source.repo,
		"repo-id": source.repoId,
		category: source.category,
		"category-id": source.categoryId,
		mapping: source.mapping,
		strict: source.strict,
		"reactions-enabled": source.reactionsEnabled,
		"emit-metadata": source.emitMetadata,
		"input-position": source.inputPosition,
		lang: source.lang,
		theme: currentTheme(),
	};

	for (const [key, value] of Object.entries(attributes)) {
		if (value === undefined) continue;
		script.dataset[key.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase())] =
			value;
	}

	script.onerror = () => fail(card);

	// giscus 会把 client.js 替换成 iframe，出现 iframe 后监听其 load 才算就绪
	const watcher = new MutationObserver(() => {
		const frame = host.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
		if (!frame) return;
		watcher.disconnect();
		frame.addEventListener(
			"load",
			() => {
				clearTimer();
				setState(card, "ready");
				syncThemeToFrame();
			},
			{ once: true },
		);
	});
	watcher.observe(host, { childList: true, subtree: true });

	host.appendChild(script);

	timeoutId = window.setTimeout(() => {
		if (card.dataset.state !== "ready") fail(card);
	}, LOAD_TIMEOUT);
}

function loadNow(card: HTMLElement): void {
	if (card.dataset.mountedPath === window.location.pathname) return;
	card.dataset.mountedPath = window.location.pathname;
	injectClient(card);
}

function refresh(): void {
	disconnect();

	const card = getCard();
	if (!card) return;

	// swup 换页后是全新节点；同页重复调用时若已就绪则直接复用
	if (
		card.dataset.state === "ready" &&
		card.dataset.mountedPath === window.location.pathname
	) {
		return;
	}

	delete card.dataset.mountedPath;
	card
		.querySelector<HTMLElement>("[data-comments-host]")
		?.classList.remove("hidden");
	card
		.querySelector<HTMLElement>("[data-comments-fallback]")
		?.classList.add("hidden");
	setState(card, "idle");

	if (!("IntersectionObserver" in window)) {
		loadNow(card);
		return;
	}

	observer = new IntersectionObserver(
		(entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			disconnect();
			loadNow(card);
		},
		{ rootMargin: PRELOAD_MARGIN, threshold: 0 },
	);
	observer.observe(card);
}

function bindRetry(): void {
	document.addEventListener("click", (event) => {
		const target = event.target as HTMLElement | null;
		if (!target?.closest("[data-comments-retry]")) return;

		const card = getCard();
		if (!card) return;

		delete card.dataset.mountedPath;
		loadNow(card);
	});
}

function boot(): void {
	// @swup/astro 会派发这两个事件：before-swap 在替换 DOM 前，page-load 在换页完成后
	document.addEventListener("astro:before-swap", disconnect);
	document.addEventListener("astro:page-load", refresh);

	// 亮暗切换只改 <html> 的 class，注册一次即可
	new MutationObserver(syncThemeToFrame).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	bindRetry();
	refresh();
}

// 本文件没有 import/export，属于脚本而非模块，不能使用 `declare global`；
// 用局部交叉类型即可表达「挂一个幂等标记到 window 上」
type CommentsWindow = Window & { __commentsBooted?: boolean };

const commentsWindow = window as CommentsWindow;

if (!commentsWindow.__commentsBooted) {
	commentsWindow.__commentsBooted = true;
	boot();
}
