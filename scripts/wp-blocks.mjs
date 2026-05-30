export function parseFrontmatter(markdown) {
  markdown = markdown.replace(/^\uFEFF/, "");
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { data: {}, body: markdown };
  }

  const data = {};
  const lines = match[1].split(/\r?\n/);
  let currentKey = null;

  for (const line of lines) {
    const keyValue = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyValue) {
      currentKey = keyValue[1];
      const rawValue = keyValue[2].trim();
      if (rawValue === "") {
        data[currentKey] = [];
      } else if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
        data[currentKey] = rawValue
          .slice(1, -1)
          .split(",")
          .map((item) => stripQuotes(item.trim()))
          .filter(Boolean);
      } else {
        data[currentKey] = stripQuotes(rawValue);
      }
      continue;
    }

    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(stripQuotes(listItem[1].trim()));
    }
  }

  return {
    data,
    body: markdown.slice(match[0].length),
  };
}

export function markdownToWpBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    const text = paragraph.join("\n").trim();
    paragraph = [];

    if (isShortcodeOnly(text)) {
      blocks.push(wrapBlock("shortcode", text));
      return;
    }

    blocks.push(wrapBlock("paragraph", `<p>${inlineMarkdown(text)}</p>`));
  };

  const flushList = () => {
    if (list.length === 0) {
      return;
    }

    const ordered = list.every((item) => item.ordered);
    const tag = ordered ? "ol" : "ul";
    const items = list.map((item) => `<li>${inlineMarkdown(item.text)}</li>`).join("\n");
    blocks.push(wrapBlock("list", `<${tag}>\n${items}\n</${tag}>`, ordered ? { ordered: true } : null));
    list = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const shorthand = parseShorthandBlock(lines, i);
    if (shorthand) {
      i = shorthand.endIndex;

      if (shorthand.type === "render") {
        if (paragraph.length > 0 && isShortcodeOnly(shorthand.text.trim())) {
          flushList();

          const text = paragraph.join("\n").trim();
          paragraph = [];
          blocks.push(wrapBlock("shortcode", `${inlineMarkdown(text)}${shorthand.text.trim()}`));
          continue;
        }

        flushParagraph();
        flushList();
        blocks.push(markdownToWpBlocks(shorthand.text));
        continue;
      }

      flushParagraph();
      flushList();

      if (shorthand.type === "html") {
        blocks.push(wrapBlock("html", shorthand.text));
        continue;
      }

      if (shorthand.type === "shortcode") {
        blocks.push(wrapBlock("shortcode", shorthand.text.trim()));
        continue;
      }

      if (shorthand.type === "math") {
        blocks.push(wrapBlock("shortcode", `[katex display=true]${shorthand.text.trim()}[/katex]`));
        continue;
      }

      if (shorthand.type === "code") {
        blocks.push(codeBlock(shorthand.text, shorthand.language));
        continue;
      }
    }

    const fence = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (fence) {
      const fenceMarker = fence[1];
      const language = fence[2].trim();
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith(fenceMarker)) {
        code.push(lines[i]);
        i += 1;
      }
      const fencedText = code.join("\n");

      if (language === "wp-render") {
        if (paragraph.length > 0 && isShortcodeOnly(fencedText.trim())) {
          flushList();

          const text = paragraph.join("\n").trim();
          paragraph = [];
          blocks.push(wrapBlock("shortcode", `${inlineMarkdown(text)}${fencedText.trim()}`));
          continue;
        }

        flushParagraph();
        flushList();
        blocks.push(markdownToWpBlocks(fencedText));
        continue;
      }

      flushParagraph();
      flushList();

      if (["html", "HTML"].includes(language)) {
        blocks.push(wrapBlock("html", fencedText));
        continue;
      }

      blocks.push(codeBlock(fencedText, language));
      continue;
    }

    if (line.trim() === "$$") {
      flushParagraph();
      flushList();

      const math = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== "$$") {
        math.push(lines[i]);
        i += 1;
      }

      blocks.push(wrapBlock("shortcode", `[katex display=true]${math.join("\n").trim()}[/katex]`));
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    if (isTableStart(lines, i)) {
      flushParagraph();
      flushList();

      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i += 1;
      }
      i -= 1;

      blocks.push(markdownTableToBlock(tableLines));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();

      const level = heading[1].length;
      const text = inlineMarkdown(heading[2].trim());
      const attrs = level === 2 ? null : { level };
      blocks.push(wrapBlock("heading", `<h${level}>${text}</h${level}>`, attrs));
      continue;
    }

    const blockquote = line.match(/^>\s?(.*)$/);
    if (blockquote) {
      flushParagraph();
      flushList();

      const quoteLines = [blockquote[1]];
      while (i + 1 < lines.length) {
        const next = lines[i + 1].match(/^>\s?(.*)$/);
        if (!next) {
          break;
        }
        quoteLines.push(next[1]);
        i += 1;
      }

      blocks.push(wrapBlock("quote", `<blockquote class="wp-block-quote"><p>${inlineMarkdown(quoteLines.join(" "))}</p></blockquote>`));
      continue;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      list.push({
        ordered: Boolean(ordered),
        text: (unordered || ordered)[1].trim(),
      });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join("\n\n");
}

