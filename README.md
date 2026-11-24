# oenu 的半亩方塘

基于 Astro + Fuwari 的个人随笔博客，线上地址 <https://oenu.kdns.fr/>。
部署在 Cloudflare Workers 静态资源上，构建产物在 `dist/`。

---

## 1. 文章写在哪里

**所有文章都是 `src/content/posts/` 下的 Markdown 文件，一个文件一篇文章。**

```
src/content/posts/
├── hello-world.md          →  https://oenu.kdns.fr/blog/posts/hello-world/
└── 我的第一篇随笔.md        →  https://oenu.kdns.fr/blog/posts/我的第一篇随笔/
```

- 文件名（去掉 `.md`）就是 URL 里的 slug，也是评论区的 `pathname` 映射键，**发布后不要改名**。
- 需要分组时可以用子目录，slug 会带上目录层级：`posts/tech/astro.md` → `/blog/posts/tech/astro/`。
- 封面图放文章同目录，frontmatter 里写 `image: ./cover.png`。
- 关于页正文不在这里，见 `src/content/spec/about.md`。

### 新建一篇文章

```sh
pnpm new-post 文章slug      # 生成 src/content/posts/文章slug.md 并写好 frontmatter
```

然后直接编辑那个文件即可。手写也行，只要 frontmatter 符合下节要求。

### frontmatter 字段

```yaml
---
title: 标题                       # 必填
published: 2026-11-24             # 必填，日期写 YYYY-MM-DD（schema 是 z.date()）
updated: 2026-11-25               # 选填，改稿后可以加上
description: 一句话摘要            # 选填，用于列表与 SEO
image: ./cover.png                # 选填，封面图
tags: [随笔, Astro]               # 选填，会生成 /blog/tags/<tag>/ 页面
category: 折腾                    # 选填，只是列表上的标签，没有独立路由
draft: false                      # true = 只在本地可见，不参与构建
lang: ""                          # 选填，正文语言与站点不同时才填
---
```

---

## 2. 目录结构

```
src/
├── config.ts                # ★ 站点名、副标题、导航、作者信息、许可证、评论（giscus）
├── content/
│   ├── posts/               # ★ 文章正文（唯一入口）
│   ├── spec/about.md        # ★ 关于页正文
│   └── config.ts            # 内容集合 schema（frontmatter 类型定义）
├── pages/                   # 路由只由目录决定，与 URL 一一对应
│   ├── index.astro          # 根路径跳转壳（生产环境由 _redirects 302）
│   ├── blog/
│   │   ├── [...page].astro  # /blog/ 列表（分页）
│   │   ├── posts/[...slug].astro
│   │   ├── archive.astro    # /blog/archive/
│   │   └── tags/            # /blog/tags/、/blog/tags/<tag>/
│   ├── links/index.astro    # /links/ 友链页
│   ├── about.astro          # /about/ 渲染壳
│   ├── 404.astro            # 必须保留，产物是 dist/404.html
│   ├── robots.txt.ts
│   └── rss.xml.ts
├── modules/
│   └── links/config.ts      # ★ 友链数据（改友链只改这个文件）
├── components/              # Navbar / Footer / 卡片 / 侧边栏 widget / 评论区
├── layouts/                 # Layout.astro（head、脚本注入）、MainGridLayout.astro
├── scripts/comments.ts      # ★ giscus 运行时逻辑（懒加载、幂等）
├── styles/                  # variables.styl（设计令牌）、main.css（全局视觉）
├── i18n/languages/zh_CN.ts  # ★ UI 文案（"阅读更多""归档"等）
├── utils/url-utils.ts       # ★ 站内链接唯一出口 url()
└── types/config.ts          # 配置项类型
public/
├── _redirects               # ★ 旧链接与根路径的 301/302
└── ...
```

## 3. 想改某个东西，改哪里

| 想改什么 | 改这个文件 |
| --- | --- |
| 站名 / 副标题 / 主题色 / TOC | `src/config.ts` 的 `siteConfig` |
| 导航菜单 | `src/config.ts` 的 `navBarConfig`（`match` 控制子页高亮） |
| 侧边栏昵称、头像、简介、社交按钮 | `src/config.ts` 的 `profileConfig` |
| 关于页正文 | `src/content/spec/about.md` |
| 友链 | `src/modules/links/config.ts` |
| 评论（giscus 仓库 / 分类 / 语言） | `src/config.ts` 的 `commentConfig` |
| 评论区 iframe 里的配色 | `public/giscus/cream-light.css` / `cream-dark.css`（与 `variables.styl` 同源，改色要一起改） |
| 界面文字（非文章内容） | `src/i18n/languages/zh_CN.ts` |
| 配色（主色 / 底色 / 文字层级）、圆角、阴影、动画时长 | `src/styles/variables.styl`（文件顶部有配色总纲注释） |
| 卡片、按钮等全局观感 | `src/styles/main.css` |
| 站点域名 / sitemap / 集成 | `astro.config.mjs` |
| 部署目标与自定义域名 | `wrangler.jsonc` |

