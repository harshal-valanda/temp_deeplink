// Cloudflare Worker entry point.
//
// Responsibilities:
//   1. /og        -> render a per-bet preview image (PNG) via workers-og.
//   2. everything -> fetch the existing static site (ORIGIN_URL) and, when the
//                    request carries ?post=<bet_id>&post_type=<bet_type>,
//                    rewrite the og:* / twitter:* meta tags for that bet.
//
// Real users still receive the original config.js/script.js and get the normal
// deep-link redirect; only the <meta> tags are swapped. Crawlers (which don't
// run JS) read the rewritten tags.

import { fetchBet, buildPreview } from './bet.js';
import { ogImageResponse } from './og.js';

class AttrSetter {
  constructor(content) {
    this.content = content;
  }
  element(el) {
    el.setAttribute('content', this.content);
  }
}

class TextSetter {
  constructor(text) {
    this.text = text;
  }
  element(el) {
    el.setInnerContent(this.text);
  }
}

function buildOgImageUrl(reqUrl, betId, betType) {
  const u = new URL('/og', reqUrl.origin);
  u.searchParams.set('post', betId);
  if (betType) u.searchParams.set('post_type', betType);
  return u.toString();
}

async function handleOgImage(_url, _env) {
  // For now, render only the static gradient background (no bet fetch).
  const res = ogImageResponse();
  // Cache generated images aggressively; bet outcomes rarely change post-share.
  res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res;
}

async function handlePage(request, url, env) {
  const betId = url.searchParams.get('post');
  const betType = url.searchParams.get('post_type');

  // Always serve the real static site as the base document.
  const originRes = await fetch(env.ORIGIN_URL + url.pathname + url.search, {
    headers: { 'User-Agent': request.headers.get('User-Agent') || '' },
  });

  // No bet id -> nothing to personalise, pass the origin through untouched.
  if (!betId) return originRes;

  const bet = await fetchBet(env, betId, betType);
  if (!bet) return originRes;

  const preview = buildPreview(bet, env);
  const imageUrl = buildOgImageUrl(url, betId, betType);
  const pageUrl = url.toString();

  const title = preview.title;
  const description = preview.description || preview.title;

  return new HTMLRewriter()
    .on('title', new TextSetter(title))
    .on('meta[property="og:title"]', new AttrSetter(title))
    .on('meta[property="og:description"]', new AttrSetter(description))
    .on('meta[property="og:x"]', new AttrSetter(pageUrl))
    .on('meta[property="og:image"]', new AttrSetter(imageUrl))
    .on('meta[property="og:image:width"]', new AttrSetter('1200'))
    .on('meta[property="og:image:height"]', new AttrSetter('800'))
    .on('meta[name="twitter:card"]', new AttrSetter('summary_large_image'))
    .on('meta[name="twitter:title"]', new AttrSetter(title))
    .on('meta[name="twitter:description"]', new AttrSetter(description))
    .on('meta[name="twitter:image"]', new AttrSetter(imageUrl))
    .transform(originRes);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/og') {
      return handleOgImage(url, env);
    }

    return handlePage(request, url, env);
  },
};
