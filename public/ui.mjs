// Pure functions extracted from index.html for testability

export function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function inline(text) {
  // Inline code first — protect contents from other transformations
  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_, code) => { codes.push(`<code>${esc(code)}</code>`); return `\x00C${codes.length - 1}\x00`; });
  // Backslash escapes — protect escaped ASCII punctuation from every later transform
  text = text.replace(/\\([!-\/:-@\[-`{-~])/g, (_, ch) => { codes.push(esc(ch)); return `\x00C${codes.length - 1}\x00`; });
  // Wiki-links: [[path|display]] or [[path]]
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, path, display) =>
    `<a href="note://${path.trim()}">${esc(display.trim())}</a>`);
  text = text.replace(/\[\[([^\]]+)\]\]/g, (_, path) => {
    const p = path.trim();
    const display = p.includes('/') ? p.slice(p.lastIndexOf('/') + 1) : p;
    return `<a href="note://${p}">${esc(display)}</a>`;
  });
  // Strip empty anchor links used as heading targets: [](#id) or [ ](#id)
  text = text.replace(/\[\s*\]\(#[^\)]*\)/g, '');
  // Linked images: [![alt](img)](url)
  text = text.replace(/\[!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"[^"]*")?\)\]\(([^\s\)]+)(?:\s+"[^"]*")?\)/g, '<a href="$3"><img alt="$1" src="$2"></a>');
  // Images
  text = text.replace(/!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"[^"]*")?\)/g, '<img alt="$1" src="$2">');
  // Links (strip optional title: [text](url "title"))
  text = text.replace(/\[([^\]]+)\]\(([^\s\)]+)(?:\s+"[^"]*")?\)/g, '<a href="$2">$1</a>');
  // Autolinks — bare http(s):// and www. URLs not already inside a tag. Built
  // anchors are parked in the placeholder array so emphasis can't mangle the URL
  // and they can't be re-linked.
  text = text.replace(/(^|[\s(])((?:https?:\/\/|www\.)[^\s<]+)/g, (m, pre, raw) => {
    let url = raw, trail = '';
    const punct = url.match(/[.,;:!?'"]+$/);
    if (punct) { trail = punct[0]; url = url.slice(0, -trail.length); }
    // Drop an unbalanced trailing ) (e.g. a URL wrapped in parens)
    if (url.endsWith(')') && (url.split(')').length - 1) > (url.split('(').length - 1)) {
      trail = ')' + trail; url = url.slice(0, -1);
    }
    const href = url.startsWith('www.') ? 'http://' + url : url;
    codes.push(`<a href="${href}">${url}</a>`);
    return `${pre}\x00C${codes.length - 1}\x00${trail}`;
  });
  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<![\/\w])__(.+?)__(?![\/\w])/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/(?<![\/\w])_(.+?)_(?![\/\w])/g, '<em>$1</em>');
  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Restore inline code and parked autolinks/escapes
  text = text.replace(/\x00C(\d+)\x00/g, (_, i) => codes[i]);
  return text;
}

export function markdownToHtml(md) {
  // Footnotes (standard [^id] references paired with [^id]: definitions).
  // Extract the definitions, then turn inline references into superscript links.
  const footnoteDefs = new Map();
  const footnoteOrder = [];
  md = md.replace(/^\[\^([^\]\s]+)\]:[ \t]*(.*)$/gm, (_, id, content) => {
    if (!footnoteDefs.has(id)) { footnoteDefs.set(id, content.trim()); footnoteOrder.push(id); }
    return '';
  });
  md = md.replace(/\[\^([^\]\s]+)\]/g, (m, id) =>
    footnoteDefs.has(id)
      ? `<sup class="footnote-ref"><a href="#fn-${esc(id)}" id="fnref-${esc(id)}">${esc(id)}</a></sup>`
      : m);

  // Fenced code blocks — ``` or ~~~ (3+), info string may contain any chars.
  let html = md.replace(/(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\1/g, (_, fence, info, code) => {
    const lang = info.trim().split(/\s+/)[0].replace(/[^\w+#.-]/g, '');
    return `<pre><code class="language-${lang}">${esc(code.trimEnd())}</code></pre>`;
  });

  const lines = html.split('\n');
  let out = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip lines inside <pre> blocks
    if (line.includes('<pre>')) {
      let block = line;
      while (!block.includes('</pre>') && i < lines.length - 1) {
        i++;
        block += '\n' + lines[i];
      }
      out.push(block);
      continue;
    }

    // Headings (trim optional closing # run: "## Title ##")
    const headingMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Setext headings
    if (i > 0 && /^[=-]{3,}\s*$/.test(line) && out.length) {
      const prev = out.pop();
      const tag = line[0] === '=' ? 'h1' : 'h2';
      out.push(`<${tag}>${prev.replace(/^<p>|<\/p>$/g, '')}</${tag}>`);
      continue;
    }

    // HR
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr>');
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      let bqLines = [line.slice(2)];
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        i++;
        bqLines.push(lines[i].slice(2));
      }
      out.push(`<blockquote><p>${inline(bqLines.join('<br>'))}</p></blockquote>`);
      continue;
    }

    // Lists — consume the whole region and render with nesting / task items
    if (/^\s*[*+-]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const { items, end } = gatherList(i);
      out.push(buildList(items));
      i = end;
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+[-|\s:]*$/.test(lines[i + 1])) {
      const headerCells = parseTableRow(line);
      const aligns = parseTableRow(lines[i + 1]).map(c => {
        const l = c.startsWith(':'), r = c.endsWith(':');
        return l && r ? 'center' : r ? 'right' : l ? 'left' : '';
      });
      const cellStyle = j => aligns[j] ? ` style="text-align:${aligns[j]}"` : '';
      i++; // skip separator
      let tableHtml = '<table><thead><tr>' +
        headerCells.map((c, j) => `<th${cellStyle(j)}>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>';
      while (i + 1 < lines.length && lines[i + 1].includes('|')) {
        i++;
        const cells = parseTableRow(lines[i]);
        tableHtml += '<tr>' + cells.map((c, j) => `<td${cellStyle(j)}>${inline(c)}</td>`).join('') + '</tr>';
      }
      tableHtml += '</tbody></table>';
      out.push(tableHtml);
      continue;
    }

    // Indented (4-space / tab) code block
    if (/^( {4}|\t)/.test(line)) {
      const codeLines = [];
      while (i < lines.length) {
        if (/^( {4}|\t)/.test(lines[i])) {
          codeLines.push(lines[i].replace(/^( {4}|\t)/, ''));
          i++;
        } else if (!lines[i].trim() && /^( {4}|\t)/.test(lines[i + 1] || '')) {
          codeLines.push('');
          i++;
        } else break;
      }
      i--; // step back; loop will advance
      out.push(`<pre><code>${esc(codeLines.join('\n').replace(/\s+$/, ''))}</code></pre>`);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      out.push('');
      continue;
    }

    // Paragraph — gather consecutive lines, joining with a space (soft break)
    // or <br> (hard break: trailing two spaces or backslash).
    const para = [line];
    while (i + 1 < lines.length && lines[i + 1].trim() && !isBlockStart(lines[i + 1], lines[i + 2])) {
      i++;
      para.push(lines[i]);
    }
    const joined = para.map((l, idx) => {
      const hard = /(  +|\\)$/.test(l);
      const content = inline(l.replace(/\s+$/, '').replace(/\\$/, ''));
      return idx === para.length - 1 ? content : content + (hard ? '<br>' : ' ');
    }).join('');
    out.push(`<p>${joined}</p>`);
  }
  if (footnoteOrder.length) {
    let fn = '\n<hr class="footnotes-sep">\n<section class="footnotes"><ol>';
    for (const id of footnoteOrder) {
      const content = inline(footnoteDefs.get(id))
        .replace(/(^|[^">])(https?:\/\/[^\s<]+)/g, '$1<a href="$2">$2</a>');
      fn += `<li id="fn-${esc(id)}">${content} <a href="#fnref-${esc(id)}" class="footnote-back" title="Back to reference">↩</a></li>`;
    }
    return out.join('\n') + fn + '</ol></section>';
  }
  return out.join('\n');

  // Is `line` the start of a block construct (and therefore not part of a
  // preceding paragraph)? `next` is the following line, needed for table detection.
  function isBlockStart(line, next) {
    return /^#{1,6}\s+/.test(line)
      || /^[=-]{3,}\s*$/.test(line)
      || /^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)
      || /^>\s/.test(line)
      || /^\s*[*+-]\s+/.test(line)
      || /^\s*\d+\.\s+/.test(line)
      || /^( {4}|\t)/.test(line)
      || line.includes('<pre>')
      || (line.includes('|') && next != null && /^\|?\s*[-:]+[-|\s:]*$/.test(next));
  }

  // Collect a contiguous list region starting at `start`. Blank lines are kept
  // only when another list item follows (loose lists); any other line ends it.
  function gatherList(start) {
    const items = [];
    let i = start;
    for (; i < lines.length; i++) {
      const l = lines[i];
      if (!l.trim()) {
        if (lines[i + 1] && /^\s*([*+-]|\d+\.)\s+/.test(lines[i + 1])) continue;
        break;
      }
      const ul = l.match(/^(\s*)[*+-]\s+(.*)$/);
      const ol = l.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (ul) items.push({ indent: ul[1].length, type: 'ul', num: 1, content: ul[2] });
      else if (ol) items.push({ indent: ol[1].length, type: 'ol', num: parseInt(ol[2], 10), content: ol[3] });
      else break;
    }
    return { items, end: i - 1 };
  }

  // Render gathered list items into nested <ul>/<ol> via an indentation stack.
  function buildList(items) {
    let html = '';
    const stack = []; // [{ type, indent }]
    const open = (it) => {
      const startAttr = it.type === 'ol' && it.num !== 1 ? ` start="${it.num}"` : '';
      html += `<${it.type}${startAttr}>`;
      stack.push({ type: it.type, indent: it.indent });
    };
    for (const it of items) {
      if (!stack.length) {
        open(it);
      } else if (it.indent > stack[stack.length - 1].indent) {
        open(it); // nested inside the currently-open <li>
      } else {
        while (stack.length > 1 && it.indent < stack[stack.length - 1].indent) {
          html += `</li></${stack.pop().type}>`;
        }
        html += '</li>';
        if (stack[stack.length - 1].type !== it.type) {
          html += `</${stack.pop().type}>`;
          open(it);
        }
      }
      const task = it.type === 'ul' && it.content.match(/^\[([ xX])\]\s+(.*)$/);
      if (task) {
        html += `<li class="task-list-item"><input type="checkbox"${task[1].toLowerCase() === 'x' ? ' checked' : ''}> ${inline(task[2])}`;
      } else {
        html += `<li>${inline(it.content)}`;
      }
    }
    while (stack.length) html += `</li></${stack.pop().type}>`;
    return html;
  }

  function parseTableRow(row) {
    return row.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
  }
}

// Toggle the Nth GFM task-list checkbox ([ ] <-> [x]) in markdown source order.
// `index` matches the Nth rendered <input type="checkbox"> in the preview, since
// markdownToHtml emits checkboxes in document order. Fenced code blocks are skipped
// so a `- [ ]`-looking line inside ``` / ~~~ doesn't throw the count off. Returns
// the updated markdown.
export function toggleTaskAt(md, index) {
  const lines = md.split('\n');
  let n = -1;
  let fenceChar = null; // '`' or '~' while inside a fenced code block
  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^\s*(`{3,}|~{3,})/);
    if (fenceChar) {
      if (fence && fence[1][0] === fenceChar) fenceChar = null;
      continue;
    }
    if (fence) { fenceChar = fence[1][0]; continue; }
    const task = lines[i].match(/^(\s*[-*+]\s+)\[([ xX])\]/);
    if (!task) continue;
    n++;
    if (n === index) {
      lines[i] = task[1] + (task[2] === ' ' ? '[x]' : '[ ]') + lines[i].slice(task[0].length);
      break;
    }
  }
  return lines.join('\n');
}

export function normalizeUrl(targetUrl) {
  if (!targetUrl) return '';
  if (targetUrl.startsWith('__search__:')) return targetUrl;
  if (targetUrl.startsWith('note://')) return targetUrl;
  if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;
  targetUrl = targetUrl.replace(/(https?:\/\/)\/+/g, '$1');
  return targetUrl;
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function resolveOmnibox(input) {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Already a URL
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('note://')) return trimmed;

  // Looks like a domain
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) return 'https://' + trimmed;

  // Default: search
  return '__search__:' + trimmed;
}

export function faviconUrl(url) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=16`;
  } catch { return ''; }
}

export function formatStats(markdown, ms, suffix) {
  const chars = markdown.length;
  const bytes = new TextEncoder().encode(markdown).length;
  const kb = (bytes / 1024).toFixed(1);
  const time = Math.round(ms);
  return `${chars.toLocaleString()} chars | ${kb} KB | ${time}ms${suffix ? ' ' + suffix : ''}`;
}

export function parseWikiLinks(content) {
  const links = [];
  const re = /\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    links.push(m[1].trim());
  }
  return [...new Set(links)];
}
