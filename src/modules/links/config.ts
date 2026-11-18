/**
 * 友链数据模块。
 *
 * 职责边界：这里只描述「有哪些链接、怎么分组、申请要求是什么」，
 * 不关心页面长什么样；页面（pages/links）只负责渲染。
 * 新增友链只改本文件的 sections，不需要动页面代码。
 */

export type FriendLink = {
	name: string;
	url: string;
	description: string;
	/** 头像地址：绝对 URL 或 /public 下的路径；留空则显示首字母占位 */
	avatar?: string;
	tags?: string[];
};

export type LinkSection = {
	title: string;
	description?: string;
	items: FriendLink[];
};

// 用函数包一层是为了既做类型检查、又保留 FriendLink 的可选字段（avatar / tags），
// 直接写 `satisfies LinkSection[]` 会把数组收窄成字面量类型，导致可选字段在页面上取不到。
const defineSections = (sections: LinkSection[]): LinkSection[] => sections;

export const linksConfig = {
	intro:
		"这里放我常读的站点与朋友们的博客。比例不高，但每一条都是真会点开看的。",

	apply: {
		title: "申请友链",
		intro: "欢迎交换链接。加我之前，建议先确认下面几条，能省掉一轮来回。",
		requirements: [
			"站点有持续更新的原创内容，不接受纯采集或空壳站",
			"已在你的站上放好本站链接",
			"能正常访问，没有强制弹窗、诱导跳转",
		],
		cta: {
			label: "去讨论区留言",
			url: "https://github.com/kiklh/giscus/discussions",
		},
	},

	// 新建分组时直接往后追加一个对象即可；items 为空的分组会自动跳过
	sections: defineSections([
		{
			title: "本站相关",
			description: "这个站用的框架与主题，出问题时最该先看这两处。",
			items: [
				{
					name: "Astro",
					url: "https://astro.build",
					description: "本站使用的静态站点框架，默认零 JS、按需水合。",
					tags: ["框架"],
				},
				{
					name: "Fuwari",
					url: "https://github.com/saicaca/fuwari",
					description: "当前主题，导航、卡片与分类标签的视觉基础来自它。",
					tags: ["主题"],
				},
			],
		},
		{
			title: "友链",
			description: "想加就在这里，按申请说明留言即可。",
			items: [],
		},
	]),
};
