import apple_dev_parser from './url_to_markdown_apple_dev_docs.mjs';
import processor from './url_to_markdown_processor.mjs';
import filters from './url_to_markdown_common_filters.mjs';
import { JSDOM } from './lib/html_parser.mjs';
import https from 'node:https';
import http from 'node:http';

const failure_message  = "Sorry, could not fetch and convert that URL";
const service_user_agent = "Urltomarkdown/1.0";

const apple_dev_prefix = "https://developer.apple.com";
const stackoverflow_prefix = "https://stackoverflow.com/questions";

const timeoutMs = 15 * 1000;
const maxRedirects = 5;

function fetch_url (url, success, failure) {

	let fetch = new Promise((resolve, reject) => {
		let redirects = 0;

		function doFetch(url) {
			let timedOut = false;

			const timeout = setTimeout(() => {
				timedOut = true;
			}, timeoutMs);

			const client = url.startsWith('https') ? https : http;
			const req = client.get(url, {
				headers: {
					'User-Agent': service_user_agent
				}
			}, (res) => {
				clearTimeout(timeout);

				// Follow redirects
				if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
					res.resume(); // drain the response
					if (++redirects > maxRedirects) {
						reject('Too many redirects');
						return;
					}
					const location = new URL(res.headers.location, url).href;
					doFetch(location);
					return;
				}

			    let result = "";
			    res.on("data", (chunk) => {
			        result += chunk;
			    });
			    res.on("end", () => {
			    	if (!timedOut && res.statusCode >= 200 && res.statusCode < 300) {
			    		resolve(result);
			    	} else {
			    		reject(res.statusCode);
			    	}
			    });
			});

			req.on('error', (err) => {
				clearTimeout(timeout);
				reject();
		    });

			req.on('timeout', () => {
				clearTimeout(timeout);
				req.destroy();
				reject();
		    });

		    req.setTimeout(timeoutMs);
		}

		doFetch(url);
	});

	fetch.then( (response) => success(response) ).catch( (code) => failure(code) );
}

export class html_reader {
	read_url(url, res, options) {
		try {
			fetch_url(url, (html) => {
				html = filters.strip_style_and_script_blocks(html);
				const document = new JSDOM(html);
				const id = "";
				let markdown = processor.process_dom(url, document, res, id, options);
				res.send(markdown);
			}, (code) => {
				if (code && Number.isInteger(code)) {
					res.status(502).send(failure_message + " as the website you are trying to convert returned status code " + code);
				} else {
					res.status(504).send(failure_message);
				}
			});
		} catch(error) {
			res.status(400).send(failure_message);
		}
	}
}

export class apple_reader {
	read_url(url, res, options) {
		let json_url = apple_dev_parser.dev_doc_url(url);
		fetch_url.get(json_url, (body) => {
            let json = JSON.parse(body);
            let markdown = apple_dev_parser.parse_dev_doc_json(json, options);
            res.send(markdown);
		}, () => {
			res.status(504).send(failure_message);
		});
	}
}

export class stack_reader {
	read_url(url, res, options) {
		try {
			fetch_url(url, (html) => {
				html = filters.strip_style_and_script_blocks(html);
				const document = new JSDOM(html);
				let markdown_q = processor.process_dom(url, document, res, 'question', options );
				options.inline_title = false;
				let markdown_a = processor.process_dom(url, document, res, 'answers', options );
				if (markdown_a.startsWith('Your Answer')) {
					res.send(markdown_q);
				}
				else {
					res.send(markdown_q + "\n\n## Answer\n"+ markdown_a);
				}
			}, () => {
				res.status(504).send(failure_message);
			});
		} catch(error) {
			res.status(400).send(failure_message);
		}
	}
}

export function reader_for_url(url) {
	if (url.startsWith(apple_dev_prefix)) {
		return new apple_reader;
	} else if (url.startsWith(stackoverflow_prefix)) {
		return new stack_reader;
	} else {
		return new html_reader;
	}
}

export function ignore_post(url) {
	if (url) {
		if (url.startsWith(stackoverflow_prefix)) {
			return true;
		}
	} else {
		return false;
	}
}
