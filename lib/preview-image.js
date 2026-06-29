// Renders a 1200x630 PNG preview card for og:image (Node / Render).
import React from 'react';
import { ImageResponse } from '@vercel/og';

function statusColor(status) {
  if (status === 'Won') return '#22c55e';
  if (status === 'Lost') return '#ef4444';
  return '#eab308';
}

export async function renderPreviewPng(preview) {
  const accent = statusColor(preview.status);
  const heading = preview.isParlay
    ? `${preview.legCount}-leg parlay`
    : preview.matchup || 'Bet';

  const sub = preview.isParlay
    ? (preview.legs || [])
        .map((l) => l.pick)
        .filter(Boolean)
        .slice(0, 4)
        .join('  ·  ')
    : [preview.league, preview.marketName].filter(Boolean).join('  ·  ');

  const chips = [];
  if (preview.pick && !preview.isParlay) {
    chips.push({ label: 'Pick', value: preview.pick });
  }
  if (preview.stake) chips.push({ label: 'Stake', value: preview.stake });
  if (preview.odds) chips.push({ label: 'Odds', value: preview.odds });
  if (preview.status) chips.push({ label: 'Status', value: preview.status });

  const image = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#0b1220',
          padding: '72px',
          fontFamily: 'system-ui, sans-serif',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        React.createElement(
          'div',
          { style: { fontSize: 34, color: '#ffffff', fontWeight: 800 } },
          preview.siteName
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              background: accent,
              borderRadius: 999,
              padding: '10px 28px',
              fontSize: 28,
              color: '#0b1220',
              fontWeight: 800,
            },
          },
          preview.status || 'Bet'
        )
      ),
      React.createElement(
        'div',
        {
          style: { display: 'flex', flexDirection: 'column', marginTop: 'auto' },
        },
        React.createElement(
          'div',
          { style: { fontSize: 30, color: '#60a5fa', fontWeight: 600 } },
          `@${preview.username}`
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: 56,
              color: '#ffffff',
              fontWeight: 800,
              marginTop: 12,
              lineHeight: 1.1,
            },
          },
          heading
        ),
        sub
          ? React.createElement(
              'div',
              { style: { fontSize: 28, color: '#94a3b8', marginTop: 16 } },
              sub
            )
          : null
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', marginTop: 48 } },
        ...chips.map((chip) =>
          React.createElement(
            'div',
            {
              key: chip.label,
              style: {
                display: 'flex',
                flexDirection: 'column',
                marginRight: 48,
              },
            },
            React.createElement(
              'div',
              {
                style: {
                  fontSize: 22,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                },
              },
              chip.label
            ),
            React.createElement(
              'div',
              {
                style: {
                  fontSize: 40,
                  color: '#ffffff',
                  fontWeight: 700,
                  marginTop: 6,
                },
              },
              chip.value
            )
          )
        )
      )
    ),
    { width: 1200, height: 630 }
  );

  return Buffer.from(await image.arrayBuffer());
}
