import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPostLookupUrl, buildPostMutationUrl } from "../scripts/wp-api-url.mjs";

test("builds post lookup URL without rendered content fields", () => {
  const url = buildPostLookupUrl("https://example.com/wp-json/wp/v2", "demo-post");

  assert.equal(url.toString(), "https://example.com/wp-json/wp/v2/posts?slug=demo-post&status=publish%2Cfuture%2Cdraft%2Cpending%2Cprivate&context=edit&_fields=id%2Cslug%2Cstatus%2Clink");
  assert.equal(url.searchParams.get("_fields"), "id,slug,status,link");
  assert.equal(url.searchParams.get("context"), "edit");
});

test("builds post mutation URL without rendered content fields", () => {
  const createUrl = buildPostMutationUrl("https://example.com/wp-json/wp/v2");
  const updateUrl = buildPostMutationUrl("https://example.com/wp-json/wp/v2", 213);

  assert.equal(createUrl.toString(), "https://example.com/wp-json/wp/v2/posts?_fields=id%2Cslug%2Cstatus%2Clink");
  assert.equal(updateUrl.toString(), "https://example.com/wp-json/wp/v2/posts/213?_fields=id%2Cslug%2Cstatus%2Clink");
  assert.equal(updateUrl.searchParams.get("_fields"), "id,slug,status,link");
});
