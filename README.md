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

- `artifacts/fictionsky-wordpress-publisher-1.0.0.vsix`

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

Common optional fields:

- `excerpt`
- `categories`
- `tags`

Notes:

- `title` and `slug` are required
- supported `status` values are `draft`, `publish`, `pending`, `private`, and `future`
- `categories` and `tags` should typically use existing WordPress slugs
- site selection also accepts `wordpress_target`, `wp_site`, and `site`

### Usage

1. Open a Markdown file.
2. Run `WordPress: Save Site App Password` the first time to store the app password.
3. Run either `WordPress: Publish Current Markdown as Draft` or `WordPress: Publish Current Markdown Now`.
4. The extension resolves the target site from frontmatter, the default site, or a picker.

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

### Packaging

```powershell
cmd /c npm run package:vsix
cmd /c npm run install:vsix
```

These commands generate and install a versioned artifact based on `package.json`, for example:

- `artifacts/fictionsky-wordpress-publisher-1.0.0.vsix`

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
