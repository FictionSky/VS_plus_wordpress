# WordPress Publisher

Publish the current Markdown document to WordPress from VS Code.

在 VS Code 中直接把当前 Markdown 文档发布到 WordPress。

## 中文说明

### 功能概览

- 将当前 Markdown 文档发布为 WordPress 草稿
- 将当前 Markdown 文档直接发布为已发布状态
- 支持在 VS Code 设置中配置多个 WordPress 站点
- 使用 VS Code Secret Storage 保存每个站点的应用密码
- 复用仓库里的 Markdown 转 WordPress 区块逻辑
- 兼容旧版 `wordpress-post.*` 设置

### 可用命令

- `WordPress: Publish Current Markdown as Draft`
- `WordPress: Publish Current Markdown Now`
- `WordPress: Save Site App Password`
- `WordPress: Clear Saved Site App Password`

### 安装

#### 方式 1：本地打包为 VSIX

```powershell
cmd /c npm install
cmd /c npm run package:vsix
cmd /c npm run install:vsix
```

#### 方式 2：开发模式运行

1. 用 VS Code 打开当前项目目录。
2. 按 `F5` 启动 `Extension Development Host`。
3. 在新窗口里打开 Markdown 文件。
4. 通过命令面板运行 `WordPress:` 开头的命令。

### 配置

推荐在 VS Code 的 `settings.json` 中配置站点：

```json
{
  "wordpressPublisher.sites": [
    {
      "id": "main",
      "label": "Main Site",
      "baseUrl": "https://example.com",
      "apiUrl": "https://example.com/wp-json/wp/v2",
      "username": "your-wordpress-user"
    }
  ],
  "wordpressPublisher.defaultSiteId": "main",
  "wordpressPublisher.frontmatterSiteKey": "wordpress_site"
}
```

字段说明：

- `id`：站点唯一标识
- `label`：站点显示名称
- `baseUrl`：站点首页地址，可选
- `apiUrl`：WordPress REST API 地址，通常以 `/wp-json/wp/v2` 结尾
- `username`：WordPress 用户名
- `defaultSiteId`：Markdown 未指定站点时使用的默认站点
- `frontmatterSiteKey`：frontmatter 中用于选站的字段名

旧版配置仍然可用：

```json
{
  "wordpress-post.siteUrl": "https://example.com",
  "wordpress-post.apiUrl": "https://example.com/wp-json/wp/v2",
  "wordpress-post.authUser": "your-wordpress-user",
  "wordpress-post.authPassword": "your app password"
}
```

### Markdown 要求

Markdown 文件顶部至少应包含：

```yaml
---
title: Article Title
slug: article-slug
status: draft
wordpress_site: main
---
```

常见可选字段：

- `excerpt`
- `categories`
- `tags`

说明：

- `title` 和 `slug` 是必填项
- `status` 可选值包括 `draft`、`publish`、`pending`、`private`、`future`
- `categories` 与 `tags` 建议使用 WordPress 中已经存在的 slug
- frontmatter 选站字段除了 `wordpress_site` 之外，也兼容 `wordpress_target`、`wp_site`、`site`

### Markdown 写作说明

每篇文章开头至少需要包含 `title` 和 `slug`，通常也会写上 `status` 和 `wordpress_site`：

```yaml
---
title: 文章标题
slug: article-slug
status: draft
wordpress_site: main
---
```

完整文章示例：

````markdown
---
title: 文章标题
slug: article-slug
status: draft
excerpt: 这是一段文章摘要。
categories:
  - writing
tags: [vscode, wordpress]
wordpress_site: main
---

render{
## 正文小节

这里会按 Markdown 解析，并转换成 WordPress 区块。

- 支持列表
- 支持 **加粗**、*斜体*、`行内代码` 和链接

![封面图](./images/cover.png)
}

math{
E = mc^2
}

code js{
console.log("这里会变成 WordPress 代码区块。");
}

html{
<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
}

shortcode{
[gallery ids="1,2,3"]
}

