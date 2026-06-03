---
title: 文章写作使用指南
slug: fictionsky-writing-guide-vscode
status: publish
categories:
  - test
---
# FictionSky 博客文章写作使用文档

这份文档整理本站当前 Argon 主题、额外 CSS、页首页尾脚本和 KaTeX 插件可以在文章中使用的写法。本文前面会先说明可复用的 VS Code 发布思路，后面再结合本站当前实现说明具体写法。写文章时优先使用你的发布流程已经支持的语法，需要更自由的排版时，再使用 HTML。

本站当前推荐写法：

- `render{ ... }`：渲染 Markdown、标题、列表、链接、表格、脚注这类正文内容。
- `shortcode{ ... }`：渲染纯短代码内容。
- `code js{ ... }`：生成原生代码块，`js` 可以替换成 `python`、`cpp`、`bash`、`text` 等语言名。
- `html{ ... }`：插入自定义 HTML。
- `math{ ... }`：生成块级 KaTeX 公式。

使用规则：

- 开始行必须单独占一行，例如 `render{`、`code js{`。
- 结束行 `}` 也必须单独占一行。
- 这套简写当前不支持嵌套；如果一个块里面还要再放代码块或另一层函数块，继续使用旧的围栏写法。
- 如果 `code ...{}` 里面的代码本身会出现“单独一行的 `}`”，也建议改用旧的围栏写法。
- 旧的 ` ```wp-render ` 仍然兼容，但新文章优先使用这里的函数式写法。

对当前站点的发布建议：

- 在 VS Code 里写作时，优先使用上面的函数式写法，不必再手写 ` ```wp-render `。
- 示例里的短代码如果只是想展示给读者看，请放进代码块；如果要渲染效果，就使用 `shortcode{}` 或 `render{}`。
- 颜色类、徽章类依赖站点额外 CSS；换主题或删除额外 CSS 后可能失效。

## VS Code 通用发布到 WordPress

下面这部分尽量写成通用流程，适用于大多数“VS Code 写 Markdown + 本地发布脚本 + WordPress REST API”的方案。具体到某个项目时，命令名、配置项名、支持语法和字段范围可能略有不同。

### 通用发布链路

一套比较稳定的 VS Code 发布链路通常是：

1. 在 VS Code 里写 Markdown 原稿。
2. 用 frontmatter 保存文章标题、slug、状态、分类、标签等元信息。
3. 用本地脚本把正文转换成 WordPress 能接收的内容格式。
4. 用 WordPress REST API 把文章创建到站点，或更新到已有文章。
5. 先发草稿检查，再正式发布。

如果你的网站主题或站点插件本身支持短代码、KaTeX、代码高亮、自定义 HTML，这些内容也可以一起放进 Markdown 原稿里，由发布脚本统一处理。

### 先准备环境

通用情况下，通常需要准备下面几项：

- 一套可运行发布脚本的本地环境，例如 Node.js。
- 一个有文章编辑权限的 WordPress 账号。
- 该账号的应用密码。
- 站点 REST API 地址，常见形式是 `https://你的站点/wp-json/wp/v2`。
- 一个能把 Markdown 文件提交给脚本的命令入口，例如 `npm script`、`node 脚本`、`pnpm script` 或 VS Code 任务。

配置保存方式常见有三类：

- VS Code 用户设置。
- 环境变量。
- 项目内配置文件。

不管配置具体放在哪里，实际都需要这几类信息：

- `siteUrl`：站点地址。
- `apiUrl`：WordPress REST API 地址。
- `user`：WordPress 用户名。
- `appPassword`：WordPress 应用密码。

如果你的脚本走环境变量，常见写法会是这样：

code powershell{
$env:WP_BASE_URL = "https://example.com"
$env:WP_API_URL = "https://example.com/wp-json/wp/v2"
$env:WP_USER = "你的 WordPress 用户名"
$env:WP_APP_PASSWORD = "你的应用密码"
}

如果你的脚本走 VS Code 配置或项目配置文件，字段名不一定和这里完全一样，但含义通常就是上面这四类。

