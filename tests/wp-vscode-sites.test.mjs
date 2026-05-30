import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeConfiguredSites, resolveFrontmatterSiteId } from "../scripts/wp-vscode-sites.mjs";

test("normalizes configured sites and removes trailing slashes", () => {
  const sites = normalizeConfiguredSites({
    sitesSetting: [
      {
        id: "main",
        label: "Main Site",
        baseUrl: "https://example.com/",
        apiUrl: "https://example.com/wp-json/wp/v2/",
        username: "writer",
      },
    ],
  });

  assert.deepEqual(sites, [
    {
      id: "main",
      label: "Main Site",
      baseUrl: "https://example.com",
      apiUrl: "https://example.com/wp-json/wp/v2",
      username: "writer",
    },
  ]);
});

test("falls back to legacy wordpress-post settings when sites are not configured", () => {
  const sites = normalizeConfiguredSites({
    sitesSetting: [],
    legacySetting: {
      siteUrl: "https://legacy.example.com/",
      apiUrl: "https://legacy.example.com/wp-json/wp/v2/",
      authUser: "legacy-user",
    },
  });

  assert.deepEqual(sites, [
    {
      id: "legacy-default",
      label: "Legacy Default Site",
      baseUrl: "https://legacy.example.com",
      apiUrl: "https://legacy.example.com/wp-json/wp/v2",
      username: "legacy-user",
    },
  ]);
});

test("prefers configured frontmatter key and then known fallbacks", () => {
  assert.equal(
    resolveFrontmatterSiteId(
      {
        wordpress_target: "docs-site",
        wordpress_site: "main-site",
      },
      "wordpress_target",
    ),
    "docs-site",
  );

  assert.equal(
    resolveFrontmatterSiteId(
      {
        wp_site: "backup-site",
      },
      "wordpress_target",
    ),
    "backup-site",
  );

  assert.equal(resolveFrontmatterSiteId({}, "wordpress_target"), "");
});
