export function normalizeConfiguredSites({ sitesSetting = [], legacySetting = null } = {}) {
  const normalizedSites = Array.isArray(sitesSetting)
    ? sitesSetting
        .map((site) => normalizeSite(site))
        .filter(Boolean)
    : [];

  if (normalizedSites.length > 0) {
    return normalizedSites;
  }

  const legacySite = normalizeLegacySite(legacySetting);
  return legacySite ? [legacySite] : [];
}

export function resolveFrontmatterSiteId(frontmatter = {}, preferredKey = "wordpress_site") {
  const candidateKeys = [
    preferredKey,
    "wordpress_site",
    "wordpress_target",
    "wp_site",
    "site",
  ];

  for (const key of candidateKeys) {
    const value = frontmatter?.[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

function normalizeSite(site) {
  if (!site || typeof site !== "object") {
    return null;
  }

  const id = String(site.id || "").trim();
  const apiUrl = trimTrailingSlash(site.apiUrl);
  const username = String(site.username || "").trim();

  if (!id || !apiUrl || !username) {
    return null;
  }

  return {
    id,
    label: String(site.label || id).trim(),
    baseUrl: trimTrailingSlash(site.baseUrl),
    apiUrl,
    username,
  };
}

function normalizeLegacySite(legacySetting) {
  if (!legacySetting || typeof legacySetting !== "object") {
    return null;
  }

  const apiUrl = trimTrailingSlash(legacySetting.apiUrl);
  const username = String(legacySetting.authUser || "").trim();

  if (!apiUrl || !username) {
    return null;
  }

  return {
    id: "legacy-default",
    label: "Legacy Default Site",
    baseUrl: trimTrailingSlash(legacySetting.siteUrl),
    apiUrl,
    username,
  };
}

function trimTrailingSlash(value) {
  return String(value || "").trim().replace(/\/$/, "");
}
