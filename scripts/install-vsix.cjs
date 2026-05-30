const { execSync } = require("node:child_process");
const { buildInstallVsixCommand, getVsixArtifactPath } = require("./vsix-artifact.cjs");

execSync(buildInstallVsixCommand(getVsixArtifactPath()), { stdio: "inherit" });
