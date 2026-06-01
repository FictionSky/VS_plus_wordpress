# WordPress Local Image Upload Design

## Goal

When publishing Markdown to WordPress, local Markdown image references should be uploaded to the WordPress media library and replaced with the uploaded media URL before the post content is built.

## Scope

- Upload local image references written as `![alt](./path/to/image.png)`.
- Resolve relative image paths from the Markdown file directory.
- Leave `http://` and `https://` image URLs unchanged.
- Fail before publishing the post if a referenced local image cannot be read or if WordPress rejects the media upload.
- Support common image extensions: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, and `.svg`.
- Keep the post body flow unchanged after replacement: Markdown is still converted through the existing WordPress block builder.

## Architecture

Add a focused media helper module that scans Markdown, uploads local image references through the WordPress REST media endpoint, and returns Markdown with uploaded URLs substituted. `publishMarkdownToWordPress` will call this helper before `buildPostPayload` when a `markdownPath` is available. The VS Code command and CLI will pass the current Markdown file path into the core publish function.

## Data Flow

1. VS Code or CLI reads Markdown and passes `markdownPath`.
2. The publish core normalizes the WordPress config.
3. Local image references are resolved from `path.dirname(markdownPath)`.
4. Each local image is uploaded with `POST /media`.
5. The returned `source_url` replaces the original Markdown image URL.
6. The existing Markdown-to-block conversion and post create/update request runs normally.

## Error Handling

If a local image path is present but `markdownPath` is missing, publishing fails with a clear error. Missing files, unsupported extensions, failed uploads, and media responses without `source_url` also fail before the post mutation request.

## Testing

Tests should cover upload and replacement, remote URL passthrough, missing `markdownPath`, missing files, and CLI/VS Code path forwarding where practical.
