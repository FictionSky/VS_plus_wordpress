const fs = require("node:fs");
const { execSync } = require("node:child_process");
const { buildVscePackageCommand, getVsixArtifactPath } = require("./vsix-artifact.cjs");

const outPath = getVsixArtifactPath();

fs.mkdirSync("artifacts", { recursive: true });
execSync(buildVscePackageCommand(outPath), { stdio: "inherit" });
