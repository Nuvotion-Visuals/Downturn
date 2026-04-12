import formatter from './url_to_markdown_formatters.mjs';
import common_filters from './url_to_markdown_common_filters.mjs';
import { Readability } from './lib/readability.mjs';
import TurndownService from './lib/turndown.mjs';
import { JSDOM } from './lib/html_parser.mjs';

const service = new TurndownService();

export default {
	process_dom: function (url, document, res, id = "", options) {
		let inline_title = options.inline_title ?? true;
		let ignore_links = options.ignore_links ?? false;
		let improve_readability = options.improve_readability ?? true;
		let absolute_urls = options.absolute_urls ?? true;
		let title = document.window.document.querySelector('title');
		if (title)
			res.header("X-Title", encodeURIComponent(title.textContent.replace(/\s+/g, ' ').trim()));
		if (id) {
			let el = document.window.document.querySelector("#"+id);
			if (el) document = new JSDOM('<!DOCTYPE html>'+ el.innerHTML);
		}
		let readable = null;
		if (improve_readability) {
			let reader = new Readability(document.window.document);
			let readable_obj = reader.parse();
			if (readable_obj) {
				readable = readable_obj.content;
			}
		}
		if (!readable) {
			readable = document.window.document.documentElement.outerHTML;
		}
		let replacements = [];
		readable = formatter.format_codeblocks(readable, replacements);
		readable = formatter.format_tables(readable, replacements);
		let markdown = service.turndown(readable);
		for (let i=0;i<replacements.length;i++) {
			markdown = markdown.replace(replacements[i].placeholder, replacements[i].replacement);
		}
		// Normalize broken headings: # \n Title -> # Title
		markdown = markdown.replace(/^(#{1,6})\s*\n\s*(.+)/gm, '$1 $2');
		// Rejoin broken links/images split across lines
		markdown = markdown.replace(/\)\s*\n[\s\n]*\]\(/g, ')](');
		markdown = markdown.replace(/\]\s*\n[\s\n]*\(/g, '](');
		let result = (url) ? common_filters.filter(url, markdown, ignore_links, absolute_urls) : markdown;
		if (inline_title && title) {
			result = "# " + title.textContent.replace(/\s+/g, ' ').trim() + "\n" + result;
		}
		return result;
	}
}