### 文章文件怎么写

通用发布脚本一般都会读取 Markdown 顶部的 YAML frontmatter。最常见的字段是：

- `title`
- `slug`
- `status`
- `excerpt`
- `categories`
- `tags`

推荐模板：

code yaml{
---
title: 一篇新文章
slug: my-new-post
status: draft
excerpt: 这里是一段文章摘要
categories:
  - algorithm
  - notes
tags:
  - vscode
  - wordpress
---
}

建议注意：

- `slug` 最好在第一次发布前就定好。
- `categories` 和 `tags` 最稳妥的写法是使用 slug，而不是后台显示名称。
- `status` 常见值有 `draft`、`publish`、`pending`、`private`、`future`，但最终支持范围仍以你的脚本为准。
- 如果你的脚本支持定时发布，通常还需要同时提交 `date` 或等价字段。

### 正文写法要和发布脚本对齐

Markdown 能不能顺利发布，不只取决于 WordPress，也取决于你的发布脚本到底认识哪些写法。

常见做法有三种：

1. 只支持标准 Markdown。
2. 支持 Markdown 再加少量扩展语法，例如数学公式、短代码或 HTML。
3. 支持一套项目自定义简写，再由脚本转换成 WordPress 区块。

如果你的项目采用第三种方式，最好统一使用脚本已经支持的简写，不要混用太多互不兼容的写法。这样后续批量发布、批量修文和迁移站点都会轻松很多。

### 通用发布流程

可以按下面顺序发布：

1. 在 VS Code 新建文章 Markdown 文件。
2. 先写好 frontmatter。
3. 正文尽量只使用你的脚本已经支持的语法。
4. 首次发布先用 `draft`。
5. 在项目目录运行发布命令。
6. 检查命令行输出的文章 `id`、`status`、`link`。
7. 去 WordPress 后台或前台确认样式、短代码、公式、代码块和目录跳转。
8. 没问题后再改成 `publish` 重新发布。

常见的命令形式可能长这样：

code text{
npm run publish:wp -- ./article.md
node ./scripts/publish-article.mjs ./article.md
pnpm publish:wp ./article.md
}

具体命令名以你项目里的 `package.json`、VS Code 任务或脚本文件说明为准。

### 常见同步策略

不同发布脚本常见有三种同步思路：

- 总是新建文章。
- 按文章 ID 更新。
- 按 `slug` 查找后更新，没有就新建。

其中最适合写作场景的通常是“按 slug 同步”：

- 没找到同 slug 文章时创建新文章。
- 找到同 slug 文章时更新原文章。

如果你的脚本采用这种模式，`slug` 就等于文章的稳定标识。正文、标题、摘要、分类和标签都可以反复改，但 `slug` 不要频繁变。

## 当前项目的实现示例

本项目当前实现就属于“Markdown + 自定义简写 + WordPress REST API + 按 slug 同步”的模式。

### 当前项目怎么发布

当前项目的命令示例是：

code bash{
npm run publish:wp -- .\你的文章.md
}

也可以直接运行脚本：

code bash{
node .\scripts\publish-wp-blocks.mjs .\你的文章.md
}

当前项目会优先读取环境变量；如果没有，再读取 VS Code 用户设置。当前项目约定的配置项是：

code json{
{
  "wordpress-post.siteUrl": "https://fictionsky.top",
  "wordpress-post.apiUrl": "https://fictionsky.top/wp-json/wp/v2",
  "wordpress-post.authUser": "你的 WordPress 用户名",
  "wordpress-post.authPassword": "你的应用密码"
}
}

### 当前项目支持的正文转换

当前项目不是把 Markdown 原样上传，而是先转成 WordPress 区块：

