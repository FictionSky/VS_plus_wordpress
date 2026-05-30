import { buildPostLookupUrl, buildPostMutationUrl } from "./wp-api-url.mjs";
import { parseWpJsonResponse } from "./wp-api-response.mjs";
import { buildPostPayload } from "./wp-blocks.mjs";

export async function publishMarkdownToWordPress({
  markdown,
  config,
  statusOverride = "",
  fetchImpl = globalThis.fetch,
}) {
  if (typeof markdown !== "string" || markdown.trim() === "") {
    throw new Error("Markdown content is empty.");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  const normalizedConfig = normalizeConfig(config);
  const { frontmatter, content } = buildPostPayload(markdown);

  validateFrontmatter(frontmatter);

  const existing = await findPostBySlug(fetchImpl, normalizedConfig, frontmatter.slug);
  const categories = await slugsToIds(fetchImpl, normalizedConfig, "categories", frontmatter.categories);
  const tags = await slugsToIds(fetchImpl, normalizedConfig, "tags", frontmatter.tags);

  const postBody = {
    title: frontmatter.title,
    slug: frontmatter.slug,
    status: statusOverride || frontmatter.status || "draft",
    content,
  };

  if (frontmatter.excerpt) {
    postBody.excerpt = frontmatter.excerpt;
  }

  if (categories.length > 0) {
    postBody.categories = categories;
  }

  if (tags.length > 0) {
    postBody.tags = tags;
  }

  const endpoint = buildPostMutationUrl(normalizedConfig.apiUrl, existing?.id);
  const post = await wpRequest(fetchImpl, normalizedConfig, endpoint, {
    method: "POST",
    body: JSON.stringify(postBody),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });

  return {
    frontmatter,
    content,
    existing,
    post,
    endpoint: endpoint.toString(),
  };
}

export function normalizeConfig(config = {}) {
  if (!config.apiUrl || !config.user || !config.password) {
    throw new Error("Missing WordPress config. Set apiUrl, user, and password.");
  }

  return {
    baseUrl: String(config.baseUrl || "").replace(/\/$/, ""),
    apiUrl: String(config.apiUrl || "").replace(/\/$/, ""),
    user: String(config.user),
    password: String(config.password),
  };
}

export function validateFrontmatter(frontmatter) {
  for (const key of ["title", "slug"]) {
    if (!frontmatter[key]) {
      throw new Error(`Missing required frontmatter field: ${key}`);
    }
  }

  if (frontmatter.status && !["draft", "publish", "pending", "private", "future"].includes(frontmatter.status)) {
    throw new Error(`Unsupported post status: ${frontmatter.status}`);
  }
}

async function findPostBySlug(fetchImpl, config, slug) {
  const url = buildPostLookupUrl(config.apiUrl, slug);
  const posts = await wpRequest(fetchImpl, config, url);

  if (posts.length > 1) {
    throw new Error(`Post slug is duplicated: ${slug}`);
  }

  return posts[0] || null;
}

async function slugsToIds(fetchImpl, config, taxonomy, slugs) {
  if (!slugs) {
    return [];
  }

  const values = Array.isArray(slugs) ? slugs : [slugs];
  const ids = [];

  for (const slug of values) {
    const url = new URL(`${config.apiUrl}/${taxonomy}`);
    url.searchParams.set("slug", slug);
    const items = await wpRequest(fetchImpl, config, url);

    if (items.length !== 1) {
      throw new Error(`${taxonomy}=${slug} is not found or duplicated.`);
    }

    ids.push(items[0].id);
  }

  return ids;
}

async function wpRequest(fetchImpl, config, url, options = {}) {
  const auth = Buffer.from(`${config.user}:${config.password}`, "utf8").toString("base64");
  const response = await fetchImpl(url, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      ...(options.headers || {}),
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
    throw new Error(`WordPress API error. HTTP ${response.status}: ${message}`);
  }

  return data;
}
