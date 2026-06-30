// Render / Node server: serves the static deep-link site and injects per-bet
// Open Graph tags when ?post=<bet_id>&post_type=<bet_type> is present.
// Crawlers read the rewritten <meta> tags; real users still get script.js.

import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetchBet, buildPreview } from './lib/bet.js';
import { rewriteOgTags } from './lib/rewrite.js';
import { renderPreviewPng } from './lib/preview-image.js';
import { DEFAULT_BET } from './lib/default-bet.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// When true (default), fall back to DEFAULT_BET if batch-retrieve fails or
// returns nothing, so previews still render. Set USE_DEFAULT_BET=false to
// disable and pass through the generic static preview instead.
const USE_DEFAULT_BET = process.env.USE_DEFAULT_BET !== 'false';

const config = {
  API_BASE:
    process.env.API_BASE || 'https://d2cd6j9obaa1qj.cloudfront.net/bets/v1',
  SITE_NAME: process.env.SITE_NAME || 'Rebet',
  FALLBACK_IMAGE:
    process.env.FALLBACK_IMAGE ||
    'https://dbuhveqapzlhb.cloudfront.net/common_assets/icons/og-image.png',
};

const indexTemplate = readFileSync(join(__dirname, 'index.html'), 'utf8');

async function resolveBet(betId, betType) {
  const bet = await fetchBet(config, betId, betType);
  if (bet) return bet;
 if (USE_DEFAULT_BET) {
    console.warn(`batch-retr ieve failed for post=${betId}; using DEFAULT_BET`);
    return DEFAULT_BET;
  }
  return null;
}

function buildOgImageUrl(req) {
  const u = new URL(`${req.protocol}://${req.get('host')}/og`);
  u.searchParams.set('post', req.query.post);
  if (req.query.post_type) u.searchParams.set('post_type', req.query.post_type);
  return u.toString();
}

function buildPageUrl(req) {
  return new URL(
    `${req.protocol}://${req.get('host')}${req.originalUrl}`
  ).toString();
}

const app = express();

// Dynamic preview image for og:image
app.get('/og', async (req, res) => {
  const betId = req.query.post;
  if (!betId) return res.redirect(302, config.FALLBACK_IMAGE);

  const bet = await resolveBet(betId, req.query.post_type);
  if (!bet) return res.redirect(302, config.FALLBACK_IMAGE);

  try {
    const preview = buildPreview(bet, config);
    const png = await renderPreviewPng(preview);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(png);
  } catch (err) {
    console.error('OG image render failed:', err);
    return res.redirect(302, config.FALLBACK_IMAGE);
  }
});

// HTML with per-bet meta tags (must run before express.static)
async function serveIndex(req, res) {
  const betId = req.query.post;
  if (!betId) return res.type('html').send(indexTemplate);

  const bet = await resolveBet(betId, req.query.post_type);
  if (!bet) return res.type('html').send(indexTemplate);

  const preview = buildPreview(bet, config);
  const html = rewriteOgTags(indexTemplate, preview, {
    pageUrl: buildPageUrl(req),
    imageUrl: buildOgImageUrl(req),
  });

  return res.type('html').send(html);
}

app.get('/', serveIndex);
app.get('/index.html', serveIndex);

// Static assets (config.js, script.js, styles.css, …)
app.use(express.static(__dirname, { index: false }));

app.listen(PORT, () => {
  console.log(`Deep-link server listening on port ${PORT}`);
});
