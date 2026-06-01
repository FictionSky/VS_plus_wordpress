#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { publishMarkdownToWordPress } from "./wp-publish-core.mjs";

const inputPath = process.argv[2];

if (!inputPath) {
  fail("Usage: node scripts/publish-wp-blocks.mjs <post.md>");
}

const markdownPath = path.resolve(process.cwd(), inputPath);
const markdown = await fs.readFile(markdownPath, "utf8");
const config = await loadConfig();

try {
  const result = await publishMarkdownToWordPress({
    markdown,
    markdownPath,
    config,
  });

  console.log("Published WordPress post");
  console.log(`id: ${result.post.id}`);
  console.log(`status: ${result.post.status}`);
  console.log(`link: ${result.post.link}`);
} catch (error) {
  fail(error.message);
}

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
