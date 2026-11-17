/**
 * 社区模块配置。
 *
 * 职责边界：本文件只描述「社区入口」有哪些去处，不关心页面长什么样，
 * 也不依赖博客模块。页面（pages/community）只负责渲染这些数据。
 *
 * 当前形态：讨论由 GitHub Discussions 承载，站内 /community/ 只是入口页。
 * 未来形态：本地 /forum/ 上线后，把导航指向 /forum/ 即可；本页可保留为说明页，
 *           或直接 302 到 /forum/，不需要改动博客与认证模块。
 */

export type CommunityEntry = {
	name: string;
	description: string;
	url: string;
	icon: string;
	cta: string;
	external?: boolean;
};

export const communityConfig = {
	/** 论坛是否已上线：planned 时页面会明确告知「正在路上」 */
	forumStatus: "planned" as "planned" | "online",

	/** 讨论主入口（giscus 也挂在这个仓库的 Discussions 上） */
	discussionsUrl: "https://github.com/kiklh/giscus/discussions",

	entries: [
		{
			name: "GitHub Discussions",
			description: "提问、讨论、给建议都可以在这里发起，用 GitHub 账号直接参与，无需额外注册。",
			url: "https://github.com/kiklh/giscus/discussions",
			icon: "fa6-solid:comments",
			cta: "进入讨论区",
			external: true,
		},
		{
			name: "关于这个站",
			description: "想先了解我是谁、这个站写些什么，可以从关于页开始。",
			url: "/about/",
			icon: "material-symbols:person-outline-rounded",
			cta: "看看关于页",
		},
	] satisfies CommunityEntry[],
};
