import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";

const packageJsonPath = new URL("../package.json", import.meta.url);

async function readManifest() {
  return JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
}

test("publish commands are always available from the command palette", async () => {
  const manifest = await readManifest();
  const commandPaletteEntries = manifest.contributes?.menus?.commandPalette || [];

  const publishDraft = commandPaletteEntries.find((item) => item.command === "wordpressPublisher.publishDraft");
  const publishNow = commandPaletteEntries.find((item) => item.command === "wordpressPublisher.publishNow");

  assert.ok(publishDraft, "publish draft command should be contributed to the command palette");
  assert.ok(publishNow, "publish now command should be contributed to the command palette");
  assert.ok(!("when" in publishDraft), "publish draft command should not depend on editorTextFocus");
  assert.ok(!("when" in publishNow), "publish now command should not depend on editorTextFocus");
});

test("manifest is ready for public distribution", async () => {
  const manifest = await readManifest();

  assert.equal(manifest.private, undefined, "public extension manifest should omit private=true");
  assert.equal(manifest.publisher, "fictionsky");
  assert.equal(manifest.license, "MIT");
  assert.equal(manifest.repository?.url, "https://github.com/FictionSky/VS_plus_wordpress.git");
  assert.equal(manifest.homepage, "https://github.com/FictionSky/VS_plus_wordpress");
  assert.equal(manifest.bugs?.url, "https://github.com/FictionSky/VS_plus_wordpress/issues");
  assert.ok(Array.isArray(manifest.keywords), "keywords should be defined");
  assert.ok(manifest.keywords.includes("wordpress"), "keywords should include wordpress");
  assert.ok(manifest.keywords.includes("markdown"), "keywords should include markdown");
  assert.ok(manifest.scripts["package:vsix"], "package:vsix script should exist");
  assert.ok(manifest.scripts["install:vsix"], "install:vsix script should exist");
  assert.equal(manifest.devDependencies["@vscode/vsce"], "^3.6.2");
});