也可以在辅助块外面直接写普通 Markdown 段落。
````

常用 frontmatter 字段：

- `title`：文章标题，必填
- `slug`：文章固定链接 slug，必填
- `status`：发布状态，可用 `draft`、`publish`、`pending`、`private`、`future`
- `excerpt`：文章摘要
- `categories`：分类 slug，建议使用 WordPress 中已经存在的分类
- `tags`：标签 slug，建议使用 WordPress 中已经存在的标签
- `wordpress_site`：目标站点 id；也兼容 `wordpress_target`、`wp_site`、`site`

本地图片可以直接写 Markdown 图片语法，例如 `![封面图](./images/cover.png)`。发布时扩展会先上传到 WordPress 媒体库，再把文章里的地址替换成媒体库 URL。远程图片 URL 会保持不变。

支持的本地图片扩展名包括 `.png`、`.jpg`、`.jpeg`、`.gif`、`.webp` 和 `.svg`。相对路径会以当前 Markdown 文件所在目录为基准解析。中文或其它非 ASCII 图片文件名上传时会使用 `image-<hash>` 这种安全文件名，避免不同图片都叫 `image.png`。

### Markdown 辅助块

扩展支持一些类似函数的辅助块，用来明确告诉发布器“这一段应该变成什么类型的 WordPress 内容”：

