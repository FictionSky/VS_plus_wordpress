import assert from "node:assert/strict";
import { test } from "node:test";
import { publishMarkdownToWordPress } from "../scripts/wp-publish-core.mjs";

test("updates an existing post by slug and honors status override", async () => {
  const calls = [];
  const responses = [
    [{ id: 42, slug: "demo-post", status: "publish", link: "https://example.com/demo-post" }],
    [{ id: 5, slug: "notes" }],
    [{ id: 9, slug: "vscode" }],
    { id: 42, slug: "demo-post", status: "draft", link: "https://example.com/demo-post" },
  ];

  const result = await publishMarkdownToWordPress({
    markdown: `---
title: Demo Post
slug: demo-post
status: publish
categories:
  - notes
tags:
  - vscode
---

render{
Hello **WordPress**
}`,
    config: {
      apiUrl: "https://example.com/wp-json/wp/v2/",
      user: "writer",
      password: "app-password",
    },
    statusOverride: "draft",
    fetchImpl: async (url, options = {}) => {
      calls.push({
        url: url.toString(),
        method: options.method || "GET",
        body: options.body || "",
        authorization: options.headers?.Authorization || "",
      });

      return {
        ok: true,
        status: 200,
        statusText: "OK",
        async text() {
          return JSON.stringify(responses.shift());
        },
      };
    },
  });

  assert.equal(result.post.id, 42);
  assert.equal(result.post.status, "draft");
  assert.match(result.content, /<!-- wp:paragraph -->/);
  assert.equal(calls.length, 4);
  assert.match(calls[0].url, /\/posts\?slug=demo-post/);
  assert.match(calls[1].url, /\/categories\?slug=notes/);
  assert.match(calls[2].url, /\/tags\?slug=vscode/);
  assert.match(calls[3].url, /\/posts\/42\?_fields=id%2Cslug%2Cstatus%2Clink/);
  assert.equal(JSON.parse(calls[3].body).status, "draft");
  assert.equal(JSON.parse(calls[3].body).categories[0], 5);
  assert.equal(JSON.parse(calls[3].body).tags[0], 9);
  assert.match(calls[3].authorization, /^Basic /);
});

test("creates a new post and accepts single-string category and tag slugs", async () => {
  const calls = [];
  const responses = [
    [],
    [{ id: 3, slug: "guides" }],
    [{ id: 8, slug: "wordpress" }],
    { id: 77, slug: "fresh-post", status: "publish", link: "https://example.com/fresh-post" },
  ];

  const result = await publishMarkdownToWordPress({
    markdown: `---
title: Fresh Post
slug: fresh-post
categories: guides
tags: wordpress
excerpt: A short summary
---

Paragraph`,
    config: {
      apiUrl: "https://example.com/wp-json/wp/v2",
      user: "writer",
      password: "app-password",
    },
    fetchImpl: async (url, options = {}) => {
      calls.push({
        url: url.toString(),
        method: options.method || "GET",
        body: options.body || "",
      });

      return {
        ok: true,
        status: 200,
        statusText: "OK",
        async text() {
          return JSON.stringify(responses.shift());
        },
      };
    },
  });

  assert.equal(result.post.id, 77);
  assert.equal(result.post.status, "publish");
  assert.match(calls[3].url, /\/posts\?_fields=id%2Cslug%2Cstatus%2Clink/);
  const body = JSON.parse(calls[3].body);
  assert.equal(body.title, "Fresh Post");
  assert.equal(body.slug, "fresh-post");
  assert.equal(body.excerpt, "A short summary");
  assert.equal(body.categories[0], 3);
  assert.equal(body.tags[0], 8);
  assert.match(result.content, /<!-- wp:paragraph -->/);
});
