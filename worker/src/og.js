// Renders a per-bet preview image (1200x630 PNG) at the edge using workers-og
// (Satori). The markup is intentionally flexbox-only, which is what Satori
// supports.
import { ImageResponse } from 'workers-og';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function statusColor(status) {
  if (status === 'Won') return '#22c55e';
  if (status === 'Lost') return '#ef4444';
  return '#eab308';
}

function chip(label, value) {
  return `
    <div style="display:flex;flex-direction:column;margin-right:48px;">
      <div style="display:flex;font-size:24px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">${esc(label)}</div>
      <div style="display:flex;font-size:44px;color:#ffffff;font-weight:700;margin-top:6px;">${esc(value)}</div>
    </div>`;
}

function buildHtml(preview) {
  const accent = statusColor(preview.status);

  const heading = preview.isParlay
    ? `${preview.legCount}-leg parlay`
    : preview.matchup || "Bet";

  const sub = preview.isParlay
    ? (preview.legs || [])
        .map((l) => l.pick)
        .filter(Boolean)
        .slice(0, 4)
        .join('  ·  ')
    : [preview.league, preview.marketName].filter(Boolean).join('  ·  ');

  const chips = [];
  if (preview.pick && !preview.isParlay) chips.push(chip('Pick', preview.pick));
  if (preview.stake) chips.push(chip('Stake', preview.stake));
  if (preview.odds) chips.push(chip('Odds', preview.odds));
  if (preview.status) chips.push(chip('Status', preview.status));

  return `
  <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#0b1220;padding:72px;font-family:Inter,system-ui,sans-serif;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;font-size:34px;color:#ffffff;font-weight:800;letter-spacing:1px;">${esc(preview.siteName)}</div>
      <div style="display:flex;align-items:center;background:${accent};border-radius:999px;padding:10px 28px;">
        <div style="display:flex;font-size:28px;color:#0b1220;font-weight:800;">${esc(preview.status || 'Bet')}</div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;margin-top:auto;">
      <div style="display:flex;font-size:30px;color:#60a5fa;font-weight:600;">@${esc(preview.username)}</div>
      <div style="display:flex;font-size:64px;color:#ffffff;font-weight:800;margin-top:12px;line-height:1.1;">${esc(heading)}</div>
      ${sub ? `<div style="display:flex;font-size:30px;color:#94a3b8;margin-top:16px;">${esc(sub)}</div>` : ''}
    </div>

    <div style="display:flex;margin-top:48px;">
      ${chips.join('')}
    </div>
  </div>`;
}

export function ogImageResponse(preview) {
  const html = buildHtml(preview);
  return new ImageResponse(html, {
    width: 1200,
    height: 630,
  });
}