- `render{}` 会继续按 Markdown 拆成标题、段落、列表、表格、引用、脚注等区块。
- `shortcode{}` 会变成 WordPress Shortcode 区块。
- `html{}` 会变成自定义 HTML 区块。
- `math{}` 和 `$$...$$` 会变成 `[katex display=true]...[/katex]`。
- `code js{}` 和普通围栏代码块会变成 WordPress 原生代码区块。
- 本地 Markdown 图片会先上传到 WordPress 媒体库，再替换成媒体库 URL。
- 旧的 ` ```wp-render ` 语法仍然兼容。

也正因为如此，这份文档后面推荐的 `render{}`、`shortcode{}`、`code ...{}`、`html{}`、`math{}` 才适合当前站点。

### 当前项目的边界

当前项目还需要知道这些限制：

- `render{}`、`shortcode{}`、`html{}`、`math{}`、`code ...{}` 的开始行和结束行都必须独立成行。
- 这套简写不支持嵌套；复杂嵌套结构继续使用旧围栏最稳。
- 如果代码内容里本身会出现“单独一行的 `}`”，请改用普通围栏代码块。
- 本地图片路径会以当前 Markdown 文件所在目录为基准解析。
- 支持上传的本地图片格式包括 `.png`、`.jpg`、`.jpeg`、`.gif`、`.webp` 和 `.svg`。
- 中文或其它非 ASCII 图片文件名上传时会使用 `image-<hash>` 形式的安全文件名，避免多张图片都叫 `image.png`。
- 分类和标签不会自动创建，只会按 slug 去查现有数据。
- 当前只处理文章 `posts`，不是页面 `pages`。
- 当前没有上传特色图、没有设置 `featured_media`、没有设置自定义字段、没有设置发布时间 `date`。
- 当前没有本地预览功能，最终效果仍然要以 WordPress 前台和 Argon 主题实际渲染为准。

### 常见报错怎么看

如果当前项目发布失败，优先检查下面几类问题：

- `Missing WordPress config`：没找到 VS Code 配置或环境变量。
- `Missing required frontmatter field`：frontmatter 缺少 `title` 或 `slug`。
- `Unsupported post status`：`status` 不在当前项目发布脚本支持范围内。
- `categories=xxx is not found or duplicated`：分类 slug 不存在，或同 slug 数据不唯一。
- `tags=xxx is not found or duplicated`：标签 slug 不存在，或同 slug 数据不唯一。
- `Post slug is duplicated`：同一个 slug 查到了多篇文章，需要先清理后台数据。
- `WordPress API error`：账号、应用密码、权限、REST API 地址或站点插件拦截有问题。

### 推荐发布习惯

- 新文章先用 `draft` 发布，确认排版和短代码效果后再改成 `publish`。
- 文档类、题解类文章尽量先在本地保留 Markdown 原稿，不要只在 WordPress 后台改。
- 需要展示短代码原文时，优先放进代码块；这样脚本会自动转义，不会真的执行短代码。
- 真要在正文里直接显示短代码原文而不是执行效果，可以考虑主题里已经支持的 `[noshortcode]...[/noshortcode]`。

## 1. Markdown 基础写作

### 标题

本站页尾脚本会自动给正文标题编号，所以正常写标题即可。

render{
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
}

发布后会自动显示类似：

code text{
1 一级标题
1.1 二级标题
1.1.1 三级标题
}

注意：文章标题本身不会参与这个正文编号。

### 段落、加粗、斜体、删除线

render{
这是一个普通段落。

**这是加粗文字**

*这是斜体文字*

~~这是删除线~~
}

### 引用

render{
> 这是引用内容。
> 可以用于摘录、题记、说明。
}

### 列表

render{
- 第一项
- 第二项
- 第三项

1. 第一步
2. 第二步
3. 第三步
}

### 链接和图片

render{
[FictionSky](https://fictionsky.top)

![图片说明](https://example.com/image.png)

![本地图片示例](./test.png)

![中文文件名图片示例](./图片上传测试.png)
}

上面三种图片写法含义不同：

- `https://example.com/image.png` 是远程图片，发布时会保持原 URL。
- `./test.png` 是本地图片，发布时会先上传到 WordPress 媒体库，再替换成上传后的 URL。
- `./图片上传测试.png` 也是本地图片；如果文件名包含中文，上传到媒体库时会自动改成类似 `image-1a2b3c4d.png` 的安全文件名。

