import type { PostForList } from "./content-utils";

/**
 * 归档页的数据处理逻辑。
 *
 * 页面在构建期渲染静态 HTML（可被搜索引擎与无 JS 环境读取），
 * 过滤在浏览器里按 URL 参数执行；两边共用同一份分组规则与参数解析，
 * 避免「静态渲染一套、客户端筛选另一套」的偏差。
 */

export type ArchivePost = PostForList;

export type ArchiveGroup = {
	year: number;
	posts: ArchivePost[];
};

export type ArchiveFilter = {
	tags: string[];
	categories: string[];
	uncategorized: boolean;
};

/** 按年份分组，年份降序；组内保持传入顺序（调用方已按发布时间降序） */
export function groupByYear(posts: ArchivePost[]): ArchiveGroup[] {
	const grouped = new Map<number, ArchivePost[]>();

	for (const post of posts) {
		const year = post.data.published.getFullYear();
		const bucket = grouped.get(year);
		if (bucket) {
			bucket.push(post);
		} else {
			grouped.set(year, [post]);
		}
	}

	return [...grouped.entries()]
		.map(([year, items]) => ({ year, posts: items }))
		.sort((a, b) => b.year - a.year);
}

/** 从 location.search 解析归档筛选条件 */
export function readArchiveFilter(search: string): ArchiveFilter {
	const params = new URLSearchParams(search);
	return {
		tags: params.getAll("tag").filter(Boolean),
		categories: params.getAll("category").filter(Boolean),
		uncategorized: params.get("uncategorized") === "true",
	};
}

export function isFilterActive(filter: ArchiveFilter): boolean {
	return (
		filter.tags.length > 0 ||
		filter.categories.length > 0 ||
		filter.uncategorized
	);
}

/** 归档列表里的日期显示为 MM-DD */
export function formatMonthDay(date: Date): string {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${month}-${day}`;
}

/** 把标签数组格式化成 "#a #b" 展示串 */
export function formatArchiveTags(tags: string[]): string {
	return tags.map((tag) => `#${tag}`).join(" ");
}
