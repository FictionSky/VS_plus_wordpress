import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWpJsonResponse } from "../scripts/wp-api-response.mjs";
import { buildPostPayload, markdownToWpBlocks, parseFrontmatter } from "../scripts/wp-blocks.mjs";

test("parses frontmatter and keeps markdown body", () => {
  const parsed = parseFrontmatter(`---
title: Test
slug: test-post
status: publish
categories:
  - leetcode
tags: [vscode, wordpress]
---

Body`);

  assert.deepEqual(parsed.data, {
    title: "Test",
    slug: "test-post",
    status: "publish",
    categories: ["leetcode"],
    tags: ["vscode", "wordpress"],
  });
  assert.equal(parsed.body.trim(), "Body");
});

test("parses frontmatter when markdown starts with UTF-8 BOM", () => {
  const parsed = parseFrontmatter(`\uFEFF---
title: BOM Test
slug: bom-test
---

Body`);

  assert.equal(parsed.data.title, "BOM Test");
  assert.equal(parsed.data.slug, "bom-test");
  assert.equal(parsed.body.trim(), "Body");
});

test("converts headings paragraphs code and shortcode to WordPress blocks", () => {
  const html = markdownToWpBlocks(`## Title

Text with **bold** and \`code\`.

[katex display=true]\\int_0^1 x^2 dx[/katex]

\`\`\`python
print("hello")
\`\`\``);

  assert.match(html, /<!-- wp:heading -->\n<h2>Title<\/h2>\n<!-- \/wp:heading -->/);
  assert.match(html, /<!-- wp:paragraph -->\n<p>Text with <strong>bold<\/strong> and <code>code<\/code>\.<\/p>\n<!-- \/wp:paragraph -->/);
  assert.match(html, /<!-- wp:shortcode -->\n\[katex display=true\]\\int_0\^1 x\^2 dx\[\/katex\]\n<!-- \/wp:shortcode -->/);
  assert.match(html, /<!-- wp:code {"className":"language-python"} -->\n<pre class="wp-block-code language-python"><code>print\("hello"\)<\/code><\/pre>\n<!-- \/wp:code -->/);
});

test("renders fenced code as native WordPress code blocks", () => {
  const html = markdownToWpBlocks(`\`\`\`js
console.log("ok");
\`\`\``);

  assert.match(html, /<!-- wp:code {"className":"language-js"} -->\n<pre class="wp-block-code language-js"><code>console\.log\("ok"\);<\/code><\/pre>\n<!-- \/wp:code -->/);
  assert.doesNotMatch(html, /<code class="language-js">/);
});

