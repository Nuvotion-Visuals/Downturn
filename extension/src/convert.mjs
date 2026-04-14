import processor from '../../url_to_markdown_processor.mjs';
import filters from '../../url_to_markdown_common_filters.mjs';
import { JSDOM } from '../../lib/html_parser.mjs';

export function convertHtml(html, url, { title = true, links = true, clean = true, absoluteUrls = true } = {}) {
  const stripped = filters.strip_style_and_script_blocks(html);
  const document = new JSDOM(stripped);
  const res = { header: () => {} };
  const options = {
    inline_title: title,
    ignore_links: !links,
    improve_readability: clean,
    absolute_urls: absoluteUrls,
  };
  return processor.process_dom(url, document, res, '', options);
}