- `render{ ... }`：把里面的内容按 Markdown 解析，转换成普通 WordPress 区块。大多数正文内容都可以放在这里。
- `math{ ... }`：把里面的内容转换成 KaTeX 显示公式短代码：`[katex display=true]...[/katex]`。
- `code js{ ... }`：转换成 WordPress 原生代码区块。`js` 可以换成 `python`、`text`、`html` 等语言名。
- `html{ ... }`：转换成 WordPress 自定义 HTML 区块，适合放可信任的 HTML 片段。
- `shortcode{ ... }`：转换成 WordPress 短代码区块，不会把短代码转义。
- 普通 fenced code block，例如 ```` ```js ````，也会转换成 WordPress 原生代码区块。
- ````wp-render```` fenced block 的效果类似 `render{ ... }`，适合内容里本身需要写花括号或嵌套代码块的情况。
- `$$ ... $$` 会转换成显示公式。
- `$...$` 或 `\(...\)` 会转换成行内 KaTeX 公式。

日常写文章时，建议正文主要用普通 Markdown 或 `render{ ... }`；只有在需要公式、代码、HTML 或短代码时，再使用对应辅助块。

### 使用流程

1. 打开一个 Markdown 文件。
2. 先执行 `WordPress: Save Site App Password` 保存应用密码。
3. 执行 `WordPress: Publish Current Markdown as Draft` 或 `WordPress: Publish Current Markdown Now`。
4. 扩展会根据 frontmatter、默认站点或站点选择器决定目标站点。

仓库中附带了一个示例文件：

- [wordpress-extension-test.md](./wordpress-extension-test.md)

### 开发与测试

```powershell
cmd /c npm test
```

如果你只想直接调用共享 CLI：

```powershell
node .\scripts\publish-wp-blocks.mjs .\wordpress-extension-test.md
```

CLI 优先读取以下环境变量：

- `WP_BASE_URL`
- `WP_API_URL`
- `WP_USER`
- `WP_APP_PASSWORD`

如果环境变量缺失，CLI 会尝试从本机 VS Code `settings.json` 中读取旧版 `wordpress-post.*` 设置。

### 打包与发布准备

```powershell
cmd /c npm run package:vsix
cmd /c npm run install:vsix
```

这会生成并安装一个与 `package.json` 版本号对应的文件，例如：

- `artifacts/fictionsky-wordpress-publisher-2.0.0.vsix`

### 以后怎么更新插件

1. 修改源码。
2. 更新 `package.json` 中的 `version`。
3. 在 `CHANGELOG.md` 里补上新版本记录。
4. 运行 `cmd /c npm test`。
5. 运行 `cmd /c npm run package:vsix` 生成新的 `.vsix`。
6. 运行 `cmd /c npm run install:vsix` 覆盖安装本机扩展。
7. 把源码和新的 `artifacts/*.vsix` 一起提交并推送到 GitHub。

### GitHub

项目准备推送到：

- `https://github.com/FictionSky/VS_plus_wordpress`

建议在本地验证测试、打包和安装都通过后，再提交并推送到 GitHub。

## English

### Overview

- Publish the active Markdown document to WordPress as a draft
- Publish the active Markdown document directly
- Configure one or more WordPress sites in VS Code settings
- Store per-site app passwords in VS Code Secret Storage
- Reuse the repository's Markdown-to-WordPress block conversion logic
- Keep compatibility with legacy `wordpress-post.*` settings

### Commands

- `WordPress: Publish Current Markdown as Draft`
- `WordPress: Publish Current Markdown Now`
- `WordPress: Save Site App Password`
- `WordPress: Clear Saved Site App Password`

### Installation

#### Option 1: Package a local VSIX

```powershell
cmd /c npm install
cmd /c npm run package:vsix
cmd /c npm run install:vsix
```

#### Option 2: Run in development mode

1. Open this project in VS Code.
2. Press `F5` to launch an `Extension Development Host`.
3. Open a Markdown file in the new window.
4. Run any `WordPress:` command from the command palette.

### Configuration

Recommended `settings.json` configuration:

```json
{
  "wordpressPublisher.sites": [
    {
      "id": "main",
      "label": "Main Site",
      "baseUrl": "https://example.com",
      "apiUrl": "https://example.com/wp-json/wp/v2",
      "username": "your-wordpress-user"
    }
  ],
  "wordpressPublisher.defaultSiteId": "main",
  "wordpressPublisher.frontmatterSiteKey": "wordpress_site"
}
```

Field notes:

- `id`: unique site identifier
- `label`: display label shown in pickers
- `baseUrl`: optional site home URL
- `apiUrl`: WordPress REST API URL, usually ending in `/wp-json/wp/v2`
- `username`: WordPress username
- `defaultSiteId`: fallback site when the document does not declare one
- `frontmatterSiteKey`: preferred frontmatter key for site selection

Legacy settings are still supported:

```json
{
  "wordpress-post.siteUrl": "https://example.com",
  "wordpress-post.apiUrl": "https://example.com/wp-json/wp/v2",
  "wordpress-post.authUser": "your-wordpress-user",
  "wordpress-post.authPassword": "your app password"
}
```

### Markdown Requirements

Each Markdown document should start with frontmatter similar to:

```yaml
---
title: Article Title
slug: article-slug
status: draft
wordpress_site: main
---
```

Full article example:

````markdown
---
title: Article Title
slug: article-slug
status: draft
excerpt: Short summary shown by WordPress themes and feeds.
categories:
  - writing
tags: [vscode, wordpress]
wordpress_site: main
---

render{
## Section Rendered as Markdown

This block is parsed as normal Markdown and converted into WordPress blocks.

- Lists are supported
- **Bold**, *italic*, `code`, and links are supported

![Cover image](./images/cover.png)
}

math{
E = mc^2
}

code js{
console.log("This becomes a native WordPress code block.");
}

html{
<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
}

shortcode{
[gallery ids="1,2,3"]
}

You can also write regular Markdown paragraphs outside helper blocks.
````

Common optional fields:

- `excerpt`
- `categories`
- `tags`

Notes:

- `title` and `slug` are required
- supported `status` values are `draft`, `publish`, `pending`, `private`, and `future`
- `categories` and `tags` should typically use existing WordPress slugs
- site selection also accepts `wordpress_target`, `wp_site`, and `site`
- local Markdown images such as `![Cover](./images/cover.png)` are uploaded to the WordPress media library before the post is published
- remote image URLs such as `![Cover](https://example.com/cover.png)` are left unchanged

Supported local image extensions are `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, and `.svg`. Relative image paths are resolved from the Markdown file's directory. If a local image is missing or WordPress rejects the media upload, publishing stops before the post content is created or updated.

For non-ASCII local filenames, the uploaded media filename uses an ASCII-safe `image-<hash>` name so different images do not all upload as `image.png`.

### Markdown Helper Blocks

The extension supports a few helper blocks for content that should be converted in a specific way:

- `render{ ... }`: Parses the inside as Markdown and renders it as normal WordPress blocks. Use this when you want headings, paragraphs, lists, images, links, and inline formatting to behave like regular Markdown inside a grouped block.
- `math{ ... }`: Wraps the inside as a display KaTeX shortcode: `[katex display=true]...[/katex]`.
- `code js{ ... }`: Creates a native WordPress code block. Replace `js` with the language name you want, such as `python`, `text`, or `html`.
- `html{ ... }`: Creates a WordPress custom HTML block. Use this for trusted raw HTML snippets.
- `shortcode{ ... }`: Creates a WordPress shortcode block without escaping the shortcode.
- Fenced code blocks such as ```` ```js ```` also become native WordPress code blocks.
- Fenced ````wp-render```` blocks behave like `render{ ... }` and are useful when nested fences make brace syntax awkward.
- Display math can also be written with `$$ ... $$`.
- Inline math can be written as `$E = mc^2$` or `\(E = mc^2\)`.

Use `render{ ... }` for most article content when you want a clear section wrapper, and use the other helper blocks only when you need a specific WordPress block type.

### Usage

1. Open a Markdown file.
2. Run `WordPress: Save Site App Password` the first time to store the app password.
3. Run either `WordPress: Publish Current Markdown as Draft` or `WordPress: Publish Current Markdown Now`.
4. The extension resolves the target site from frontmatter, the default site, or a picker.

Publish commands are available from the command palette and are intentionally not shown in the editor title toolbar.

Sample content is included here:

- [wordpress-extension-test.md](./wordpress-extension-test.md)

### Development and Testing

```powershell
cmd /c npm test
```

To run the shared CLI directly:

```powershell
node .\scripts\publish-wp-blocks.mjs .\wordpress-extension-test.md
```

The CLI looks for:

- `WP_BASE_URL`
- `WP_API_URL`
- `WP_USER`
- `WP_APP_PASSWORD`

If those variables are missing, it falls back to legacy `wordpress-post.*` settings from local VS Code configuration.

### Future Plans

- Upload and render local video files such as `.mp4` as WordPress video blocks.
- Add an explicit media block syntax for assets that are not Markdown images, for example `video{ ./demo.mp4 }`.
- Reuse previously uploaded media when the same local file is published again.
- Support a frontmatter field for featured images, such as `featured_image: ./cover.png`.
- Show a publish preview that lists the target site, post status, local media to upload, and final slug before sending data to WordPress.
- Add optional image optimization or size checks before upload.
- Support alt text, captions, and alignment as native WordPress image block attributes.
- Improve README encoding and rewrite the Chinese documentation cleanly in UTF-8.

### Packaging

```powershell
cmd /c npm run package:vsix
cmd /c npm run install:vsix
```

These commands generate and install a versioned artifact based on `package.json`, for example:

- `artifacts/fictionsky-wordpress-publisher-2.0.0.vsix`

### Updating the Plugin Later

1. Update the source code.
2. Bump the `version` field in `package.json`.
3. Add a new entry in `CHANGELOG.md`.
4. Run `cmd /c npm test`.
5. Run `cmd /c npm run package:vsix` to generate the new VSIX.
6. Run `cmd /c npm run install:vsix` to reinstall the updated extension locally.
7. Commit both the source changes and the new `artifacts/*.vsix`, then push them to GitHub.

### GitHub

This project is being prepared for:

- `https://github.com/FictionSky/VS_plus_wordpress`

Run tests, package the extension, and verify local installation before pushing the repository.
