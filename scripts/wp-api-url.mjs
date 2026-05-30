export function buildPostLookupUrl(apiUrl, slug) {
  const url = new URL(`${apiUrl}/posts`);
  url.searchParams.set("slug", slug);
  url.searchParams.set("status", "publish,future,draft,pending,private");
  url.searchParams.set("context", "edit");
  url.searchParams.set("_fields", "id,slug,status,link");
  return url;
}

export function buildPostMutationUrl(apiUrl, postId = null) {
  const url = new URL(postId ? `${apiUrl}/posts/${postId}` : `${apiUrl}/posts`);
  url.searchParams.set("_fields", "id,slug,status,link");
  return url;
}
