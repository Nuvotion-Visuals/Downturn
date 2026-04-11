import { reader_for_url, ignore_post } from './url_to_markdown_readers.mjs';
import processor from './url_to_markdown_processor.mjs';
import filters from './url_to_markdown_common_filters.mjs';
import { createApp } from './lib/http_server.mjs';
import { createRateLimiter } from './lib/rate_limiter.mjs';
import { JSDOM } from './lib/html_parser.mjs';

function validURL(s) {
	try { new URL(s); return true; } catch { return false; }
}

const port = process.env.PORT;

if(!port) {
	console.error("Please specify a port in the PORT environment variable");
	process.exit(1);
}

const app = createApp();

const rateLimiter = createRateLimiter({
	windowMs: 30 * 1000,
	max: 5,
	message: 'Rate limit exceeded',
	headers: true
});

app.set('trust proxy', 1);

app.use(rateLimiter);

function send_headers(res) {
	res.header("Access-Control-Allow-Origin", '*');
	res.header("Access-Control-Allow-Methods", 'GET, POST');
 	res.header("Access-Control-Expose-Headers", 'X-Title');
 	res.header("Content-Type", 'text/markdown');
}

function read_url(url, res, options) {
		let reader = reader_for_url(url);
		send_headers(res);
		reader.read_url(url, res, options);
}

function get_options(query) {
	const title = query.title;
	const links = query.links;
	const clean = query.clean;

	let inline_title = false;
	let ignore_links = false;
	let improve_readability = true;

	if (title !== undefined) {
		inline_title = (title === 'true');
	}
	if (links !== undefined) {
		ignore_links = (links === 'false');
	}
	if (clean !== undefined) {
		improve_readability = (clean !== 'false');
	}
	return {
		inline_title: inline_title,
		ignore_links: ignore_links,
		improve_readability: improve_readability
	};
}

app.get('/', (req, res) => {
	const url = req.query.url;
	const options = get_options(req.query);
	if (url && validURL(url)) {
		read_url(url, res, options);
	} else {
		res.status(400).send("Please specify a valid url query parameter");
	}
});

app.post('/', function(req, res) {
	let html = req.body.html;
	const url = req.body.url;
	const options = get_options(req.query);
	const id = '';
	if (ignore_post(url)) {
		read_url(url, res, options);
		return;
	}
	if (!html) {
		res.status(400).send("Please provide a POST parameter called html");
	} else {
		try {
			html = filters.strip_style_and_script_blocks(html);
			let document = new JSDOM(html);
			let markdown = processor.process_dom(url, document, res, id, options);
			send_headers(res);
			res.send(markdown);
		 } catch (error) {
		 	res.status(400).send("Could not parse that document");
		}
	}

});

app.listen(port, () => {
})
