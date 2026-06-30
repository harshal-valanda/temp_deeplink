export function Background({ width, height } = {}) {
  return `
    <div style="display:flex;width:${width}px;height:${height}px;background:linear-gradient(to bottom right, #000000 0%, rgba(237, 103, 14, 1) 100%);"></div>`;
}
