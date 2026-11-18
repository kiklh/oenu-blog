import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

export function pathsEqual(path1: string, path2: string) {
	const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
	const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
	return normalizedPath1 === normalizedPath2;
}

function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

export function getPostUrlBySlug(slug: string): string {
	return url(`/blog/posts/${slug}/`);
}

/**
 * 把标签名转成 URL 片段。
 * 保留中日韩字符（由 encodeURI 负责百分号编码），只清理会破坏路径的字符。
 */
export function tagToSlug(tag: string): string {
	return tag
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, "-")
		.replace(/[\\/#?%&+=~`^|{}[\]<>"']/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export function getTagUrl(tag: string): string {
	if (!tag) return url("/blog/tags/");
	return url(`/blog/tags/${encodeURI(tagToSlug(tag))}/`);
}

export function getTagListUrl(): string {
	return url("/blog/tags/");
}

export function getCategoryUrl(category: string | null): string {
	if (
		!category ||
		category.trim() === "" ||
		category.trim().toLowerCase() === i18n(I18nKey.uncategorized).toLowerCase()
	)
		return url("/blog/archive/?uncategorized=true");
	return url(`/blog/archive/?category=${encodeURIComponent(category.trim())}`);
}

export function getDir(path: string): string {
	const lastSlashIndex = path.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return path.substring(0, lastSlashIndex + 1);
}

export function url(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}
