import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";

export type SiteConfig = {
	title: string;
	subtitle: string;
	showPoweredBy?: boolean; // 页脚是否显示 "Powered by"，未设置或 false 时隐藏

	lang:
		| "en"
		| "zh_CN"
		| "zh_TW"
		| "ja"
		| "ko"
		| "es"
		| "th"
		| "vi"
		| "tr"
		| "id";

	themeColor: {
		hue: number;
		fixed: boolean;
	};
	banner: {
		enable: boolean;
		src: string;
		position?: "top" | "center" | "bottom";
		credit: {
			enable: boolean;
			text: string;
			url?: string;
		};
	};
	toc: {
		enable: boolean;
		depth: 1 | 2 | 3;
	};

	favicon: Favicon[];
};

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export enum LinkPreset {
	Home = 0,
	Archive = 1,
	About = 2,
}

export type NavBarLink = {
	name: string;
	url: string;
	external?: boolean;
	/** 用于计算「当前所在区域」高亮的前缀，例如博客模块为 "/blog" */
	match?: string;
};

export type NavBarConfig = {
	links: (NavBarLink | LinkPreset)[];
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof AUTO_MODE;

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	description: string;
	tags: string[];
	draft?: boolean;
	image?: string;
	category?: string;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type ExpressiveCodeConfig = {
	theme: string;
};

/** 评论/讨论区配置。当前实现为 giscus（读写 GitHub Discussions）。 */
export type CommentConfig = {
	enable: boolean;
	provider: "giscus";
	/** GitHub 仓库，形如 "owner/repo"，必须是 public 且已启用 Discussions */
	repo: `${string}/${string}`;
	repoId: string;
	category: string;
	categoryId: string;
	/** 讨论与文章的映射方式；pathname 最稳，但启用后不要再改文章路径 */
	mapping: "pathname" | "url" | "title" | "og:title";
	/** 严格匹配：找不到对应 discussion 时不自动新建 */
	strict: boolean;
	reactionsEnabled: boolean;
	inputPosition: "top" | "bottom";
	lang: string;
	/** 加载失败时的兜底链接 */
	discussionsUrl?: string;
	/**
	 * 自定义主题 CSS，路径相对站点根目录（如 "/giscus/cream-light.css"）。
	 * giscus 的 iframe 运行在 giscus.app 上，所以必须是绝对 URL，且服务端要回
	 * Access-Control-Allow-Origin（见 public/_headers）。
	 * 留空则退回 giscus 内置的 light/dark 主题。
	 */
	themeLight?: string;
	themeDark?: string;
};
