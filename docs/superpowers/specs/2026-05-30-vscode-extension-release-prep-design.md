# VS Code Extension Release Prep Design

## Summary

Prepare the existing `fictionsky-wordpress-publisher` project for Marketplace-style release readiness without actually publishing it. The work will keep the current extension behavior intact while raising the repository, documentation, packaging metadata, and validation flow to the standard expected of a public VS Code extension repository.

## Goals

- Add a bilingual root `README.md` that works as the Marketplace landing document.
- Make the project look and behave like a real VS Code extension repository ready for public distribution.
- Ensure the extension can be packaged into a `.vsix` and installed locally in VS Code.
- Align repository metadata so the project can later be pushed to `FictionSky/VS_plus_wordpress`.

## Non-Goals

- Do not publish to the VS Code Marketplace in this phase.
- Do not add CI, automated release pipelines, or GitHub Releases in this phase.
- Do not redesign the extension's feature set unless a packaging or release blocker requires a small fix.

## Current State

- The project already contains a working VS Code extension manifest in `package.json`.
- The extension entry point is `extension/extension.cjs`.
- Packaging scripts already exist for `vsce package` and `code --install-extension`.
- Automated tests exist for core publishing logic and command palette contributions.
- The repository is not yet release-ready because key public-facing assets are missing or incomplete, especially `README`, `LICENSE`, `CHANGELOG`, and likely icon/media assets.

## User Decisions Captured

- Release target: Marketplace-ready repository structure, but no actual Marketplace publication yet.
- README strategy: one bilingual `README.md` instead of separate primary language files.
- License: `MIT`.
- GitHub target after local cleanup: `FictionSky/VS_plus_wordpress`.
- GitHub remote setup happens after the local project reaches release-ready state.

## Approach Options Considered

### Option 1: Minimal packaging cleanup

Only add the missing README, license, and changelog, then verify packaging.

Pros:
- Fastest path.
- Lowest edit surface.

Cons:
- Leaves the extension feeling unfinished in Marketplace and GitHub contexts.
- Higher chance of future cleanup before actual release.

### Option 2: Balanced release preparation

Add the public-facing docs and release assets, clean up manifest metadata, verify packaging and installation, and keep the scope limited to release blockers.

Pros:
- Matches the user's goal closely.
- Produces a repository that feels publishable without over-investing in automation.
- Keeps risk manageable.

Cons:
- Slightly more work than minimal cleanup.

### Option 3: Full release operations setup

Add docs, assets, manifest cleanup, CI, release workflow documentation, and version automation.

Pros:
- Most complete long-term release setup.

Cons:
- Exceeds the requested scope.
- Adds maintenance overhead before the project has even been pushed publicly.

### Recommendation

Use Option 2. It delivers a realistic release-ready extension repository while staying focused on the user's immediate goal.

## Design

### Repository Structure

The release-prep work should result in the following public-facing repository pieces:

- Root `README.md` as a bilingual Marketplace-ready document.
- Root `LICENSE` containing the MIT license text.
- Root `CHANGELOG.md` with an initial `1.0.0` release entry.
- `media/` directory for extension icon and any near-term release assets.
- Existing source folders (`extension/`, `scripts/`, `tests/`) preserved with only targeted metadata-related adjustments.

### README Design

`README.md` should be the single source of truth shown both on GitHub and in VS Code Marketplace.

It should include paired Chinese and English sections for:

- Project overview
- Feature summary
- Installation
- Configuration
- Usage workflow
- Local development and tests
- VSIX packaging and local install verification
- Release readiness notes and repository links

The document should be practical, command-oriented, and easy for a user to follow without reading source code.

### Manifest and Marketplace Metadata

`package.json` should be updated from "internally usable" to "publicly distributable" state.

Expected adjustments:

- Set `"license": "MIT"`.
- Remove `"private": true`.
- Keep `publisher`, `repository`, `homepage`, and `bugs` aligned with `FictionSky/VS_plus_wordpress`.
- Improve description and keywords where helpful, without changing the product scope.
- Add `icon` metadata once an icon file exists.
- Keep activation events and command contributions unchanged unless validation exposes a problem.

The manifest should continue to describe a stable Markdown-to-WordPress publisher extension and avoid speculative features.

### Release Assets

If no suitable icon asset exists, add a simple extension icon under `media/icon.png`.

The icon does not need a full brand system in this phase. It only needs to be clear, clean, and appropriate for Marketplace display. The asset should be included in packaged output and referenced from the manifest.

### Packaging and Installation Flow

The local validation flow should prove that the extension is functionally release-ready:

1. Run automated tests.
2. Package the extension into a `.vsix`.
3. Install the generated `.vsix` into local VS Code with `code --install-extension`.
4. Confirm the extension can be discovered as installed and that the expected commands remain contributed.

Existing scripts may be reused, but they should be reliable and easy to understand from the README.

### Ignore Rules and Artifacts

`.vscodeignore` should exclude development-only files while preserving release-critical assets such as:

- `README.md`
- `LICENSE`
- `CHANGELOG.md`
- `media/icon.png`
- runtime source files needed by the extension

Generated `.vsix` files should remain ignored in Git and kept as local build artifacts rather than committed into the repository.

### Testing Strategy

Existing tests remain the foundation.

If needed, add small metadata-oriented tests for:

- required manifest fields
- icon path presence
- release-facing command visibility assumptions

Testing should stay lightweight and focus on release confidence rather than exhaustive extension integration coverage.

### GitHub Push Boundary

This design stops at a clean local repository that is ready to push publicly.

The later GitHub step should:

- keep the repository metadata consistent with `FictionSky/VS_plus_wordpress`
- push source, docs, and release assets
- avoid committing generated `.vsix` binaries unless the release strategy later changes

## Error Handling and Risk Management

- If packaging fails because of missing metadata or assets, fix the manifest or asset paths first.
- If installation fails because the `code` CLI is unavailable, note that limitation and preserve the packaged `.vsix` as evidence of packaging success.
- If existing uncommitted workspace changes overlap with release-prep files, review and integrate them carefully rather than overwriting them.
- If README or asset decisions expose a branding gap, prefer a simple consistent solution over introducing a larger design project.

## Acceptance Criteria

The release-prep work is complete when all of the following are true:

- A bilingual `README.md` exists at the repository root.
- `LICENSE` is present and MIT-aligned.
- `CHANGELOG.md` is present with an initial release entry.
- `package.json` reflects Marketplace-ready metadata and no longer marks the project private.
- Required release assets such as icon/media files are present and correctly referenced.
- Automated tests pass.
- A `.vsix` can be generated locally.
- Local installation via `code --install-extension` succeeds, or any environment limitation is clearly documented.
- The repository is in a clean, understandable state for a later push to `FictionSky/VS_plus_wordpress`.

## Implementation Notes

- Treat existing source behavior as stable unless a release blocker proves otherwise.
- Prefer focused edits over broad refactors.
- Keep all newly added documentation consistent with the current extension commands and settings.
- The implementation plan should separate documentation, metadata cleanup, asset creation, validation, and Git preparation into small testable tasks.
