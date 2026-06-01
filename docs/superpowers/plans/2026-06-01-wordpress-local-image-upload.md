# WordPress Local Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload local Markdown images to WordPress media before publishing posts.

**Architecture:** Add a small `scripts/wp-media.mjs` helper for image discovery, path resolution, MIME selection, upload, and Markdown replacement. Wire it into `scripts/wp-publish-core.mjs`, then pass `markdownPath` from the VS Code extension and CLI.

**Tech Stack:** Node.js ESM, VS Code extension CommonJS entry point, WordPress REST API, `node:test`.

---

### Task 1: Media Upload Helper

**Files:**
- Create: `scripts/wp-media.mjs`
- Test: `tests/wp-media.test.mjs`

- [ ] Write failing tests for replacing local image URLs with uploaded media URLs while leaving remote URLs unchanged.
- [ ] Run `cmd /c npm test` and confirm the new tests fail because the helper does not exist.
- [ ] Implement the helper with filesystem reads, content type detection, media endpoint upload, and Markdown replacement.
- [ ] Run `cmd /c npm test` and confirm the media tests pass.

### Task 2: Publishing Integration

**Files:**
- Modify: `scripts/wp-publish-core.mjs`
- Modify: `scripts/publish-wp-blocks.mjs`
- Modify: `extension/extension.cjs`
- Test: `tests/wp-publish-core.test.mjs`

- [ ] Write failing publish-core tests that prove local images are uploaded before the post payload is sent.
- [ ] Run `cmd /c npm test` and confirm the integration tests fail for the missing behavior.
- [ ] Call the media helper from `publishMarkdownToWordPress` and pass `markdownPath` from CLI and VS Code.
- [ ] Run `cmd /c npm test` and confirm all tests pass.

### Task 3: Documentation

**Files:**
- Modify: `README.md`

- [ ] Document local image upload behavior and remote image passthrough in the English section and, if encoding allows safe editing, the Chinese section.
- [ ] Run `cmd /c npm test` once more after documentation changes.
