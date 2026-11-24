import type {
	CommentConfig,
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";

export const siteConfig: SiteConfig = {
	title: "oenu 的半亩方塘",
	subtitle: "世事漫随流水，算来一梦浮生",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	showPoweredBy: false, // 是否显示页脚的 "Powered by Astro & Fuwari"，默认隐藏
	themeColor: {
		hue: 92, // 默认淡黄（奶油纸感）；配色方案见 src/styles/variables.styl 顶部注释
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		// match 决定子页面（文章、归档、标签等）是否保持高亮
		{ name: "博客", url: "/blog/", match: "/blog" },
		{ name: "友链", url: "/links/", match: "/links" },
		{ name: "关于", url: "/about/" },
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.png", // 暂用模板默认头像，后续可替换
	name: "oenu",
	bio: "不折腾，不较真。写点代码，喝点茶，随遇而安。",
	// 侧边栏的社交按钮。留空则不渲染按钮区；要加就按下面的形状追加
	// { name: "GitHub", icon: "fa6-brands:github", url: "https://github.com/<你的账号>" }
	links: [],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};

/**
 * 讨论区：读写 GitHub Discussions（giscus）。
 * 这些 id 是公开值（会出现在页面 HTML 里），不是密钥，放在这里无需环境变量。
 */
export const commentConfig: CommentConfig = {
	enable: true,
	provider: "giscus",
	repo: "kiklh/giscus",
	repoId: "R_kgDOVxz8ZA",
	category: "Comments",
	categoryId: "DIC_kwDOVxz8ZM4DLWJc",
	mapping: "pathname",
	strict: false,
	reactionsEnabled: true,
	inputPosition: "top",
	lang: "zh-CN",
	discussionsUrl: "https://github.com/kiklh/giscus/discussions",
	// 奶油底自定义主题，与 variables.styl 的配色同源；实际请求时由 Comments.astro
	// 补成绝对 URL（giscus 的 iframe 在 giscus.app 上解析相对路径）
	themeLight: "/giscus/cream-light.css",
	themeDark: "/giscus/cream-dark.css",
};
