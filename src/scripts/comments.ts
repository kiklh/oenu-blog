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
 * - 页面空闲时先 prefetch client.js（省掉最贵的一次第三方冷启动），
 *   但会跳过 saveData / 2G 等省流场景
 * - 容器进入视口前 1200px（约一屏多）才注入 client.js 建 iframe，
 *   未读评论不产生 iframe 与 GitHub API 请求
 * - 骨架屏常驻，避免 iframe 到位时卡片从 0 高度暴涨（CLS）
 * - 8 秒未就绪视为失败，给出「重试 / 去 GitHub 讨论」兜底
 */

type CommentState = "idle" | "loading" | "ready" | "error";

const GISCUS_ORIGIN = "https://giscus.app";
const CLIENT_SCRIPT = `${GISCUS_ORIGIN}/client.js`;
const PRELOAD_MARGIN = "1200px 0px";
const LOAD_TIMEOUT = 8000;
const PREFETCH_FLAG = "data-giscus-prefetch";

let observer: IntersectionObserver | null = null;
let timeoutId: number | null = null;

function getCard(): HTMLElement | null {
	return document.querySelector<HTMLElement>("[data-comments-card]");
}

function isDark(): boolean {
	return document.documentElement.classList.contains("dark");
}

/**
 * 主题值：配置了自定义主题时用绝对 URL（giscus 直接把 data-theme 当 CSS 地址），
 * 否则退回内置的 light / dark。切换亮暗时要重新取，所以不缓存。
 */
function themeFor(card: HTMLElement | null): string {
	const host = card?.querySelector<HTMLElement>("[data-comments-host]");
	const custom = isDark() ? host?.dataset.themeDark : host?.dataset.themeLight;
	if (custom) return custom;
	return isDark() ? "dark" : "light";
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
		{ giscus: { setConfig: { theme: themeFor(getCard()) } } },
		GISCUS_ORIGIN,
	);
}

/**
 * 空闲时预热 client.js：它约 40KB，体积不大但域名要新建 TCP + TLS，
 * 提前落进 HTTP 缓存后，滚动到评论区几乎只剩建 iframe 的时间。
 * prefetch 的属性要与 injectClient 里的 script 一致（crossorigin=anonymous），
 * 否则缓存键不匹配，等于白下两次。
 */
function prefetchClient(): void {
	if (document.head.querySelector(`link[${PREFETCH_FLAG}]`)) return;

	const connection = (
		navigator as Navigator & {
			connection?: { saveData?: boolean; effectiveType?: string };
		}
	).connection;

	if (connection?.saveData) return;
	if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") return;

	const link = document.createElement("link");
	link.rel = "prefetch";
	link.as = "script";
	link.href = CLIENT_SCRIPT;
	link.crossOrigin = "anonymous";
	link.setAttribute(PREFETCH_FLAG, "");
	document.head.appendChild(link);
}

function schedulePrefetch(): void {
	// 不用 `"requestIdleCallback" in window` 判断：那会把 else 分支的 window 收窄成 never
	const idleWindow = window as Window & {
		requestIdleCallback?: (
			callback: () => void,
			options?: { timeout?: number },
		) => number;
	};

	if (idleWindow.requestIdleCallback) {
		idleWindow.requestIdleCallback(prefetchClient, { timeout: 3000 });
		return;
	}
	window.setTimeout(prefetchClient, 1500);
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

/**
 * 就绪：把 iframe 放回来。
 * 慢网络下超时兜底可能先于 iframe 的 load 触发（fail 把 host 藏了），
 * 如果这里不还原可见性，用户会永远停在「加载失败」而其实评论已经在了。
 */
function succeed(card: HTMLElement): void {
	clearTimer();
	setState(card, "ready");
	card
		.querySelector<HTMLElement>("[data-comments-host]")
		?.classList.remove("hidden");
	card
		.querySelector<HTMLElement>("[data-comments-fallback]")
		?.classList.add("hidden");
}

function injectClient(card: HTMLElement): void {
	const host = card.querySelector<HTMLElement>("[data-comments-host]");
	if (!host) return;

	// 重试时会重新注入，先清掉上一轮的超时，避免旧计时器把新一轮判死
	clearTimer();

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
		theme: themeFor(card),
	};

	for (const [key, value] of Object.entries(attributes)) {
		if (value === undefined) continue;
		script.dataset[key.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase())] =
			value;
	}

	script.onerror = () => fail(card);

	// giscus 会把 client.js 替换成 iframe，出现 iframe 后监听其 load 才算就绪。
	// 监听是同步挂上的（iframe 刚被插入、还没开始加载），所以不会漏掉 load。
	const watcher = new MutationObserver(() => {
		const frame = host.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
		if (!frame) return;
		watcher.disconnect();

		frame.addEventListener(
			"load",
			() => {
				succeed(card);
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

	// 有评论区就先把 client.js 拉进缓存，真正的 iframe 仍等滚动到附近
	schedulePrefetch();

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
