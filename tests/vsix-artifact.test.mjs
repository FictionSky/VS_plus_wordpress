import assert from "node:assert/strict";
import { test } from "node:test";
import vsixArtifactHelpers from "../scripts/vsix-artifact.cjs";

const {
  buildInstallVsixCommand,
  buildVscePackageCommand,
  buildVsixArtifactPath,
  getVsceExecutablePath,
} = vsixArtifactHelpers;

test("builds the VSIX artifact path from the extension name and version", () => {
  assert.equal(
    buildVsixArtifactPath({
      name: "fictionsky-wordpress-publisher",
      version: "1.2.3",
    }),
    "artifacts/fictionsky-wordpress-publisher-1.2.3.vsix",
  );
});

test("resolves the local vsce executable path", () => {
  const executablePath = getVsceExecutablePath("D:\\repo");

  assert.match(executablePath, /node_modules[\\/]\.bin[\\/]vsce(\.cmd)?$/);
});

test("builds a shell command for packaging a versioned VSIX", () => {
  assert.equal(
    buildVscePackageCommand("artifacts/demo.vsix", "D:\\repo"),
    "\"D:\\repo\\node_modules\\.bin\\vsce.cmd\" package --out \"artifacts/demo.vsix\"",
  );
});

test("builds a shell command for installing a versioned VSIX", () => {
  assert.equal(
    buildInstallVsixCommand("artifacts/demo.vsix"),
    "code --install-extension \"artifacts/demo.vsix\" --force",
  );
});
