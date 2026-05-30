const fs = require("node:fs");
const path = require("node:path");

function readManifest(cwd = process.cwd()) {
  const packageJsonPath = path.join(cwd, "package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

function buildVsixArtifactPath(manifest) {
  if (!manifest?.name || !manifest?.version) {
    throw new Error("package.json must define name and version.");
  }

  return `artifacts/${manifest.name}-${manifest.version}.vsix`;
}

function getVsixArtifactPath(cwd = process.cwd()) {
  return buildVsixArtifactPath(readManifest(cwd));
}

function getVsceExecutablePath(cwd = process.cwd()) {
  const executable = process.platform === "win32" ? "vsce.cmd" : "vsce";
  return path.join(cwd, "node_modules", ".bin", executable);
}

function buildVscePackageCommand(outPath, cwd = process.cwd()) {
  return `"${getVsceExecutablePath(cwd)}" package --out "${outPath}"`;
}

function buildInstallVsixCommand(vsixPath) {
  return `code --install-extension "${vsixPath}" --force`;
}

module.exports = {
  buildInstallVsixCommand,
  buildVscePackageCommand,
  buildVsixArtifactPath,
  getVsixArtifactPath,
  getVsceExecutablePath,
  readManifest,
};
