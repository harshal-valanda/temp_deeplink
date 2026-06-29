// Rewrites og:* / twitter:* meta tags in index.html for a given bet preview.

function escAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

function setMeta(html, selector, content) {
  const safe = escAttr(content);
  if (selector.startsWith('property=')) {
    const prop = selector.match(/property="([^"]+)"/)[1];
    const re = new RegExp(
      `(<meta\\s+property="${prop}"\\s+content=")[^"]*("\\s*/?>)`,
      'i'
    );
    return html.replace(re, `$1${safe}$2`);
  }
  const name = selector.match(/name="([^"]+)"/)[1];
  const re = new RegExp(
    `(<meta\\s+name="${name}"\\s+content=")[^"]*("\\s*/?>)`,
    'i'
  );
  return html.replace(re, `$1${safe}$2`);
}

export function rewriteOgTags(html, preview, { pageUrl, imageUrl }) {
  const title = preview.title;
  const description = preview.description || preview.title;

  let out = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escText(title)}</title>`
  );

  out = setMeta(out, 'property="og:title"', title);
  out = setMeta(out, 'property="og:description"', description);
  out = setMeta(out, 'property="og:url"', pageUrl);
  out = setMeta(out, 'property="og:image"', imageUrl);
  out = setMeta(out, 'property="og:image:width"', '1200');
  out = setMeta(out, 'property="og:image:height"', '630');
  out = setMeta(out, 'name="twitter:card"', 'summary_large_image');
  out = setMeta(out, 'name="twitter:title"', title);
  out = setMeta(out, 'name="twitter:description"', description);
  out = setMeta(out, 'name="twitter:image"', imageUrl);

  return out;
}
