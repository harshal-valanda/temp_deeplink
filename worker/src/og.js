// Renders a per-bet preview image (1200x800 PNG) at the edge using workers-og
// (Satori). The markup is intentionally flexbox-only, which is what Satori
// supports.
import { ImageResponse } from 'workers-og';
import { Background } from './components/Background.js';

const WIDTH = 1200;
const HEIGHT = 800;

function buildHtml() {
  return Background({ width: WIDTH, height: HEIGHT });
}

export function ogImageResponse(_preview) {
  const html = buildHtml();
  return new ImageResponse(html, {
    width: WIDTH,
    height: HEIGHT,
  });
}
