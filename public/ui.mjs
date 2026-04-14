// Pure functions extracted from index.html for testability

export function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function inline(text) {
  // Inline code first — protect contents from other transformations
  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_, code) => { codes.push(`<code>${esc(code)}</code>`); return `\x00C${codes.length - 1}\x00`; });
  // Strip empty anchor links used as heading targets: [](#id) or [ ](#id)
  text = text.replace(/\[\s*\]\(#[^\)]*\)/g, '');
  // Linked images: [![alt](img)](url)
  text = text.replace(/\[!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"[^"]*")?\)\]\(([^\s\)]+)(?:\s+"[^"]*")?\)/g, '<a href="$3"><img alt="$1" src="$2"></a>');
  // Images
  text = text.replace(/!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"[^"]*")?\)/g, '<img alt="$1" src="$2">');
  // Links (strip optional title: [text](url "title"))
  text = text.replace(/\[([^\]]+)\]\(([^\s\)]+)(?:\s+"[^"]*")?\)/g, '<a href="$2">$1</a>');
  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<![\/\w])__(.+?)__(?![\/\w])/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/(?<![\/\w])_(.+?)_(?![\/\w])/g, '<em>$1</em>');
  // Restore inline code
  text = text.replace(/\x00C(\d+)\x00/g, (_, i) => codes[i]);
  return text;
}

export function markdownToHtml(md) {
  // Fenced code blocks
  let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="language-${lang}">${esc(code.trimEnd())}</code></pre>`
  );

  const lines = html.split('\n');
  let out = [];
  let inList = false;
  let listType = '';

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

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      closeList();
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
      closeList();
      out.push('<hr>');
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      closeList();
      let bqLines = [line.slice(2)];
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        i++;
        bqLines.push(lines[i].slice(2));
      }
      out.push(`<blockquote><p>${inline(bqLines.join('<br>'))}</p></blockquote>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[*+-]\s+(.*)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${inline(ulMatch[2])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${inline(olMatch[2])}</li>`);
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+[-|\s:]*$/.test(lines[i + 1])) {
      closeList();
      const headerCells = parseTableRow(line);
      i++; // skip separator
      let tableHtml = '<table><thead><tr>' +
        headerCells.map(c => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>';
      while (i + 1 < lines.length && lines[i + 1].includes('|')) {
        i++;
        const cells = parseTableRow(lines[i]);
        tableHtml += '<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
      }
      tableHtml += '</tbody></table>';
      out.push(tableHtml);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      closeList();
      out.push('');
      continue;
    }

    // Paragraph
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');

  function closeList() {
    if (inList) {
      out.push(`</${listType}>`);
      inList = false;
    }
  }

  function parseTableRow(row) {
    return row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  }
}

export function normalizeUrl(targetUrl) {
  if (!targetUrl) return '';
  if (targetUrl.startsWith('__search__:')) return targetUrl;
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
