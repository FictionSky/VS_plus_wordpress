import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { uploadLocalMarkdownImages } from "../scripts/wp-media.mjs";

test("uploads local markdown images and leaves remote images unchanged", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wp-media-"));
  const imagePath = path.join(tempDir, "cover.png");
  await fs.writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

  const requests = [];
  const result = await uploadLocalMarkdownImages({
    markdown: `![Cover](./cover.png)\n\n![Remote](https://cdn.example.com/remote.jpg)`,
    markdownPath: path.join(tempDir, "post.md"),
    config: {
      apiUrl: "https://example.com/wp-json/wp/v2",
      user: "editor",
      password: "app-password",
    },
    fetchImpl: async (url, options) => {
      requests.push({ url: url.toString(), options });
      return jsonResponse({
        id: 12,
        source_url: "https://example.com/wp-content/uploads/cover.png",
      });
    },
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://example.com/wp-json/wp/v2/media");
  assert.equal(requests[0].options.method, "POST");
  assert.equal(requests[0].options.headers["Content-Disposition"], 'attachment; filename="cover.png"');
  assert.equal(requests[0].options.headers["Content-Type"], "image/png");
  assert.equal(result.markdown, `![Cover](https://example.com/wp-content/uploads/cover.png)\n\n![Remote](https://cdn.example.com/remote.jpg)`);
  assert.deepEqual(result.uploads, [
    {
      originalUrl: "./cover.png",
      uploadedUrl: "https://example.com/wp-content/uploads/cover.png",
      id: 12,
    },
  ]);
});

test("requires markdownPath when local images are present", async () => {
  await assert.rejects(
    uploadLocalMarkdownImages({
      markdown: "![Cover](./cover.png)",
      markdownPath: "",
      config: {
        apiUrl: "https://example.com/wp-json/wp/v2",
        user: "editor",
        password: "app-password",
      },
      fetchImpl: async () => jsonResponse({ source_url: "https://example.com/cover.png" }),
    }),
    /Cannot upload local image ".\/cover\.png" without markdownPath/,
  );
});

test("reports missing local image files", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wp-media-"));

  await assert.rejects(
    uploadLocalMarkdownImages({
      markdown: "![Cover](./missing.png)",
      markdownPath: path.join(tempDir, "post.md"),
      config: {
        apiUrl: "https://example.com/wp-json/wp/v2",
        user: "editor",
        password: "app-password",
      },
      fetchImpl: async () => jsonResponse({ source_url: "https://example.com/cover.png" }),
    }),
    /Cannot read local image ".\/missing\.png"/,
  );
});

test("uses unique ASCII-safe upload filenames for non-ASCII local image paths", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wp-media-"));
  await fs.writeFile(path.join(tempDir, "图片上传测试.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  await fs.writeFile(path.join(tempDir, "另一张图片.png"), Buffer.from([0x89, 0x50, 0x4e, 0x48]));

  const requests = [];
  await uploadLocalMarkdownImages({
    markdown: "![图片上传测试](./图片上传测试.png)\n\n![另一张图片](./另一张图片.png)",
    markdownPath: path.join(tempDir, "post.md"),
    config: {
      apiUrl: "https://example.com/wp-json/wp/v2",
      user: "editor",
      password: "app-password",
    },
    fetchImpl: async (url, options) => {
      requests.push({ url: url.toString(), options });
      return jsonResponse({
        id: 19 + requests.length,
        source_url: `https://example.com/wp-content/uploads/image-${requests.length}.png`,
      });
    },
  });

  const firstName = requests[0].options.headers["Content-Disposition"];
  const secondName = requests[1].options.headers["Content-Disposition"];

  assert.match(firstName, /^attachment; filename="image-[a-f0-9]{8}\.png"$/);
  assert.match(secondName, /^attachment; filename="image-[a-f0-9]{8}\.png"$/);
  assert.notEqual(firstName, secondName);
});

function jsonResponse(data, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    async text() {
      return JSON.stringify(data);
    },
  };
}
