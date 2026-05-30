import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";

const packageJsonPath = new URL("../package.json", import.meta.url);

test("publish commands are always available from the command palette", async () => {
  const manifest = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  const commandPaletteEntries = manifest.contributes?.menus?.commandPalette || [];

  const publishDraft = commandPaletteEntries.find((item) => item.command === "wordpressPublisher.publishDraft");
  const publishNow = commandPaletteEntries.find((item) => item.command === "wordpressPublisher.publishNow");

  assert.ok(publishDraft, "publish draft command should be contributed to the command palette");
  assert.ok(publishNow, "publish now command should be contributed to the command palette");
  assert.ok(!("when" in publishDraft), "publish draft command should not depend on editorTextFocus");
  assert.ok(!("when" in publishNow), "publish now command should not depend on editorTextFocus");
});
