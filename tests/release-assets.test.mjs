import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = path.join(rootDir, "package.json");
const changelogPath = path.join(rootDir, "CHANGELOG.md");
const licensePath = path.join(rootDir, "LICENSE");
const readmePath = path.join(rootDir, "README.md");
const vscodeIgnorePath = path.join(rootDir, ".vscodeignore");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

test("release assets exist and are not excluded from packaging", async () => {
  const manifest = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  const ignoreFile = await fs.readFile(vscodeIgnorePath, "utf8");
  const readme = await fs.readFile(readmePath, "utf8");
  const iconPath = path.join(rootDir, manifest.icon || "");

  assert.equal(manifest.icon, "media/icon.png");
  assert.equal(await exists(changelogPath), true, "CHANGELOG.md should exist");
  assert.equal(await exists(licensePath), true, "LICENSE should exist");
  assert.equal(await exists(iconPath), true, "icon file should exist");
  assert.ok(readme.includes("## 中文说明"), "README should include a Chinese section");
  assert.ok(readme.includes("## English"), "README should include an English section");
  assert.ok(!ignoreFile.includes("CHANGELOG.md"), "CHANGELOG.md must be packaged");
  assert.ok(!ignoreFile.includes("LICENSE"), "LICENSE must be packaged");
  assert.ok(!ignoreFile.includes("media/"), "media assets must be packaged");
  assert.ok(ignoreFile.includes(".npm-cache/"), "npm cache must be excluded from packaging");
});