export function buildPostPayload(markdown) {
  const { data, body } = parseFrontmatter(markdown);
  return {
    frontmatter: data,
    content: markdownToWpBlocks(body),
  };
}

function wrapBlock(name, html, attrs = null) {
  const serializedAttrs = attrs ? ` ${JSON.stringify(attrs)}` : "";
  return `<!-- wp:${name}${serializedAttrs} -->\n${html}\n<!-- /wp:${name} -->`;
}

function parseShorthandBlock(lines, startIndex) {
  const opener = lines[startIndex].match(/^(render|html|shortcode|math|code)(?:\s+([^{}]+))?\{$/);
  if (!opener) {
    return null;
  }

  const body = [];
  let i = startIndex + 1;
  while (i < lines.length && lines[i].trim() !== "}") {
    body.push(lines[i]);
    i += 1;
  }

  if (i >= lines.length) {
    return null;
  }

  return {
    type: opener[1],
    language: (opener[2] || "").trim(),
    text: body.join("\n"),
    endIndex: i,
  };
}

function codeBlock(code, language) {
  const languageClass = language ? `language-${escapeHtmlAttribute(language)}` : "";
  const preClass = ["wp-block-code", languageClass].filter(Boolean).join(" ");
  const attrs = languageClass ? { className: languageClass } : null;

  return wrapBlock("code", `<pre class="${preClass}"><code>${escapeCodeHtml(code)}</code></pre>`, attrs);
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\\\((.+?)\\\)/g, "[katex]$1[/katex]")
    .replace(/\$([^$\n]+)\$/g, "[katex]$1[/katex]");
}

function isTableStart(lines, index) {
  return (
    lines[index]?.trim().startsWith("|") &&
    lines[index + 1]?.trim().startsWith("|") &&
    /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[index + 1].trim())
  );
}

function markdownTableToBlock(lines) {
  const rows = lines.filter((_, index) => index !== 1).map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => inlineMarkdown(cell.trim()))
  );

  const [header = [], ...bodyRows] = rows;
  const thead = `<thead><tr>${header.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${bodyRows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;

  return wrapBlock("table", `<figure class="wp-block-table"><table>${thead}${tbody}</table></figure>`);
}

function isShortcodeOnly(text) {
  return /^\[[A-Za-z0-9_-]+(?:\s+[^\]]+)?\][\s\S]*\[\/[A-Za-z0-9_-]+\]$/.test(text.trim());
}

function stripQuotes(value) {
  return value.replace(/^["']|["']$/g, "");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeCodeHtml(value) {
  return escapeHtml(value)
    .replace(/\[/g, "&#91;")
    .replace(/\]/g, "&#93;");
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