## 4. 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 本地开发，<http://localhost:4321> |
| `pnpm new-post <slug>` | 新建文章 |
| `pnpm build` | 构建到 `dist/`，同时生成 Pagefind 搜索索引 |
| `pnpm preview` | 预览构建结果（不应用 `_redirects`） |
| `pnpm preview:worker` | 用 `wrangler dev` 预览，**会真实应用 `_redirects`** |
| `pnpm deploy` | `build` + `wrangler deploy`，发布上线 |
| `pnpm check` | Astro 类型/内容校验 |

## 5. 限制条件（改之前先看这里）

1. **`base` 保持 `/`。** 模块前缀（`/blog`、`/links`）靠 `src/pages` 的目录实现，不要改成 `base: "/blog"`，否则 `url()`、sitemap、giscus 映射会一起错位。
2. **站内链接只能走 `url()`**（`src/utils/url-utils.ts`），不要手写 `"/blog/posts/..."` 字符串。改路由时先看这里。
3. **路由改动要成对做**：新增页面放对应模块目录下（不要塞回根路径）+ 同步 `navBarConfig` 的 `match` + 必要时在 `public/_redirects` 补旧链接跳转。
4. **`src/content/posts/` 里只能放文章。** 目录内的 `.md` 一律按文章解析，缺 frontmatter 会直接构建失败；说明文档放仓库根目录，别放这里。
5. **`published` / `updated` 必须是 `YYYY-MM-DD` 形式**（schema 是 `z.date()`），写成 `2026/11/24` 会报错。
6. **`public/_redirects` 的精确路径规则必须排在通配规则之前**；`_redirects` 只对静态资源生效，不影响 Worker 代码的响应。
7. **`src/pages/404.astro` 不能删**，Workers 的 `not_found_handling` 依赖构建产物里的 `dist/404.html`。
8. **评论的运行时逻辑只在 `src/scripts/comments.ts`。** 不要往 `Comments.astro` 里写挂载脚本：swup 每次换页都会重跑页面脚本，钩子与 observer 会线性累积。
9. **导航高亮不能只靠 SSR。** swup 只替换 `main` 和 `#toc`，`#navbar` 不换，高亮由 `Navbar.astro` 的 `syncNavActive()` 在 `page:view` 时重算。
10. **Stylus 两个坑**：阴影变量不能进 `define()`（含逗号会被当成亮暗双值）；`oklch(... / 0.09)` 会被当除法，用 `warm()/black()/white()` 或 `unquote()`。
11. **配色是「底色跟 hue、主色不跟 hue」的双轨结构。** `--primary` 固定为琥珀棕（hue 78），因为黄色在 OKLCH 里天生高明度，`var(--hue)` 直接当链接色会掉到 2 点几的对比度。改主色时改 `variables.styl` 里的固定值，不要改回 `var(--hue)`。
12. **giscus 自定义主题的硬条件**：主题 CSS 必须用绝对 URL（iframe 在 giscus.app 上解析相对路径），且 `/giscus/*` 必须在 `public/_headers` 里回 `Access-Control-Allow-Origin`，否则浏览器按同源策略丢弃样式、评论区退回默认外观。本地 `dev` 是 http、iframe 是 https，混合内容会被拦，主题只能在部署后验证。
13. **仓库是 CRLF 换行**，`pnpm format` / `biome check` 会对全仓库报格式差异。只为本次改动的文件格式化，不要顺手提交全仓库行尾变更。
14. **分支**：日常改动在 `dev`，`master` 是线上基线，合并与发布按需手动做。
15. **不要删除 `.workbuddy/`**，里面的记忆文件是后续会话的上下文来源。

## 6. 部署

```sh
pnpm deploy      # 构建 + wrangler deploy
```

- `wrangler.jsonc`：static-only（无 `main`），`assets.directory = ./dist`，`html_handling = auto-trailing-slash`，`not_found_handling = 404-page`。
- 自定义域名 `oenu.kdns.fr` 通过 `routes.custom_domain` 绑定，在用户自己的 Cloudflare 账号下。
- 选择 Workers 而不是 Pages：付费版文件上限 10 万（Pages 为 2 万），且以后加 `/api/*` 认证是同域，不需要处理 CORS。