test("escapes shortcode brackets inside code blocks to prevent execution", () => {
  const html = markdownToWpBlocks(`\`\`\`text
[github author="FictionSky" project="LeetCode_Practice" getdata="backend"][/github]
\`\`\``);

  assert.match(html, /<code>&#91;github author="FictionSky" project="LeetCode_Practice" getdata="backend"&#93;&#91;\/github&#93;<\/code>/);
  assert.doesNotMatch(html, /\[github author=/);
});

test("renders wp-render fenced markdown as real blocks", () => {
  const html = markdownToWpBlocks(`\`\`\`\`wp-render
## Rendered Title

[checkbox checked="true"]Done[/checkbox]

\`\`\`js
console.log("ok");
\`\`\`
\`\`\`\``);

  assert.match(html, /<!-- wp:heading -->\n<h2>Rendered Title<\/h2>\n<!-- \/wp:heading -->/);
  assert.match(html, /<!-- wp:shortcode -->\n\[checkbox checked="true"\]Done\[\/checkbox\]\n<!-- \/wp:shortcode -->/);
  assert.match(html, /<!-- wp:code {"className":"language-js"} -->\n<pre class="wp-block-code language-js"><code>console\.log\("ok"\);<\/code><\/pre>\n<!-- \/wp:code -->/);
});

test("converts render shorthand blocks using wp-render behavior", () => {
  const html = markdownToWpBlocks(`Footnote text.
render{
[ref]https://example.com/article[/ref]
}`);

  assert.match(html, /<!-- wp:shortcode -->\nFootnote text\.\[ref\]https:\/\/example\.com\/article\[\/ref\]\n<!-- \/wp:shortcode -->/);
});

test("converts html shorthand blocks to WordPress html blocks", () => {
  const html = markdownToWpBlocks(`html{
<kbd>Ctrl</kbd>
}`);

  assert.match(html, /<!-- wp:html -->\n<kbd>Ctrl<\/kbd>\n<!-- \/wp:html -->/);
});

test("converts code shorthand blocks to native WordPress code blocks", () => {
  const html = markdownToWpBlocks(`code js{
console.log("ok");
}`);

  assert.match(html, /<!-- wp:code {"className":"language-js"} -->\n<pre class="wp-block-code language-js"><code>console\.log\("ok"\);<\/code><\/pre>\n<!-- \/wp:code -->/);
});

test("converts shortcode shorthand blocks to WordPress shortcode blocks", () => {
  const html = markdownToWpBlocks(`shortcode{
[github author="FictionSky" project="LeetCode_Practice"][/github]
}`);

  assert.match(html, /<!-- wp:shortcode -->\n\[github author="FictionSky" project="LeetCode_Practice"\]\[\/github\]\n<!-- \/wp:shortcode -->/);
});

test("converts math shorthand blocks to display KaTeX shortcode blocks", () => {
  const html = markdownToWpBlocks(`math{
dp[i] = max(dp[i - 1], nums[i])
}`);

  assert.match(html, /<!-- wp:shortcode -->\n\[katex display=true\]dp\[i\] = max\(dp\[i - 1\], nums\[i\]\)\[\/katex\]\n<!-- \/wp:shortcode -->/);
});

test("does not expand shorthand syntax inside fenced code", () => {
  const html = markdownToWpBlocks(`\`\`\`text
render{
literal
}
\`\`\``);

  assert.match(html, /<code>render\{\nliteral\n\}<\/code>/);
  assert.doesNotMatch(html, /<!-- wp:paragraph -->\n<p>literal<\/p>/);
});

test("attaches a shortcode-only wp-render fence to the preceding paragraph", () => {
  const html = markdownToWpBlocks(`Footnote text.
\`\`\`wp-render
[ref]https://example.com/article[/ref]
\`\`\``);

  assert.match(html, /<!-- wp:shortcode -->\nFootnote text\.\[ref\]https:\/\/example\.com\/article\[\/ref\]\n<!-- \/wp:shortcode -->/);
  assert.doesNotMatch(html, /<!-- wp:paragraph -->\n<p>Footnote text\.<\/p>\n<!-- \/wp:paragraph -->/);
});

test("converts display math fences to KaTeX shortcode blocks", () => {
  const html = markdownToWpBlocks(`$$
dp[i] = \\max(dp[i-1], dp[i-2] + nums[i])
$$`);

  assert.match(html, /<!-- wp:shortcode -->\n\[katex display=true\]dp\[i\] = \\max\(dp\[i-1\], dp\[i-2\] \+ nums\[i\]\)\[\/katex\]\n<!-- \/wp:shortcode -->/);
});

test("converts inline dollar math to KaTeX shortcode text", () => {
  const html = markdownToWpBlocks(`- 时间复杂度：$O(n \\log n)$`);

  assert.match(html, /<li>时间复杂度：\[katex\]O\(n \\log n\)\[\/katex\]<\/li>/);
});

test("converts inline escaped parenthesis math to KaTeX shortcode text", () => {
  const html = markdownToWpBlocks(`当 \\(a^2 + b^2 = c^2\\) 时，三角形是直角三角形。`);

  assert.match(html, /<p>当 \[katex\]a\^2 \+ b\^2 = c\^2\[\/katex\] 时，三角形是直角三角形。<\/p>/);
});

test("converts html fences to WordPress html blocks", () => {
  const html = markdownToWpBlocks(`\`\`\`html
<kbd>Ctrl</kbd>
\`\`\``);

  assert.match(html, /<!-- wp:html -->\n<kbd>Ctrl<\/kbd>\n<!-- \/wp:html -->/);
});

test("converts markdown tables to WordPress table blocks", () => {
  const html = markdownToWpBlocks(`| 名称 | 用途 |
|---|---|
| Argon | 主题 |`);

  assert.match(html, /<!-- wp:table -->/);
  assert.match(html, /<figure class="wp-block-table"><table><thead><tr><th>名称<\/th><th>用途<\/th><\/tr><\/thead><tbody><tr><td>Argon<\/td><td>主题<\/td><\/tr><\/tbody><\/table><\/figure>/);
});

test("builds post payload from frontmatter and body", () => {
  const payload = buildPostPayload(`---
title: Demo
slug: demo
---

Paragraph`);

  assert.equal(payload.frontmatter.title, "Demo");
  assert.match(payload.content, /<!-- wp:paragraph -->/);
});

test("recovers JSON when WordPress response has plugin noise before JSON object", () => {
  const parsed = parseWpJsonResponse('-1,0 | -1,0 | {"id":231,"status":"publish"}');

  assert.equal(parsed.id, 231);
  assert.equal(parsed.status, "publish");
});
