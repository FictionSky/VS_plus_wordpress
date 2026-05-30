# WordPress Publisher

这是一个 VS Code 扩展项目，用来把当前打开的 Markdown 文件直接发布到 WordPress。

它支持：

- 将当前 Markdown 文件发布为草稿
- 将当前 Markdown 文件直接发布
- 在 VS Code 设置中配置一个或多个 WordPress 站点
- 使用 VS Code Secret Storage 保存 WordPress 应用密码
- 复用当前项目里的 Markdown 到 WordPress 区块转换逻辑

## 1. 扩展能做什么

当前扩展提供 4 个命令：

- `WordPress: Publish Current Markdown as Draft`
- `WordPress: Publish Current Markdown Now`
- `WordPress: Save Site App Password`
- `WordPress: Clear Saved Site App Password`

其中：

- `Publish Current Markdown as Draft` 用于先发布草稿，适合先检查排版
- `Publish Current Markdown Now` 用于直接发布
- `Save Site App Password` 用于保存 WordPress 应用密码
- `Clear Saved Site App Password` 用于删除已经保存的密码

## 2. VS Code 配置

推荐在 VS Code 用户 `settings.json` 中配置站点：

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

- `id`：站点唯一标识，会在 frontmatter 里使用
- `label`：命令选择站点时显示的名称
- `baseUrl`：站点首页地址
- `apiUrl`：WordPress REST API 地址，通常是 `https://你的站点/wp-json/wp/v2`
- `username`：WordPress 用户名
- `defaultSiteId`：当前文章没有指定站点时默认使用哪个站点
- `frontmatterSiteKey`：frontmatter 中用于选择站点的字段名

密码不会写进 `settings.json`，而是保存在 VS Code Secret Storage 中。

### 兼容旧配置

如果你以前已经在 VS Code 中配置过旧版字段：

```json
{
  "wordpress-post.siteUrl": "https://example.com",
  "wordpress-post.apiUrl": "https://example.com/wp-json/wp/v2",
  "wordpress-post.authUser": "your-wordpress-user",
  "wordpress-post.authPassword": "your app password"
}
```

扩展目前仍然兼容这套旧配置，可以直接使用。

## 3. Markdown 文件怎么写

Markdown 文件顶部至少要有 frontmatter：

```yaml
---
title: 文章标题
slug: article-slug
status: draft
wordpress_site: main
---
```

常用可选字段：

- `excerpt`
- `categories`
- `tags`

注意：

- `categories` 和 `tags` 最稳妥的写法是使用 WordPress 后台已有的 slug
- 如果你只配置了旧版 `wordpress-post.*`，可以不写 `wordpress_site`

测试文件已经提供在：

- [wordpress-extension-test.md](./wordpress-extension-test.md)

## 4. 如何在 VS Code 里验证扩展可用

### 方法一：开发模式验证

这是当前最直接的验证方式。

1. 用 VS Code 打开当前项目文件夹
2. 按 `F5`
3. VS Code 会打开一个新的 `Extension Development Host` 窗口
4. 在新窗口里打开 Markdown 文件
5. 按 `Ctrl+Shift+P`
6. 搜索 `WordPress:`
7. 执行下面命令之一：

- `WordPress: Save Site App Password`
- `WordPress: Publish Current Markdown as Draft`
- `WordPress: Publish Current Markdown Now`

推荐第一次先这样验证：

1. 打开 [wordpress-extension-test.md](./wordpress-extension-test.md)
2. 先执行 `WordPress: Save Site App Password`
3. 再执行 `WordPress: Publish Current Markdown as Draft`

### 方法二：命令行脚本验证

原来的 CLI 入口仍然可用：

```powershell
node .\scripts\publish-wp-blocks.mjs .\wordpress-extension-test.md
```

它现在和扩展共用同一套发布核心逻辑。

## 5. 怎么把扩展安装到 VS Code

当前有两种方式。

### 方式一：直接以开发扩展方式使用

如果只是你自己本地使用，最简单的方法就是：

1. 保留这个项目目录
2. 在 VS Code 中打开它
3. 每次按 `F5` 启动扩展开发宿主窗口

这种方式不需要打包，但依赖当前项目目录存在。

### 方式二：打包成 `.vsix` 后安装

如果你想让它脱离当前项目目录独立安装，推荐打包成 `.vsix`。

常见步骤如下：

1. 全局安装打包工具

```powershell
npm install -g @vscode/vsce
```

2. 在项目目录执行打包

```powershell
vsce package
```

执行后会生成一个类似下面的文件：

```text
fictionsky-wordpress-publisher-1.0.0.vsix
```

3. 在 VS Code 中安装 `.vsix`

方式 A：

- 打开 VS Code
- 进入“扩展”
- 点击右上角 `...`
- 选择 `Install from VSIX...`
- 选择刚才生成的 `.vsix` 文件

方式 B：

```powershell
code --install-extension .\fictionsky-wordpress-publisher-1.0.0.vsix
```

安装成 `.vsix` 之后，就不再依赖当前 `Post1` 目录。

## 6. 怎么发布到 GitHub

当前仓库已经存在 GitHub 远端：

```text
https://github.com/FictionSky/VS_plus_wordpress.git
```

标准流程如下：

1. 查看状态

```powershell
git status
```

2. 添加文件

```powershell
git add .
```

3. 提交

```powershell
git commit -m "feat: add VS Code WordPress publisher extension"
```

4. 推送到 GitHub

```powershell
git push VS_plus_wordpress main
```

如果你希望，我也可以直接帮你完成这一步。

## 7. 当前项目结构

关键文件如下：

- [extension/extension.cjs](./extension/extension.cjs)：VS Code 扩展入口
- [scripts/wp-publish-core.mjs](./scripts/wp-publish-core.mjs)：共享发布核心
- [scripts/wp-vscode-sites.mjs](./scripts/wp-vscode-sites.mjs)：站点配置辅助逻辑
- [scripts/wp-blocks.mjs](./scripts/wp-blocks.mjs)：Markdown 转 WordPress 区块
- [scripts/publish-wp-blocks.mjs](./scripts/publish-wp-blocks.mjs)：CLI 入口
- [wordpress-extension-test.md](./wordpress-extension-test.md)：测试文章

## 8. 当前验证状态

目前已完成本地自动验证：

```powershell
node --test tests/*.test.mjs
node --check .\extension\extension.cjs
node --check .\scripts\publish-wp-blocks.mjs
```

你已经实际验证过：

- 扩展命令可以显示
- 扩展可以读取配置
- 扩展可以成功发布到 WordPress
