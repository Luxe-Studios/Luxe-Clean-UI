/* Luxe menus – renders ox_lib's context / list / radial / alert / input UI in Luxe style.
   ox_lib still runs all the logic; clicks are sent back through the 'oxcb' callback. */
(() => {
    const root = document.getElementById('ox-root');
    const oxcb = (name, data, close = false) => post('oxcb', { name, data, close });
    const h = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const els = {};
    const remove = (key) => { if (els[key]) { els[key].remove(); delete els[key]; } };
    const mount = (key, el) => { remove(key); els[key] = el; root.appendChild(el); return el; };

    // ox_lib icons: 'car', 'fas fa-car', ['fas', 'car'], or an image url
    function icon(ic, color) {
        if (!ic) return '';
        if (Array.isArray(ic)) ic = `${ic[0] === 'fas' ? 'fa-solid' : ic[0]} fa-${ic[1]}`;
        ic = String(ic);
        if (/^(https?:|nui:|\.\/|data:)/.test(ic) || /\.(png|jpe?g|webp|svg|gif)$/i.test(ic)) return `<img src="${h(ic)}">`;
        const cls = ic.includes('fa-') ? ic : `fa-solid fa-${ic}`;
        return `<i class="${h(cls)}"${color ? ` style="color:${h(color)}"` : ''}></i>`;
    }
    const iconBox = (ic, color) => (ic ? `<div class="m-icon">${icon(ic, color)}</div>` : '');
    const barColor = (scheme) => {
        const map = { green: '#3ddc84', red: '#ff4d6d', yellow: '#ffb020', orange: '#ff8a3d', blue: '#4aa3ff', teal: '#2ec5ff', cyan: '#2ec5ff', violet: '#8b5cf6', grape: '#a855f7', pink: 'var(--accent)', indigo: '#6366f1', lime: '#a3e635', gray: '#9a9aab', dark: '#555' };
        return map[scheme] || 'var(--accent)';
    };
    const md = (t) => h(t)
        .replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

    /* ---------------------------------------------- Context menu */
    let ctx = null;
    function showContext(d) {
        ctx = d;
        const el = document.createElement('div');
        el.className = `ctx glass${d.position && String(d.position).includes('left') ? ' left' : ''}`;
        const opts = d.options || [];
        const isArr = Array.isArray(opts);
        const keys = isArr ? opts.map((_, i) => i) : Object.keys(opts).sort();
        el.innerHTML = `
            <div class="ctx-head">
                ${d.menu ? '<button class="hbtn" data-back>‹</button>' : ''}
                <div class="ctx-title">${h(d.title)}</div>
                ${d.canClose !== false ? '<button class="hbtn" data-close>✕</button>' : ''}
            </div>
            <div class="ctx-list">${keys.map((k) => {
                const o = opts[k] || {};
                const cls = o.disabled ? ' disabled' : o.readOnly ? ' readonly' : '';
                const meta = o.metadata ? (Array.isArray(o.metadata)
                    ? o.metadata.map((m) => (typeof m === 'object' ? `<div><b>${h(m.label)}</b><span>${h(m.value ?? '')}</span></div>` : `<div>${h(m)}</div>`)).join('')
                    : Object.entries(o.metadata).map(([a, b]) => `<div><b>${h(a)}</b><span>${h(b)}</span></div>`).join('')) : '';
                return `<div class="opt${cls}" data-k="${h(k)}">
                    ${iconBox(o.icon, o.iconColor)}
                    <div class="opt-body">
                        <div class="opt-title">${h(o.title ?? '')}</div>
                        ${o.description ? `<div class="opt-desc">${md(o.description)}</div>` : ''}
                        ${o.progress !== undefined ? `<div class="mbar"><div style="width:${Math.max(0, Math.min(100, o.progress))}%;background:${barColor(o.colorScheme)}"></div></div>` : ''}
                        ${meta ? `<div class="meta">${meta}</div>` : ''}
                        ${o.image ? `<img class="opt-img" src="${h(o.image)}">` : ''}
                    </div>
                    ${o.menu || o.arrow ? '<div class="opt-arrow">›</div>' : ''}
                </div>`;
            }).join('')}</div>`;
        el.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]')) return closeContext();
            if (e.target.closest('[data-back]')) return oxcb('openContext', { id: d.menu, back: true });
            const row = e.target.closest('.opt');
            if (!row) return;
            const k = isArr ? +row.dataset.k : row.dataset.k;
            const o = opts[k] || {};
            if (o.disabled || o.readOnly) return;
            if (o.menu) return oxcb('openContext', { id: o.menu });
            oxcb('clickContext', k);
        });
        mount('ctx', el);
    }
    function closeContext() {
        if (!ctx) return;
        ctx = null;
        remove('ctx');
        oxcb('closeContext', null, true);
    }

    /* ---------------------------------------------- List menu */
    let lm = null;
    function listValues(item) { return Array.isArray(item.values) ? item.values : null; }
    function renderList() {
        if (!lm) return;
        const items = lm.items;
        const el = els.lm || mount('lm', document.createElement('div'));
        el.className = `lm glass ${lm.position || 'top-left'}`;
        const sel = items[lm.index] || {};
        const vals = listValues(sel);
        let desc = sel.description || '';
        if (vals) { const v = vals[lm.scroll[lm.index] || 0]; if (v && typeof v === 'object' && v.description) desc = v.description; }
        el.innerHTML = `
            <div class="lm-head"><div class="lm-title">${h(lm.title)}</div><div class="lm-count">${lm.index + 1}/${items.length}</div></div>
            <div class="lm-list">${items.map((it, i) => {
                const v = listValues(it);
                let right = '';
                if (v) {
                    const cur = v[lm.scroll[i] || 0];
                    right = `<div class="li-val"><i class="ar">‹</i>${h(typeof cur === 'object' ? cur.label : cur)}<i class="ar">›</i></div>`;
                } else if (typeof it.checked === 'boolean') {
                    right = `<div class="chk${lm.checked[i] ? ' on' : ''}">${lm.checked[i] ? '✓' : ''}</div>`;
                }
                return `<div class="li${i === lm.index ? ' sel' : ''}">${iconBox(it.icon, it.iconColor)}<div class="li-label">${h(it.label)}${it.progress !== undefined ? `<div class="mbar"><div style="width:${it.progress}%;background:${barColor(it.colorScheme)}"></div></div>` : ''}</div>${right}</div>`;
            }).join('')}</div>
            ${desc ? `<div class="lm-desc">${md(desc)}</div>` : ''}
            <div class="lm-keys"><span><b>↑↓</b> select</span>${vals ? '<span><b>←→</b> change</span>' : ''}<span><b>Enter</b> confirm</span>${lm.canClose !== false ? '<span><b>Esc</b> close</span>' : ''}</div>`;
        const s = el.querySelector('.li.sel');
        if (s) s.scrollIntoView({ block: 'nearest' });
    }
    function showList(d) {
        const items = Array.isArray(d.items) ? d.items : Object.values(d.items || {});
        lm = { ...d, items, index: Math.min(d.startItemIndex || 0, items.length - 1), scroll: {}, checked: {} };
        items.forEach((it, i) => {
            if (listValues(it)) lm.scroll[i] = Math.max(0, (it.defaultIndex || 1) - 1);
            if (typeof it.checked === 'boolean') lm.checked[i] = it.checked;
        });
        renderList();
    }
    function closeList(key) {
        if (!lm) return;
        if (lm.canClose === false) return;
        lm = null;
        remove('lm');
        oxcb('closeMenu', key, true);
    }
    function listKey(e) {
        if (!lm) return false;
        const i = lm.index;
        const it = lm.items[i] || {};
        const vals = listValues(it);
        const n = lm.items.length;
        const sendSelected = () => {
            const j = lm.index;
            const jt = lm.items[j] || {};
            if (listValues(jt)) oxcb('changeSelected', [j, lm.scroll[j] || 0, 'isScroll']);
            else if (typeof jt.checked === 'boolean') oxcb('changeSelected', [j, !!lm.checked[j], 'isCheck']);
            else oxcb('changeSelected', [j]);
        };
        switch (e.key) {
            case 'ArrowDown': lm.index = (i + 1) % n; sendSelected(); break;
            case 'ArrowUp': lm.index = (i - 1 + n) % n; sendSelected(); break;
            case 'ArrowRight':
            case 'ArrowLeft':
                if (!vals) return true;
                lm.scroll[i] = ((lm.scroll[i] || 0) + (e.key === 'ArrowRight' ? 1 : -1) + vals.length) % vals.length;
                oxcb('changeIndex', [i, lm.scroll[i]]);
                break;
            case 'Enter':
                if (typeof it.checked === 'boolean') {
                    lm.checked[i] = !lm.checked[i];
                    oxcb('changeChecked', [i, lm.checked[i]]);
                } else {
                    const close = it.close !== false;
                    oxcb('confirmSelected', vals ? [i, lm.scroll[i] || 0] : [i], close);
                    if (close) { lm = null; remove('lm'); return true; }
                }
                break;
            case 'Escape': case 'Backspace': closeList(e.key); return true;
            default: return false;
        }
        renderList();
        return true;
    }

    /* ---------------------------------------------- Radial */
    let radial = null;
    let page = 0;
    let hover = -1;          // index within the current slice
    let slice = [];
    let pages = 1;
    const crumbs = [];       // submenu names (ox_lib doesn't send them, so we remember what was clicked)
    const PER_PAGE = 8;

    let radialGone;
    function showRadial(d) {
        clearTimeout(radialGone);
        if (!d) {
            // Hidden. ox_lib also hides it for a moment between submenus, so only forget it if it stays hidden
            remove('radial');
            radialGone = setTimeout(() => { radial = null; page = 0; crumbs.length = 0; }, 400);
            return;
        }
        if (!d.sub) crumbs.length = 0;
        radial = d;
        hover = -1;
        renderRadial();
    }

    function buildSlice() {
        const items = radial.items || [];
        const paged = items.length > PER_PAGE;
        pages = paged ? Math.ceil(items.length / (PER_PAGE - 1)) : 1;
        if (page >= pages) page = 0;
        const per = paged ? PER_PAGE - 1 : PER_PAGE;
        slice = items.slice(page * per, page * per + per).map((it, i) => ({ it, index: page * per + i }));
        if (paged) slice.push({ more: true });
    }

    function centerHtml() {
        const s = slice[hover];
        if (s) {
            if (s.more) return `<div class="rc-ic"><i class="fa-solid fa-ellipsis"></i></div><div class="rc-lbl">More</div><div class="rc-sub">Page ${page + 1}/${pages}</div>`;
            return `<div class="rc-ic">${icon(s.it.icon) || '<i class="fa-solid fa-circle"></i>'}</div><div class="rc-lbl">${h(s.it.label)}</div>${s.it.menu ? '<div class="rc-sub">Open ›</div>' : ''}`;
        }
        if (radial.sub) return `<div class="rc-ic">‹</div><div class="rc-lbl">${h(crumbs[crumbs.length - 1] || 'Back')}</div><div class="rc-sub">BACK</div>`;
        return `<div class="rc-ic">✕</div><div class="rc-sub">CLOSE</div>`;
    }

    function renderRadial() {
        buildSlice();
        const el = document.createElement('div');
        el.className = 'radial';
        const R = 35.5;
        const count = slice.length;
        el.innerHTML = '<div class="ring-bg"></div><div class="r-wedge"></div>' + slice.map((s, i) => {
            const a = (i / count) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(a) * R;
            const y = 50 + Math.sin(a) * R;
            const st = `left:${x}%;top:${y}%;animation-delay:${i * 22}ms`;
            if (s.more) return `<div class="r-item" data-s="${i}" style="${st}"><div class="ri"><i class="fa-solid fa-ellipsis"></i></div><span>More</span></div>`;
            return `<div class="r-item${s.it.menu ? ' has-sub' : ''}" data-s="${i}" style="${st}"><div class="ri">${icon(s.it.icon) || '<i class="fa-solid fa-circle"></i>'}</div><span>${h(s.it.label)}</span><b class="r-num">${i + 1}</b></div>`;
        }).join('') + `<div class="r-center" data-center>${centerHtml()}</div>` + (pages > 1 ? `<div class="r-pages">${Array.from({ length: pages }, (_, i) => `<i class="${i === page ? 'on' : ''}"></i>`).join('')}</div>` : '');
        mount('radial', el);
        setHover(hover);
    }

    function setHover(i) {
        hover = i;
        const el = els.radial;
        if (!el) return;
        el.querySelectorAll('.r-item').forEach((n) => n.classList.toggle('hot', +n.dataset.s === i));
        const wedge = el.querySelector('.r-wedge');
        if (i >= 0 && slice.length) {
            const span = 360 / slice.length;
            const start = i * span - span / 2;
            wedge.style.background = `conic-gradient(from ${start}deg, var(--accent-wedge) 0deg ${span}deg, transparent ${span}deg)`;
            wedge.style.opacity = '1';
        } else {
            wedge.style.opacity = '0';
        }
        el.querySelector('.r-center').innerHTML = centerHtml();
    }

    function choose(i) {
        const s = slice[i];
        if (!s) return;
        if (s.more) { page = (page + 1) % pages; hover = -1; renderRadial(); return; }
        if (s.it.menu) crumbs.push(s.it.label);
        page = 0;
        oxcb('radialClick', s.index);
    }
    function back() {
        if (radial && radial.sub) { crumbs.pop(); page = 0; oxcb('radialBack'); } else closeRadial();
    }
    function closeRadial() {
        if (!radial) return;
        radial = null; page = 0; crumbs.length = 0;
        remove('radial');
        oxcb('radialClose', null, true);
    }

    // Point in a direction to pick a slice (works anywhere on screen, not just over the buttons)
    document.addEventListener('mousemove', (e) => {
        const el = els.radial;
        if (!radial || !el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < r.width * 0.16) { if (hover !== -1) setHover(-1); return; } // over the centre button
        const ang = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;      // 0 = up, clockwise
        const span = 360 / slice.length;
        const i = Math.floor(((ang + span / 2) % 360) / span);
        if (i !== hover) setHover(i);
    });
    document.addEventListener('mousedown', (e) => {
        if (!radial || !els.radial) return;
        if (e.button === 2) { e.preventDefault(); back(); return; }
        if (e.button !== 0) return;
        if (hover >= 0) choose(hover); else back();
    });
    document.addEventListener('contextmenu', (e) => { if (radial) e.preventDefault(); });
    document.addEventListener('wheel', (e) => {
        if (!radial || pages < 2) return;
        page = (page + (e.deltaY > 0 ? 1 : -1) + pages) % pages;
        hover = -1;
        renderRadial();
    }, { passive: true });
    function radialKey(e) {
        if (!radial || !els.radial) return false;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= slice.length) { choose(n - 1); return true; }
        if (e.key === 'Backspace') { back(); return true; }
        return false;
    }

    /* ---------------------------------------------- Alert */
    let alertOpen = false;
    function showAlert(d) {
        alertOpen = true;
        const labels = d.labels || {};
        const wrap = document.createElement('div');
        wrap.className = 'dlg-wrap';
        wrap.innerHTML = `<div class="dlg glass ${h(d.size || '')}">
            ${d.header ? `<div class="dlg-head">${h(d.header)}</div>` : ''}
            <div class="dlg-body${d.centered ? ' center' : ''}">${md(d.content || '')}</div>
            <div class="dlg-foot">
                ${d.cancel ? `<button class="btn ghost" data-r="cancel">${h(labels.cancel || 'Cancel')}</button>` : ''}
                <button class="btn" data-r="confirm">${h(labels.confirm || 'Confirm')}</button>
            </div></div>`;
        wrap.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) closeAlert(b.dataset.r); });
        mount('alert', wrap);
        alertCancel = !!d.cancel;
    }
    let alertCancel = false;
    function closeAlert(result) {
        if (!alertOpen) return;
        alertOpen = false;
        remove('alert');
        oxcb('closeAlert', result, true);
    }

    /* ---------------------------------------------- Input dialog */
    let dlg = null;

    // ox_lib dates: values / min / max / default can be strings in row.format (e.g. 'YYYY-MM-DD',
    // 'DD/MM/YYYY') or timestamps. With returnString the script expects the formatted string back.
    const pad = (n) => String(n).padStart(2, '0');
    function parseDateValue(v, fmt) {
        if (v === undefined || v === null || v === '') return null;
        if (typeof v === 'number') return new Date(v);
        if (v === true) return new Date();
        const str = String(v);
        const f = fmt || 'YYYY-MM-DD';
        const order = (f.match(/YYYY|MM|DD/g) || ['YYYY', 'MM', 'DD']);
        const nums = str.match(/\d+/g);
        if (nums && nums.length >= 3) {
            const p = {};
            order.forEach((tok, i) => { p[tok] = +nums[i]; });
            if (p.YYYY && p.MM && p.DD) return new Date(p.YYYY, p.MM - 1, p.DD);
        }
        const d = new Date(str);
        return isNaN(d) ? null : d;
    }
    const toInputDate = (d) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '');
    function formatDate(d, fmt) {
        return (fmt || 'YYYY-MM-DD').replace('YYYY', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('DD', pad(d.getDate()));
    }
    function dateOut(row, value) {
        if (!value) return null;
        const [y, m, dd] = value.split('-').map(Number);
        const d = new Date(y, m - 1, dd);
        return row.returnString ? formatDate(d, row.format) : d.getTime();
    }
    function field(row, i) {
        const t = row.type || 'input';
        const req = row.required ? '<span class="req">*</span>' : '';
        // Icon goes inside the box for text / number / select fields, otherwise next to the label
        const iconInside = row.icon && (t === 'input' || t === 'number' || t === 'select');
        const lbl = t === 'checkbox' ? '' : `<div class="fld-lbl">${row.icon && !iconInside ? icon(row.icon) : ''}${h(row.label)}${req}</div>`;
        const dis = row.disabled ? ' disabled' : '';
        const ph = row.placeholder ? ` placeholder="${h(row.placeholder)}"` : '';
        const val = row.default ?? '';
        let input = '';
        switch (t) {
            case 'number':
                input = `<input type="number" data-i="${i}" value="${h(val)}"${row.min !== undefined ? ` min="${row.min}"` : ''}${row.max !== undefined ? ` max="${row.max}"` : ''} step="${row.step || (row.precision ? Math.pow(10, -row.precision) : 'any')}"${ph}${dis}>`;
                break;
            case 'textarea':
                input = `<textarea data-i="${i}"${ph}${dis}>${h(val)}</textarea>`;
                break;
            case 'checkbox':
                input = `<label class="chkrow"><input type="checkbox" data-i="${i}"${row.checked ? ' checked' : ''}${dis}><span class="chk${row.checked ? ' on' : ''}">${row.checked ? '✓' : ''}</span>${h(row.label)}${req}</label>`;
                break;
            case 'select':
                input = `<select data-i="${i}"${dis}><option value="">${h(row.placeholder || 'Select...')}</option>${(row.options || []).map((o) => `<option value="${h(o.value)}"${String(o.value) === String(val) ? ' selected' : ''}>${h(o.label ?? o.value)}</option>`).join('')}</select>`;
                break;
            case 'multi-select': {
                const def = Array.isArray(row.default) ? row.default.map(String) : [];
                input = `<div class="multi" data-i="${i}">${(row.options || []).map((o) => { const on = def.includes(String(o.value)); return `<label class="${on ? 'on' : ''}"><input type="checkbox" value="${h(o.value)}"${on ? ' checked' : ''}><span>${h(o.label ?? o.value)}</span></label>`; }).join('')}</div>`;
                break;
            }
            case 'slider': {
                const v = row.default ?? row.min ?? 0;
                input = `<div class="slider-row"><input type="range" data-i="${i}" min="${row.min ?? 0}" max="${row.max ?? 100}" step="${row.step ?? 1}" value="${v}"${dis}><b>${v}</b></div>`;
                break;
            }
            case 'color':
                input = `<input type="color" data-i="${i}" value="${h(row.default || '#ff148c')}"${dis}>`;
                break;
            case 'date': {
                const mn = toInputDate(parseDateValue(row.min, row.format));
                const mx = toInputDate(parseDateValue(row.max, row.format));
                const df = toInputDate(parseDateValue(row.default, row.format));
                const lim = `${mn ? ` min="${mn}"` : ''}${mx ? ` max="${mx}"` : ''}`;
                input = `<input type="date" data-i="${i}" value="${df}"${lim}${dis}>`;
                break;
            }
            case 'date-range': {
                const mn = toInputDate(parseDateValue(row.min, row.format));
                const mx = toInputDate(parseDateValue(row.max, row.format));
                const def = Array.isArray(row.default) ? row.default : [];
                const lim = `${mn ? ` min="${mn}"` : ''}${mx ? ` max="${mx}"` : ''}`;
                input = `<div class="range2"><input type="date" data-i="${i}" data-part="0" value="${toInputDate(parseDateValue(def[0], row.format))}"${lim}${dis}><span>→</span><input type="date" data-i="${i}" data-part="1" value="${toInputDate(parseDateValue(def[1], row.format))}"${lim}${dis}></div>`;
                break;
            }
            case 'time':
                input = `<input type="time" data-i="${i}"${dis}>`;
                break;
            default:
                input = `<input type="${row.password ? 'password' : 'text'}" data-i="${i}" value="${h(val)}"${ph}${dis}>`;
        }
        if (row.icon && (t === 'input' || t === 'number' || t === 'select')) input = `<div class="fld-in"><span class="fi">${icon(row.icon)}</span>${input}</div>`;
        return `<div class="fld">${lbl}${input}${row.description ? `<div class="fld-desc">${h(row.description)}</div>` : ''}</div>`;
    }
    function showDialog(d) {
        dlg = d;
        const rows = d.rows || [];
        const opts = d.options || {};
        const wrap = document.createElement('div');
        wrap.className = 'dlg-wrap';
        wrap.innerHTML = `<div class="dlg glass ${h(opts.size || '')}">
            <div class="dlg-head">${h(d.heading)}</div>
            <div class="dlg-body">${rows.map(field).join('')}</div>
            <div class="dlg-foot">
                ${opts.allowCancel !== false ? '<button class="btn ghost" data-a="cancel">Cancel</button>' : ''}
                <button class="btn" data-a="ok">Confirm</button>
            </div></div>`;
        wrap.addEventListener('input', (e) => {
            if (e.target.type === 'range') e.target.nextElementSibling.textContent = e.target.value;
        });
        wrap.addEventListener('change', (e) => {
            const t = e.target;
            if (t.type === 'checkbox' && t.closest('.chkrow')) { const c = t.nextElementSibling; c.classList.toggle('on', t.checked); c.textContent = t.checked ? '✓' : ''; }
            if (t.type === 'checkbox' && t.closest('.multi')) t.closest('label').classList.toggle('on', t.checked);
        });
        wrap.addEventListener('click', (e) => {
            const b = e.target.closest('[data-a]');
            if (!b) return;
            if (b.dataset.a === 'cancel') return closeDialog(null);
            submitDialog(wrap);
        });
        mount('dlg', wrap);
        const first = wrap.querySelector('input:not([type=checkbox]), textarea, select');
        if (first) setTimeout(() => first.focus(), 50);
    }
    function submitDialog(wrap) {
        const rows = dlg.rows || [];
        const out = [];
        let ok = true;
        rows.forEach((row, i) => {
            const t = row.type || 'input';
            const el = wrap.querySelector(`[data-i="${i}"]`);
            let v = null;
            if (t === 'checkbox') v = el.checked;
            else if (t === 'number' || t === 'slider') v = el.value === '' ? null : Number(el.value);
            else if (t === 'multi-select') { v = [...el.querySelectorAll('input:checked')].map((c) => c.value); if (!v.length) v = null; }
            else if (t === 'date') v = dateOut(row, el.value);
            else if (t === 'date-range') {
                const a = wrap.querySelector(`[data-i="${i}"][data-part="0"]`).value;
                const b = wrap.querySelector(`[data-i="${i}"][data-part="1"]`).value;
                v = a && b ? [dateOut(row, a), dateOut(row, b)] : null;
            } else if (t === 'time') {
                if (el.value) { const [hh, mm] = el.value.split(':'); const d = new Date(); d.setHours(+hh, +mm, 0, 0); v = d.getTime(); }
            } else v = el.value === '' ? null : el.value;
            if (t === 'select' && v !== null) {
                const o = (row.options || []).find((x) => String(x.value) === v);
                if (o) v = o.value;
            }
            const empty = v === null || v === '' || (t === 'checkbox' && v === false && row.required);
            let bad = (row.required && empty) || (t === 'number' && v !== null && ((row.min !== undefined && v < row.min) || (row.max !== undefined && v > row.max)));
            if (t === 'date' && el.value && ((el.min && el.value < el.min) || (el.max && el.value > el.max))) bad = true;
            const target = t === 'date-range' ? wrap.querySelectorAll(`[data-i="${i}"]`) : [el];
            target.forEach((x) => x.classList && x.classList.toggle('invalid', !!bad));
            if (bad) ok = false;
            out.push(v);
        });
        if (ok) closeDialog(out);
    }
    function closeDialog(values) {
        if (!dlg) return;
        dlg = null;
        remove('dlg');
        oxcb('inputData', values, true);
    }

    /* ---------------------------------------------- Keyboard */
    document.addEventListener('keydown', (e) => {
        if (lm && listKey(e)) { e.preventDefault(); return; }
        if (radialKey(e)) { e.preventDefault(); return; }
        if (e.key !== 'Escape') {
            if (e.key === 'Enter' && dlg && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); submitDialog(els.dlg); }
            return;
        }
        if (dlg) { if (!(dlg.options && dlg.options.allowCancel === false)) closeDialog(null); return; }
        if (alertOpen) { if (alertCancel) closeAlert('cancel'); return; }
        if (radial && els.radial) return closeRadial();
        if (ctx && ctx.canClose !== false) return closeContext();
    });

    /* ---------------------------------------------- Messages from ox_lib (via luxe_hud) */
    window.addEventListener('message', ({ data: msg }) => {
        if (!msg || msg.action !== 'ox' || !msg.data) return;
        const { action, data } = msg.data;
        switch (action) {
            case 'showContext': showContext(data || {}); break;
            case 'hideContext': ctx = null; remove('ctx'); break;
            case 'setMenu': showList(data || {}); break;
            case 'closeMenu': lm = null; remove('lm'); break;
            case 'openRadialMenu': showRadial(data); if (!data) { /* keep state for submenu transition */ } break;
            case 'sendAlert': showAlert(data || {}); break;
            case 'closeAlertDialog': alertOpen = false; remove('alert'); break;
            case 'openDialog': showDialog(data || {}); break;
            case 'closeInputDialog': dlg = null; remove('dlg'); break;
        }
    });

    /* ---------------------------------------------- Browser preview */
    if (typeof GetParentResourceName !== 'function') {
        const q = new URLSearchParams(location.search).get('demo');
        const send = (action, data) => window.postMessage({ action: 'ox', data: { action, data } }, '*');
        if (q === 'context') send('showContext', { title: 'Bin Dipping Reputation', menu: 'main', options: [
            { title: 'Level 4: Bin Baron', description: '1000 / 1500 rep to Garbage God', icon: 'dumpster', progress: 66, colorScheme: 'pink', readOnly: true },
            { title: 'Total rep: 1000', icon: 'star', readOnly: true },
            { title: 'Sell junk', description: 'Trade plastic & glass for cash', icon: 'dollar-sign', arrow: true },
            { title: 'Leaderboard', icon: 'trophy', menu: 'board', metadata: [{ label: 'Rank', value: '#3' }] },
            { title: 'Locked perk', description: 'Reach Garbage God', icon: 'lock', disabled: true },
        ] });
        if (q === 'list') send('setMenu', { title: 'Vehicle Options', position: 'top-left', startItemIndex: 1, items: [
            { label: 'Engine', icon: 'gear', description: 'Turn the engine on or off' },
            { label: 'Doors', icon: 'door-open', values: ['Front left', 'Front right', 'Rear left', 'Rear right', 'Boot'], description: 'Open or close a door' },
            { label: 'Neon lights', icon: 'lightbulb', checked: true },
            { label: 'Fuel', icon: 'gas-pump', progress: 62 },
        ] });
        if (q === 'radial') send('openRadialMenu', { items: [
            { label: 'Citizen', icon: 'user' }, { label: 'Vehicle', icon: 'car' }, { label: 'Reputation', icon: 'star' }, { label: 'Walkstyles', icon: 'person-walking' },
            { label: 'Emotes', icon: 'face-smile' }, { label: 'Clothing', icon: 'shirt' }, { label: 'Phone', icon: 'mobile' },
        ] });
        if (q === 'alert') send('sendAlert', { header: 'Sell 12x Plastic?', content: 'You will receive **$84** for your junk.\n\nThis cannot be undone.', centered: true, cancel: true, labels: { confirm: 'Sell', cancel: 'Not now' } });
        if (q === 'register') send('openDialog', { heading: 'Character Registration', rows: [
            { type: 'input', required: true, icon: 'user-pen', label: 'First Name', placeholder: 'Hank' },
            { type: 'input', required: true, icon: 'user-pen', label: 'Last Name', placeholder: 'Jordan' },
            { type: 'select', required: true, icon: 'circle-user', label: 'Sex', placeholder: 'Select sex', options: [{ value: 'Male' }, { value: 'Female' }] },
            { type: 'date', required: true, icon: 'calendar-days', label: 'Birth Date', format: 'YYYY-MM-DD', returnString: true, min: '1900-01-01', max: '2006-12-31', default: '2006-12-31' },
        ] });
        if (q === 'input') send('openDialog', { heading: 'Create Business', rows: [
            { type: 'input', label: 'Business name', placeholder: 'Luxe Studios', required: true, icon: 'building' },
            { type: 'number', label: 'Starting funds', default: 5000, min: 0, icon: 'dollar-sign' },
            { type: 'select', label: 'Type', options: [{ value: 'shop', label: 'Shop' }, { value: 'garage', label: 'Garage' }], default: 'shop' },
            { type: 'multi-select', label: 'Employees can', options: [{ value: 'sell', label: 'Sell' }, { value: 'buy', label: 'Buy stock' }, { value: 'bank', label: 'Use bank' }], default: ['sell'] },
            { type: 'slider', label: 'Tax rate', min: 0, max: 30, default: 12 },
            { type: 'checkbox', label: 'Open 24/7', checked: true },
        ] });
    }
})();
