function clamp(n) {
  return Math.min(255, Math.max(0, n));
}

function normalizeHex(hex) {
  if (!hex) return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return h;
}

function shade(hex, percent) {
  const h = normalizeHex(hex);
  if (!h) return hex;
  const num = parseInt(h, 16);
  const r = clamp(((num >> 16) & 0xff) + Math.round(255 * (percent / 100)));
  const g = clamp(((num >> 8) & 0xff) + Math.round(255 * (percent / 100)));
  const b = clamp((num & 0xff) + Math.round(255 * (percent / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getBrandVars(primaryColor) {
  if (!primaryColor || !normalizeHex(primaryColor)) return undefined;
  return {
    '--brand': primaryColor,
    '--brand-dark': shade(primaryColor, -18),
  };
}