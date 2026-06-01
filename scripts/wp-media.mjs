import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { parseWpJsonResponse } from "./wp-api-response.mjs";

const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const CONTENT_TYPES = new Map([
  [".gif", "image/gif"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

export async function uploadLocalMarkdownImages({
  markdown,
  markdownPath = "",
  config,
  fetchImpl = globalThis.fetch,
}) {
  const uploads = [];
  let replacedMarkdown = "";
  let lastIndex = 0;

  for (const match of markdown.matchAll(IMAGE_PATTERN)) {
    const [fullMatch, altText, imageUrl] = match;
    replacedMarkdown += markdown.slice(lastIndex, match.index);
    lastIndex = match.index + fullMatch.length;

    if (!isLocalImageUrl(imageUrl)) {
      replacedMarkdown += fullMatch;
      continue;
    }

    if (!markdownPath) {
      throw new Error(`Cannot upload local image "${imageUrl}" without markdownPath.`);
    }

    const uploaded = await uploadLocalImage({
      imageUrl,
      markdownPath,
      config,
      fetchImpl,
    });

    uploads.push(uploaded);
    replacedMarkdown += `![${altText}](${uploaded.uploadedUrl})`;
  }

  replacedMarkdown += markdown.slice(lastIndex);
  return {
    markdown: replacedMarkdown,
    uploads,
  };
}

async function uploadLocalImage({ imageUrl, markdownPath, config, fetchImpl }) {
  const imagePath = resolveImagePath(markdownPath, imageUrl);
  const extension = path.extname(imagePath).toLowerCase();
  const contentType = CONTENT_TYPES.get(extension);
  if (!contentType) {
    throw new Error(`Unsupported local image type "${imageUrl}".`);
  }

  let body;
  try {
    body = await fs.readFile(imagePath);
  } catch (error) {
    throw new Error(`Cannot read local image "${imageUrl}": ${error.message}`);
  }

  const endpoint = new URL(`${config.apiUrl}/media`);
  const filename = asciiSafeFilename(path.basename(imagePath), extension, body);
  const response = await fetchImpl(endpoint, {
    method: "POST",
    body,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.user}:${config.password}`, "utf8").toString("base64")}`,
      "Content-Disposition": `attachment; filename="${escapeHeaderValue(filename)}"`,
      "Content-Type": contentType,
    },
  });

  const text = await response.text();
  let data;
  try {
    data = text ? parseWpJsonResponse(text) : null;
  } catch (error) {
    throw new Error(`${error.message}. HTTP ${response.status}: ${text.slice(0, 240)}`);
  }

  if (!response.ok) {
    const message = data?.message || response.statusText;
    throw new Error(`WordPress media upload error. HTTP ${response.status}: ${message}`);
  }

  if (!data?.source_url) {
    throw new Error(`WordPress media upload response did not include source_url for "${imageUrl}".`);
  }

  return {
    originalUrl: imageUrl,
    uploadedUrl: data.source_url,
    id: data.id,
  };
}

function resolveImagePath(markdownPath, imageUrl) {
  const decodedUrl = decodeURIComponent(imageUrl);
  if (path.isAbsolute(decodedUrl)) {
    return decodedUrl;
  }

  return path.resolve(path.dirname(markdownPath), decodedUrl);
}

function isLocalImageUrl(imageUrl) {
  return !/^[a-z][a-z0-9+.-]*:/i.test(imageUrl) && !imageUrl.startsWith("//");
}

function escapeHeaderValue(value) {
  return value.replace(/["\\]/g, "_");
}

function asciiSafeFilename(filename, extension, body) {
  if (/^[\x20-\x7e]+$/.test(filename)) {
    return filename;
  }

  const hash = crypto.createHash("sha256").update(filename).update(body).digest("hex").slice(0, 8);
  return `image-${hash}${extension || ""}`;
}
