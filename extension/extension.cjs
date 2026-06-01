const path = require("node:path");
const { pathToFileURL } = require("node:url");
const vscode = require("vscode");

let moduleCachePromise = null;

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("wordpressPublisher.publishDraft", () => publishCurrentDocument(context, "draft")),
    vscode.commands.registerCommand("wordpressPublisher.publishNow", () => publishCurrentDocument(context, "publish")),
    vscode.commands.registerCommand("wordpressPublisher.setSitePassword", () => setSitePassword(context)),
    vscode.commands.registerCommand("wordpressPublisher.clearSitePassword", () => clearSitePassword(context)),
  );
}

function deactivate() {}

async function publishCurrentDocument(context, statusOverride) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Open a Markdown file before publishing to WordPress.");
    return;
  }

  const { document } = editor;
  if (document.languageId !== "markdown") {
    vscode.window.showErrorMessage("The active editor is not a Markdown document.");
    return;
  }

  const markdown = document.getText();
  const modules = await loadModules();
  const frontmatter = modules.parseFrontmatter(markdown).data;

  try {
    const site = await resolveSiteForDocument(modules, frontmatter);
    const password = await getPasswordForSite(context, site);
    if (!password) {
      return;
    }

    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Publishing to ${site.label || site.id}`,
      },
      async () =>
        modules.publishMarkdownToWordPress({
          markdown,
          markdownPath: document.uri.fsPath,
          config: {
            baseUrl: site.baseUrl,
            apiUrl: site.apiUrl,
            user: site.username,
            password,
          },
          statusOverride,
        }),
    );

    const action = await vscode.window.showInformationMessage(
      `Published "${result.frontmatter.title}" as ${result.post.status}.`,
      "Open Post",
    );

    if (action === "Open Post" && result.post.link) {
      await vscode.env.openExternal(vscode.Uri.parse(result.post.link));
    }
  } catch (error) {
    vscode.window.showErrorMessage(error.message || String(error));
  }
}

async function setSitePassword(context) {
  const modules = await loadModules();
  const site = await pickConfiguredSite(modules);
  if (!site) {
    return;
  }

  const password = await vscode.window.showInputBox({
    password: true,
    ignoreFocusOut: true,
    prompt: `Enter the WordPress app password for ${site.label || site.id}`,
    placeHolder: "xxxx xxxx xxxx xxxx xxxx xxxx",
  });

  if (!password) {
    return;
  }

  await context.secrets.store(secretKey(site.id), password);
  vscode.window.showInformationMessage(`Saved app password for ${site.label || site.id}.`);
}

async function clearSitePassword(context) {
  const modules = await loadModules();
  const site = await pickConfiguredSite(modules);
  if (!site) {
    return;
  }

  await context.secrets.delete(secretKey(site.id));
  vscode.window.showInformationMessage(`Cleared saved app password for ${site.label || site.id}.`);
}

async function resolveSiteForDocument(modules, frontmatter) {
  const { settings, sites } = getConfiguredSites(modules);

  if (sites.length === 0) {
    throw new Error("No WordPress sites configured. Add wordpressPublisher.sites in VS Code settings.");
  }

  const preferredKey = settings.get("frontmatterSiteKey", "wordpress_site");
  const preferredSiteId = modules.resolveFrontmatterSiteId(frontmatter, preferredKey);
  if (preferredSiteId) {
    const matchedSite = sites.find((site) => site.id === preferredSiteId);
    if (!matchedSite) {
      throw new Error(`Frontmatter site "${preferredSiteId}" is not configured in wordpressPublisher.sites.`);
    }
    return matchedSite;
  }

  const defaultSiteId = settings.get("defaultSiteId", "");
  if (defaultSiteId) {
    const matchedDefault = sites.find((site) => site.id === defaultSiteId);
    if (!matchedDefault) {
      throw new Error(`Default site "${defaultSiteId}" is not configured in wordpressPublisher.sites.`);
    }
    return matchedDefault;
  }

  if (sites.length === 1) {
    return sites[0];
  }

  return pickSiteQuickPick(sites, "Choose the WordPress site for this document");
}

async function pickConfiguredSite(modules) {
  const { sites } = getConfiguredSites(modules);
  if (sites.length === 0) {
    vscode.window.showErrorMessage("No WordPress sites configured. Add wordpressPublisher.sites in VS Code settings.");
    return null;
  }

  if (sites.length === 1) {
    return sites[0];
  }

  return pickSiteQuickPick(sites, "Choose a WordPress site");
}

function getConfiguredSites(modules) {
  const settings = vscode.workspace.getConfiguration("wordpressPublisher");
  const legacySettings = vscode.workspace.getConfiguration("wordpress-post");
  const sites = modules.normalizeConfiguredSites({
    sitesSetting: settings.get("sites", []),
    legacySetting: {
      siteUrl: legacySettings.get("siteUrl", ""),
      apiUrl: legacySettings.get("apiUrl", ""),
      authUser: legacySettings.get("authUser", ""),
    },
  });

  return { settings, sites };
}

async function getPasswordForSite(context, site) {
  const storedSecret = await context.secrets.get(secretKey(site.id));
  if (storedSecret) {
    return storedSecret;
  }

  const legacySettings = vscode.workspace.getConfiguration("wordpress-post");
  if (site.id === "legacy-default") {
    const legacyPassword = legacySettings.get("authPassword", "");
    if (legacyPassword) {
      return legacyPassword;
    }
  }

  const password = await vscode.window.showInputBox({
    password: true,
    ignoreFocusOut: true,
    prompt: `Enter the WordPress app password for ${site.label || site.id}`,
    placeHolder: "xxxx xxxx xxxx xxxx xxxx xxxx",
  });

  if (!password) {
    return "";
  }

  await context.secrets.store(secretKey(site.id), password);
  return password;
}

async function pickSiteQuickPick(sites, placeholder) {
  const picked = await vscode.window.showQuickPick(
    sites.map((site) => ({
      label: site.label || site.id,
      description: site.id,
      detail: site.apiUrl,
      site,
    })),
    {
      placeHolder: placeholder,
      ignoreFocusOut: true,
    },
  );

  return picked?.site || null;
}

function secretKey(siteId) {
  return `wordpressPublisher.sitePassword:${siteId}`;
}

function loadModules() {
  if (!moduleCachePromise) {
    moduleCachePromise = Promise.all([
      import(pathToFileURL(path.join(__dirname, "..", "scripts", "wp-publish-core.mjs")).href),
      import(pathToFileURL(path.join(__dirname, "..", "scripts", "wp-vscode-sites.mjs")).href),
      import(pathToFileURL(path.join(__dirname, "..", "scripts", "wp-blocks.mjs")).href),
    ]).then(([publishCore, siteHelpers, blockHelpers]) => ({
      publishMarkdownToWordPress: publishCore.publishMarkdownToWordPress,
      normalizeConfiguredSites: siteHelpers.normalizeConfiguredSites,
      resolveFrontmatterSiteId: siteHelpers.resolveFrontmatterSiteId,
      parseFrontmatter: blockHelpers.parseFrontmatter,
    }));
  }

  return moduleCachePromise;
}

module.exports = {
  activate,
  deactivate,
};
