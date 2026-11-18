// Luxe Clean UI — shared helpers, look and text UI
const RES = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'luxe_cleanui';
window.post = (name, data = {}) =>
  fetch(`https://${RES}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    .then((r) => r.json()).catch(() => null);

function hexToRgba(hex, a) {
  const m = String(hex).replace('#', '').match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function applyLook(l) {
  const root = document.documentElement.style;
  const accent = l.accent || '#e8e6e1';
  root.setProperty('--accent', accent);
  root.setProperty('--accent-soft', hexToRgba(accent, 0.14));
  root.setProperty('--accent-wedge', hexToRgba(accent, 0.5));
  const n = parseInt(accent.slice(1, 7), 16);
  const lum = ((n >> 16 & 255) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 1000;
  root.setProperty('--accent-text', lum > 150 ? '#151517' : '#ffffff');
  root.setProperty('--scale', l.size === 'small' ? 0.88 : l.size === 'large' ? 1.14 : 1);
  root.setProperty('--rscale', l.radialScale || 1);
  document.body.classList.toggle('solid', l.background === 'solid');
  document.body.classList.toggle('radial-ring', l.radialStyle === 'ring');
}

/* text UI: [E] Open garage */
function textui(d) {
  const el = document.getElementById('textui');
  if (!d.show) { el.classList.add('out'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add('hidden'), 200); return; }
  clearTimeout(el._t);
  el.className = `glass ${d.position || 'right'}`;
  document.getElementById('tuiKey').textContent = d.key || '';
  document.getElementById('tuiKey').style.display = d.key ? '' : 'none';
  const ic = document.getElementById('tuiIcon');
  ic.innerHTML = !d.key && d.icon ? `<i class="fa-solid fa-${String(d.icon).replace(/^fa-/, '').replace(/[^a-z0-9-]/gi, '')}"${d.iconColor ? ` style="color:${String(d.iconColor).replace(/[^#a-z0-9(),. ]/gi, '')}"` : ''}></i>` : '';
  document.getElementById('tuiText').textContent = d.text || '';
}

window.addEventListener('message', ({ data: m }) => {
  if (!m) return;
  if (m.action === 'look') applyLook(m.data || {});
  if (m.action === 'textui') textui(m.data || {});
});
