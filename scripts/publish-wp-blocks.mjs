#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildPostLookupUrl, buildPostMutationUrl } from "./wp-api-url.mjs";
import { parseWpJsonResponse } from "./wp-api-response.mjs";
import { buildPostPayload } from "./wp-blocks.mjs";

const inputPath = process.argv[2];

if (!inputPath) {
  fail("Usage: node scripts/publish-wp-blocks.mjs <post.md>");
}

const markdownPath = path.resolve(process.cwd(), inputPath);
const markdown = await fs.readFile(markdownPath, "utf8");
const { frontmatter, content } = buildPostPayload(markdown);
const config = await loadConfig();

validateFrontmatter(frontmatter);

const categories = await slugsToIds(config, "categories", frontmatter.categories);
const tags = await slugsToIds(config, "tags", frontmatter.tags);
const existing = await findPostBySlug(config, frontmatter.slug);

const postBody = {
  title: frontmatter.title,
  slug: frontmatter.slug,
  status: frontmatter.status || "draft",
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

const endpoint = buildPostMutationUrl(config.apiUrl, existing?.id);
const result = await wpRequest(config, endpoint, {
  method: "POST",
  body: JSON.stringify(postBody),
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
});

console.log(`Published WordPress post`);
console.log(`id: ${result.id}`);
console.log(`status: ${result.status}`);
console.log(`link: ${result.link}`);

async function loadConfig() {
  const envConfig = {
    baseUrl: process.env.WP_BASE_URL,
    apiUrl: process.env.WP_API_URL,
    user: process.env.WP_USER,
    password: process.env.WP_APP_PASSWORD,
  };

  if (envConfig.apiUrl && envConfig.user && envConfig.password) {
    return normalizeConfig(envConfig);
  }

  const settingsPath = path.join(os.homedir(), "AppData", "Roaming", "Code", "User", "settings.json");
  let settings = "";
  try {
    settings = await fs.readFile(settingsPath, "utf8");
  } catch {
    fail("Missing WordPress config. Set WP_API_URL, WP_USER, and WP_APP_PASSWORD.");
  }

  const fileConfig = {
    baseUrl: readJsoncString(settings, "wordpress-post.siteUrl"),
    apiUrl: readJsoncString(settings, "wordpress-post.apiUrl"),
    user: readJsoncString(settings, "wordpress-post.authUser"),
    password: readJsoncString(settings, "wordpress-post.authPassword"),
  };

  if (!fileConfig.apiUrl || !fileConfig.user || !fileConfig.password) {
    fail("Missing WordPress config. Set WP_API_URL, WP_USER, and WP_APP_PASSWORD.");
  }

  return normalizeConfig(fileConfig);
}

function normalizeConfig(config) {
  return {
    baseUrl: (config.baseUrl || "").replace(/\/$/, ""),
    apiUrl: (config.apiUrl || "").replace(/\/$/, ""),
    user: config.user,
    password: config.password,
  };
}

function readJsoncString(text, key) {
  const pattern = new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*"((?:\\\\.|[^"])*)"`);
  const match = text.match(pattern);
  if (!match) {
    return "";
  }
  return match[1].replace(/\\"/g, '"');
}

function validateFrontmatter(frontmatter) {
  for (const key of ["title", "slug"]) {
    if (!frontmatter[key]) {
      fail(`Missing required frontmatter field: ${key}`);
    }
  }

  if (frontmatter.status && !["draft", "publish", "pending", "private", "future"].includes(frontmatter.status)) {
    fail(`Unsupported post status: ${frontmatter.status}`);
  }
}

async function findPostBySlug(config, slug) {
  const url = buildPostLookupUrl(config.apiUrl, slug);

  const posts = await wpRequest(config, url);
  if (posts.length > 1) {
    fail(`Post slug is duplicated: ${slug}`);
  }
  return posts[0] || null;
}

async function slugsToIds(config, taxonomy, slugs) {
  if (!slugs) {
    return [];
  }

  const values = Array.isArray(slugs) ? slugs : [slugs];
  const ids = [];

  for (const slug of values) {
    const url = new URL(`${config.apiUrl}/${taxonomy}`);
    url.searchParams.set("slug", slug);
    const items = await wpRequest(config, url);

    if (items.length !== 1) {
      fail(`${taxonomy}=${slug} is not found or duplicated.`);
    }

    ids.push(items[0].id);
  }

  return ids;
}

async function wpRequest(config, url, options = {}) {
  const auth = Buffer.from(`${config.user}:${config.password}`, "utf8").toString("base64");
  const response = await fetch(url, {
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
    fail(`${error.message}. HTTP ${response.status}: ${text.slice(0, 240)}`);
  }

  if (!response.ok) {
    const message = data?.message || response.statusText;
    fail(`WordPress API error. HTTP ${response.status}: ${message}`);
  }

  return data;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
