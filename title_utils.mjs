// Slugify a string for use as a filename
export function slugify(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')   // spaces/underscores to hyphens
    .replace(/-+/g, '-')       // collapse multiple hyphens
    .replace(/^-|-$/g, '')     // trim leading/trailing hyphens
    .slice(0, 100);            // cap length
}

// Extract a title from an HTML string: <h1> -> <meta og:title> -> <title> -> null
export function extractTitle(html) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>/g, '').trim();

  const og = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
           || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i);
  if (og) return og[1].trim();

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) return title[1].trim();

  return null;
}