本地图片路径以当前 Markdown 文件所在目录为基准。例如文章文件在 `posts/demo.md`，图片写成 `./images/cover.png`，实际读取的是 `posts/images/cover.png`。

### 表格

render{
| 名称 | 用途 | 备注 |
|---|---|---|
| Argon | 主题 | 提供短代码 |
| KaTeX | 数学公式 | 渲染 LaTeX |
}

## 2. 自动锚点和目录跳转

页尾脚本会扫描带 `id` 的标题，并支持用标题文本跳转。写文章时可以这样做：

render{
## 动态规划

这里是动态规划章节。

[跳到动态规划](#动态规划)
}

建议：

- 标题文字尽量唯一，否则同名标题可能跳到第一个匹配项。
- 中文标题可以直接写在 `#` 后面，例如 `#动态规划`。
- 如果跳转不生效，可以给标题手动加 HTML ID：

html{
<h2 id="dp">动态规划</h2>

<a href="#dp">跳到动态规划</a>
}

## 3. KaTeX 数学公式

本站已安装 KaTeX，可直接写 LaTeX 公式。

### 行内公式

render{
当 $a^2 + b^2 = c^2$ 时，三角形是直角三角形。
}

也可以用：

render{
当 \(a^2 + b^2 = c^2\) 时，三角形是直角三角形。
}

### 块级公式

math{
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
}

### 矩阵

math{
\begin{bmatrix}
1 & 2 \\
3 & 4
\end{bmatrix}
}

### 分段函数

math{
f(x)=
\begin{cases}
x^2, & x \ge 0 \\
-x, & x < 0
\end{cases}
}

注意：

- 如果正文中需要显示美元符号，请写成 `\$`，避免被识别成公式。
- 公式不要放在代码块里，否则不会渲染。

## 4. 代码块和行内代码

### 行内代码

render{
使用 `npm install` 安装依赖。
}

### 普通代码块

推荐写法：

code js{
console.log("Hello FictionSky");
}

### Argon 高亮代码块

主题代码高亮会自动处理 `pre > code`，并增加行号、复制、折行、全屏按钮。写文章时优先使用 `code js{}`、`code python{}` 这种写法，不需要手写最终 HTML。只有在你明确要控制最终结构时，才使用 `html{}`。

如果代码里本身会出现单独一行的 `}`，请改用兼容围栏写法：

```js
function hello() {
  console.log("Hello FictionSky");
}
```

经典编辑器中的“代码块”按钮最终会生成类似：

html{
<pre class="code">console.log("Hello FictionSky");</pre>
}

如果你真的要手写最终 HTML，也可以这样：

html{
<pre><code class="language-python">def hello():
    print("Hello FictionSky")
</code></pre>
}

如果某段代码不想被 Highlight.js 处理，可以加 `no-hljs`：

html{
<pre><code class="no-hljs">这里保持原始样式</code></pre>
}

## 5. 标签短代码 label

用于在正文里插入彩色标签。

可用颜色：

| color | 效果 |
|---|---|
| `indigo` | 主题蓝紫色 |
| `green` | 绿色 |
| `red` | 红色 |
| `orange` | 橙色 |
| `blue` | 蓝色 |

基础写法：

shortcode{
[label color="green"]已完成[/label]
}

圆角胶囊：

shortcode{
[label color="orange" shape="round"]推荐阅读[/label]
}

组合例子：

render{
这篇文章适合 [label color="blue" shape="round"]算法入门[/label] 读者阅读。
}

## 6. 进度条 progressbar

用于展示学习进度、项目进度、阅读进度。

shortcode{
[progressbar progress="75" color="green"]LeetCode 刷题进度[/progressbar]
}

不同颜色：

shortcode{
[progressbar progress="30" color="red"]基础部分[/progressbar]
[progressbar progress="60" color="orange"]进阶部分[/progressbar]
[progressbar progress="90" color="blue"]专题训练[/progressbar]
}

## 7. TODO 复选框 checkbox

用于文章里的计划清单。这个复选框是展示用，不会保存读者点击状态。

shortcode{
[checkbox checked="true"]完成二分查找[/checkbox]
[checkbox checked="false"]完成动态规划专题[/checkbox]
}

推荐用于：

shortcode{
[checkbox checked="true"]读完题目[/checkbox]
[checkbox checked="true"]写出暴力解法[/checkbox]
[checkbox checked="false"]优化到 O(n log n)[/checkbox]
}

## 8. 提示框 alert

适合写“提示、注意、警告、结论”。

可用颜色：`indigo`、`green`、`red`、`orange`、`blue`、`black`。

普通提示：

shortcode{
[alert color="blue"]这是一条普通提示。[/alert]
}

带标题和图标：

shortcode{
[alert color="orange" title="注意" icon="exclamation-triangle"]这里需要考虑边界条件。[/alert]
}

成功提示：

shortcode{
[alert color="green" title="结论" icon="check"]这个算法的时间复杂度是 O(n)。[/alert]
}

图标使用 Font Awesome 4 名称，不需要写 `fa-` 前缀。例如写 `icon="github"`，不要写 `icon="fa-github"`。

## 9. 警告块 admonition

`admonition` 比 `alert` 更适合放较长内容。

shortcode{
[admonition color="blue" title="思路" icon="lightbulb-o"]
先排序，再用双指针从两端向中间收缩。
这样可以把复杂度从 O(n^2) 降到 O(n log n)。
[/admonition]
}

常用类型：

shortcode{
[admonition color="green" title="优点" icon="check"]实现简单，容易验证。[/admonition]

[admonition color="red" title="错误示例" icon="times"]不要在循环里重复排序。[/admonition]

[admonition color="grey" title="补充" icon="info-circle"]这里还可以使用哈希表。[/admonition]
}

## 10. 折叠块 collapse / fold

适合隐藏答案、题解、长代码、补充资料。

默认折叠：

shortcode{
[collapse title="点击查看题解" color="blue" icon="angle-right"]
这里写详细题解。
[/collapse]
}

默认展开：

shortcode{
[collapse title="默认展开的补充说明" collapsed="false" color="green"]
这段内容默认显示。
[/collapse]
}

显示左边框：

shortcode{
[collapse title="带左边框" showleftborder="true" color="orange"]
左侧会有颜色边框。
[/collapse]
}

`fold` 是 `collapse` 的别名：

shortcode{
[fold title="折叠块"]内容[/fold]
}

## 11. 隐藏文字 spoiler / hidden

适合做剧透、答案、提示。

模糊隐藏：

shortcode{
[spoiler]这是被模糊的答案，鼠标悬停后显示。[/spoiler]
}

黑条隐藏：

shortcode{
[hidden type="background"]这是黑条隐藏内容。[/hidden]
}

带提示：

shortcode{
[spoiler tip="鼠标悬停查看"]最终答案是 42。[/spoiler]
}

## 12. GitHub 仓库卡片 github

这是主题内置短代码；你的额外 CSS 对 GitHub 卡片做了颜色和字体优化。

基础写法：

shortcode{
[github author="FictionSky" project="LeetCode_Practice"][/github]
}

迷你卡片：

shortcode{
[github author="FictionSky" project="LeetCode_Practice" size="mini"][/github]
}

前端获取数据，默认写法：

shortcode{
[github author="FictionSky" project="LeetCode_Practice" getdata="frontend"][/github]
}

后端获取数据写法如下；当前 Argon 主题在 PHP 8 下这里有兼容性问题，未修复主题前不要直接渲染：

code text{
[github author="FictionSky" project="LeetCode_Practice" getdata="backend"][/github]
}

建议：

- 常规文章用默认 `frontend` 即可。
- 如果前端请求 GitHub API 失败，需要先修复主题的 PHP 8 兼容性问题，再考虑 `getdata="backend"`。
- 仓库名区分大小写，建议和 GitHub 地址保持一致。

## 13. 视频 video

插入 MP4 视频：

shortcode{
[video url="https://example.com/demo.mp4"][/video]
}

指定尺寸：

shortcode{
[video url="https://example.com/demo.mp4" width="100%" height="auto"][/video]
}

自动播放：

shortcode{
[video url="https://example.com/demo.mp4" autoplay="true"][/video]
}

也可以使用 `mp4` 属性：

shortcode{
[video mp4="https://example.com/demo.mp4"][/video]
}

## 14. 时间线 timeline

用于记录学习路线、项目进展、版本历史。

每行格式：

code text{
时间|标题|内容第一行|内容第二行
}

例子：

shortcode{
[timeline]
2026/05/01|开始刷题|建立 LeetCode_Practice 仓库
2026/05/10|数组专题|完成双指针、滑动窗口
2026/05/20|动态规划|整理状态转移方程
[/timeline]
}

时间中的 `/` 会显示为换行，适合把日期拆成上下两行。

## 15. 友情链接 friendlinks / sfriendlinks

### friendlinks

读取 WordPress 后台“链接/书签”里的友链数据。

shortcode{
[friendlinks style="1" sort="name" order="ASC"][/friendlinks]
}

可用样式：

shortcode{
[friendlinks style="1"][/friendlinks]
[friendlinks style="1-square"][/friendlinks]
[friendlinks style="2"][/friendlinks]
[friendlinks style="2-big"][/friendlinks]
}

如果后台没有配置友链，这个短代码不会显示有效内容。

### sfriendlinks

手写友链，不依赖后台链接管理。

shortcode{
[sfriendlinks]
category|常用网站
link|https://github.com|GitHub|代码托管平台|https://github.githubassets.com/favicons/favicon.png
link|https://leetcode.cn|LeetCode|算法刷题平台|
category|朋友们
link|https://example.com|Example Blog|一个朋友的博客|
[/sfriendlinks]
}

字段说明：

code text{
category|分类名
link|链接|名称|描述|头像地址
}

随机排序：

shortcode{
[sfriendlinks shuffle="true"]
category|朋友们
link|https://example.com|Example|示例站点|
[/sfriendlinks]
}

## 16. 脚注 ref

在正文插入参考文献脚注：

这里引用了一篇资料。
render{
[ref]https://example.com/article[/ref]
}

带 ID 的脚注可以复用同一个编号：

第一次引用。
render{
[ref id="katex"]KaTeX 官方文档：https://katex.org/[/ref]
}

再次引用同一来源。
render{
[ref id="katex"]KaTeX 官方文档：https://katex.org/[/ref]
}

文章底部会自动生成参考文献列表。

## 17. 文章时间短代码

显示发布时间：

shortcode{
[post_time][/post_time]
}

自定义格式：

shortcode{
[post_time format="Y-m-d H:i"][/post_time]
}

显示最后修改时间：

shortcode{
[post_modified_time format="Y-m-d H:i"][/post_modified_time]
}

常用格式：

code text{
Y-m-d        2026-05-29
Y年n月j日    2026年5月29日
Y-m-d H:i   2026-05-29 21:30
}

## 18. 隐藏阅读时间

如果某篇文章不想显示阅读时间，在正文任意位置加入：

shortcode{
[hide_reading_time][/hide_reading_time]
}

## 19. 换行 br

强制插入一个换行：

render{
第一行[br]第二行
}

多数情况下建议直接用 Markdown 空行分段，只有需要强制换行时再用 `[br]`。

## 20. 站点额外徽章样式

你的页尾额外 CSS 定义了 `github-badge` 和 `github-badge-big`，文章中也可以直接使用。

### 小徽章

html{
<span class="github-badge">
  <span class="badge-subject">状态</span>
  <span class="badge-value bg-orange">更新中</span>
</span>
}

### 大徽章

html{
<span class="github-badge-big">
  <span class="badge-subject"><i class="fa fa-code"></i> Project</span>
  <span class="badge-value bg-red">LeetCode Practice</span>
</span>
}

### 带链接的徽章

html{
<span class="github-badge-big">
  <span class="badge-subject"><i class="fa fa-github"></i> GitHub</span>
  <span class="badge-value bg-haze">
    <a href="https://github.com/FictionSky/LeetCode_Practice" target="_blank">Repository</a>
  </span>
</span>
}

可用背景色类：

code text{
bg-orange
bg-red
bg-apricots
bg-casein
bg-shallots
bg-ogling
bg-haze
bg-mountain-terrier
}

## 21. PJAX 跳转按钮

页首脚本定义了：

code js{
pjaxNavigate(url)
}

所以文章里可以做无刷新跳转按钮。

html{
<button class="btn btn-primary" onclick="pjaxNavigate('https://fictionsky.top/')">
  返回首页
</button>
}

也可以做成标签：

html{
<span class="badge badge-primary cursor-pointer" onclick="pjaxNavigate('https://fictionsky.top/')">
  返回首页
</span>
}

建议：

- 外站链接不要用 `pjaxNavigate`，直接用普通 `<a href="...">`。
- 站内文章、分类、页面跳转适合使用 `pjaxNavigate`。

## 22. 常用 HTML 增强写法

### 键盘按键

html{
按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制。
}

### 高亮文字

html{
这是一段 <mark>重点内容</mark>。
}

### 缩写提示

html{
<abbr title="Dynamic Programming">DP</abbr> 是动态规划。
}

### 无下划线链接

html{
<a class="no-hover-underline" href="https://example.com">这个链接悬停时不显示下划线动画</a>
}

## 23. 推荐组合模板

### 算法题解模板

下面这个模板包含嵌套块和带大括号的 C++ 代码，建议直接用兼容围栏写法保存：

~~~~text
render{
## 题目

[label color="blue" shape="round"]数组[/label]
[label color="orange" shape="round"]双指针[/label]

题目描述写在这里。

## 思路

[admonition color="blue" title="核心思路" icon="lightbulb-o"]
先排序，再使用双指针。
[/admonition]

## 代码

code cpp{
class Solution {
public:
    int solve(vector<int>& nums) {
        return 0;
    }
};
}

## 复杂度

- 时间复杂度：$O(n \log n)$
- 空间复杂度：$O(1)$

## 仓库

[github author="FictionSky" project="LeetCode_Practice"][/github]
}
~~~~
### 学习笔记模板

~~~~text
render{
## 今日目标

[checkbox checked="true"]整理概念[/checkbox]
[checkbox checked="false"]完成练习[/checkbox]

[progressbar progress="45" color="orange"]学习进度[/progressbar]

## 关键公式

math{
dp[i] = \max(dp[i-1], dp[i-2] + nums[i])
}

## 易错点

[alert color="red" title="注意" icon="exclamation-triangle"]数组越界是最常见错误。[/alert]

## 补充资料

[collapse title="展开查看参考链接" color="grey"]
[ref]https://katex.org/[/ref]
[ref]https://highlightjs.org/[/ref]
[/collapse]
}
~~~~
### 项目日志模板

~~~~text
render{
## 项目进度

[progressbar progress="80" color="green"]整体进度[/progressbar]

[timeline]
2026/05/25|初始化|创建项目结构
2026/05/27|核心功能|完成文章卡片和 PJAX 跳转
2026/05/29|样式优化|加入自定义光标、背景视频、GitHub 卡片样式
[/timeline]

[github author="FictionSky" project="LeetCode_Practice" size="mini"][/github]
}
~~~~
## 24. 避坑说明

- 短代码属性建议都使用英文双引号，例如 `color="blue"`。
- `alert/admonition/collapse` 的 `icon` 使用 Font Awesome 4 图标名，不写 `fa-` 前缀。
- `friendlinks` 依赖 WordPress 后台链接数据；没有数据时请用 `sfriendlinks`。
- `github` 会请求 GitHub API，网络或 API 限制可能导致卡片短暂显示 Loading 或获取失败。
- KaTeX 的 `$...$` 会和美元符号冲突，普通美元符号写 `\$`。
- `render{}`、`shortcode{}`、`html{}`、`math{}` 适合大多数正文场景；复杂嵌套结构继续使用旧围栏最稳。
- 如果本文档里的短代码示例在发布后被执行了，可以把 `[` 写成 `&#91;` 来强制显示原文。
