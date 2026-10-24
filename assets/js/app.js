// Seven Pro League × VAR Tienda Deportiva — base compartida por todas las páginas.
// Datos: la API del panel (Cloudflare Worker) es la fuente; si falla, se usan las copias de /data.
'use strict';

const SP = window.SP = {};
SP.API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8787' : 'https://sevenpro-api.sarmientobrayder10.workers.dev';
SP.PANEL = SP.API + '/admin';

// ───────── utilidades ─────────
const $ = SP.$ = (s, el = document) => el.querySelector(s);
const $$ = SP.$$ = (s, el = document) => [...el.querySelectorAll(s)];
SP.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
SP.fmt = n => '$' + Math.round(n || 0).toLocaleString('es-CO');
SP.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
SP.movil = matchMedia('(max-width: 900px)');
SP.store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin espacio o modo privado */ } },
};
SP.wa = (numero, texto) => `https://wa.me/${String(numero || '').replace(/\D/g, '')}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
// fotos del proveedor (Shopify) a un ancho concreto; las demás tal cual
SP.img = (url, w) => !url ? '' : /cdn\.shopify\.com|\/cdn\/shop\//.test(url) ? url.replace(/\?.*$/, '') + '?width=' + w : url;
SP.fecha = (iso, op = { weekday: 'short', day: 'numeric', month: 'short' }) => {
  if (!iso) return 'Por definir';
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('es-CO', op).replace('.', '');
};
SP.hora = h => {
  if (!h) return '';
  const [H, M] = h.split(':').map(Number);
  return `${((H + 11) % 12) + 1}:${String(M).padStart(2, '0')} ${H < 12 ? 'a. m.' : 'p. m.'}`;
};

SP.ICON = {
  arrow: '<svg class="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  bag: '<svg class="i" viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/></svg>',
  close: '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  minus: '<svg class="i" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  plus: '<svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg class="i" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
  ext: '<svg class="i" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.83 9.83 0 0 1 9.88 9.9c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.24-6.16-3.48-8.4"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5.02C13.8 0 15.1.01 16.4 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>',
};
SP.ICON.whatsapp = SP.ICON.wa;

// ───────── datos: caché local → API → copia estática ─────────
// cada nombre ('sitio' | 'torneo' | 'productos') se pinta enseguida con lo guardado y se refresca al llegar lo nuevo
const pedidos = {}; // una sola petición por dato aunque varias partes de la página lo pidan
SP.cargar = (nombre, alListo) => {
  const k = 'sp:' + nombre, cache = SP.store.get(k, null);
  let ultimo = cache ? JSON.stringify(cache) : '';
  // se pinta con la caché apenas termine de cargar el script de la página (así todo está declarado)
  if (cache) queueMicrotask(() => alListo(cache, true));
  const red = pedidos[nombre] ||= fetch(`${SP.API}/api/${nombre}`, { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .catch(() => fetch(`data/${nombre}.json`).then(r => r.json()));
  return red.then(d => {
    const s = JSON.stringify(d);
    if (s !== ultimo) { ultimo = s; SP.store.set(k, d); alListo(d, false); }
    return d;
  }).catch(e => { console.warn('Sin datos de', nombre, e); if (!cache) alListo(null, false); });
};

// ───────── torneo: tabla y goleadores salen de los resultados ─────────
SP.equipoPorId = t => Object.fromEntries((t.equipos || []).map(e => [e.id, e]));
SP.jugadorPorId = t => Object.fromEntries((t.equipos || []).flatMap(e => (e.jugadores || []).map(j => [j.id, { ...j, equipo: e.id }])));
SP.jugados = t => (t.partidos || []).filter(p => p.estado === 'finalizado' && Number.isFinite(+p.gl) && Number.isFinite(+p.gv) && p.gl !== null && p.gv !== null);
SP.tabla = t => {
  const R = { pg: 3, pe: 1, pp: 0, ...(t.reglas || {}) };
  const T = Object.fromEntries((t.equipos || []).map(e => [e.id, { eq: e, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0, forma: [] }]));
  for (const p of SP.jugados(t).sort((a, b) => a.fecha - b.fecha)) {
    const L = T[p.local], V = T[p.visita];
    if (!L || !V) continue;
    const gl = +p.gl, gv = +p.gv;
    for (const [x, gf, gc] of [[L, gl, gv], [V, gv, gl]]) {
      x.pj++; x.gf += gf; x.gc += gc;
      if (gf > gc) { x.pg++; x.pts += R.pg; x.forma.push('G'); }
      else if (gf === gc) { x.pe++; x.pts += R.pe; x.forma.push('E'); }
      else { x.pp++; x.pts += R.pp; x.forma.push('P'); }
    }
  }
  return Object.values(T).map(x => ({ ...x, dif: x.gf - x.gc, forma: x.forma.slice(-5) }))
    .sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf || a.eq.nombre.localeCompare(b.eq.nombre));
};
SP.goleadores = t => {
  const J = SP.jugadorPorId(t), E = SP.equipoPorId(t), c = {};
  for (const p of SP.jugados(t)) for (const g of p.goles || []) {
    if (!g.jugador || g.tipo === 'autogol') continue;
    c[g.jugador] = (c[g.jugador] || 0) + 1;
  }
  return Object.entries(c).map(([id, goles]) => ({ jugador: J[id] || { nombre: id }, equipo: E[J[id]?.equipo], goles }))
    .sort((a, b) => b.goles - a.goles || a.jugador.nombre.localeCompare(b.jugador.nombre));
};
SP.fechas = t => [...new Set((t.partidos || []).map(p => p.fecha))].sort((a, b) => a - b);
SP.proximaFecha = t => {
  const pend = (t.partidos || []).filter(p => p.estado !== 'finalizado');
  return pend.length ? Math.min(...pend.map(p => p.fecha)) : null;
};
SP.descansa = (t, fecha) => {
  const juegan = new Set((t.partidos || []).filter(p => p.fecha === fecha).flatMap(p => [p.local, p.visita]));
  return (t.equipos || []).filter(e => !juegan.has(e.id));
};

// ───────── producto: tarjeta del catálogo ─────────
// descuento real: La Gambeta suele poner un "antes" casi igual al precio; solo se muestra si baja 10 % o más
SP.rebaja = (precio, antes) => antes > precio && (1 - precio / antes) >= .1 ? Math.round((1 - precio / antes) * 100) : 0;
SP.CATS = { guayos: { nombre: 'Guayos', code: 'FG', sup: 'Césped natural' }, torretin: { nombre: 'Torretín', code: 'TF', sup: 'Grama sintética' }, futsal: { nombre: 'Futsal', code: 'IC', sup: 'Cancha cubierta' } };
SP.urlProducto = (p, color) => `producto.html?id=${encodeURIComponent(p.id)}${color ? '&c=' + encodeURIComponent(color) : ''}`;
SP.tarjeta = (p, i = 0) => {
  const c = p.colores?.[0] || {};
  const g = c.hex?.[0] || '#3FE0F0';
  const foto = c.foto ? `<img src="${SP.esc(c.foto)}" alt="${SP.esc(p.marca + ' ' + p.nombre)}" loading="lazy" decoding="async">`
    : `<img class="foto" src="${SP.esc(SP.img(c.fotos?.[0], 500))}" alt="${SP.esc(p.marca + ' ' + p.nombre)}" loading="lazy" decoding="async">`;
  const n = p.colores?.length || 0;
  const dots = (p.colores || []).slice(0, 4).map(x => `<i style="background:${SP.esc(x.hex?.[0] || '#888')}"></i>`).join('');
  const reb = SP.rebaja(p.precio, p.antes);
  const tags = [p.nuevo && '<span class="nuevo">Nuevo</span>', reb >= 15 && `<span class="oferta">-${reb}%</span>`, p.nino && '<span class="nino">Niño</span>'].filter(Boolean).join('');
  return `<article class="pcard r" style="--g:${SP.esc(g)};--d:${(i % 4) * .06}s">
    <div class="pcard-media">${foto}${tags ? `<div class="tag">${tags}</div>` : ''}<span class="sup-code">${SP.CATS[p.cat]?.code || ''}</span></div>
    <div class="pcard-body">
      <p class="pcard-brand"><span>${SP.esc(p.marca)}</span><span>${SP.esc(SP.CATS[p.cat]?.nombre || '')}</span></p>
      <h3 class="pcard-name">${SP.esc(p.nombre)}</h3>
      <div class="pcard-foot"><p class="price">${reb ? `<s>${SP.fmt(p.antes)}</s>` : ''}${SP.fmt(p.precio)}</p>
        <span class="dots">${dots}${n > 4 ? `+${n - 4}` : ''}</span></div>
    </div>
    <a class="pcard-hit" href="${SP.urlProducto(p)}" aria-label="${SP.esc(`${p.marca} ${p.nombre}, ${SP.fmt(p.precio)}`)}"></a>
  </article>`;
};

// ───────── aparición al hacer scroll ─────────
const revObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .06 });
SP.revelar = (root = document) => $$('.r:not(.in)', root).forEach(el => revObs.observe(el));
const offObs = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off', !e.isIntersecting)));
SP.pausarFuera = el => el && offObs.observe(el);

// ───────── pestañas con píldora deslizante ─────────
SP.pildora = tabs => {
  const pill = $('.tabs-pill', tabs), on = $('[aria-selected="true"]', tabs);
  if (!pill || !on) return;
  pill.style.width = on.offsetWidth + 'px';
  pill.style.transform = `translateX(${on.offsetLeft}px)`;
};

// ───────── bloqueo del scroll para ventanas ─────────
let lockY = 0, locks = 0;
SP.lock = () => { if (locks++) return; lockY = scrollY; document.body.style.top = `-${lockY}px`; document.body.classList.add('lock', 'modal-open'); };
SP.unlock = () => { if (--locks > 0) return; locks = 0; document.body.classList.remove('lock', 'modal-open'); document.body.style.top = ''; scrollTo({ top: lockY, behavior: 'instant' }); };

// ───────── estructura común: barra de avisos, cabecera, menú, pie, bolsa ─────────
const PAGINAS = [['inicio', 'index.html', 'Inicio'], ['torneo', 'torneo.html', 'Torneo'], ['tienda', 'tienda.html', 'Tienda'], ['guia', 'guia.html', 'Guía'], ['patro', 'index.html#patrocinadores', 'Patrocinadores']];
const pagina = document.body.dataset.page;
document.body.insertAdjacentHTML('afterbegin', `
  <div class="topbar" aria-hidden="true"><div class="topbar-track" id="topbar"></div></div>
  <header class="nav" id="nav">
    <div class="wrap nav-in">
      <a class="brand" href="index.html" aria-label="Seven Pro League × VAR Tienda Deportiva — inicio">
        <img src="assets/img/logos/seven-pro-league.png" alt="" width="46" height="46"><span class="x">×</span><img class="var" src="assets/img/logos/var-tienda.png" alt="">
        <span class="brand-t"><b>Seven Pro</b><small>League · Shop</small></span>
      </a>
      <nav class="links" aria-label="Secciones">${PAGINAS.map(([k, h, t]) => `<a href="${h}"${k === pagina ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
      <div class="nav-act">
        <button class="icon-btn" id="bag-btn" aria-label="Abrir la bolsa">${SP.ICON.bag}<span class="bag-n" id="bag-n">0</span></button>
        <button class="icon-btn menu-btn" id="menu-btn" aria-label="Abrir el menú" aria-expanded="false"><span></span></button>
      </div>
    </div>
  </header>
  <div class="menu" id="menu">
    <nav aria-label="Menú">${PAGINAS.map(([k, h, t], i) => `<a class="display" href="${h}" style="--i:${i}">${t}<small>0${i + 1}</small></a>`).join('')}</nav>
    <a class="btn btn-wa btn-block" data-wa-general href="#" target="_blank" rel="noopener">${SP.ICON.wa.replace('<svg', '<svg width="20" height="20" fill="currentColor"')} Escríbenos</a>
  </div>`);
document.body.insertAdjacentHTML('beforeend', `
  <footer class="foot">
    <div class="wrap">
      <p class="foot-slogan display r">El poder del <span class="grad">fútbol aficionado</span></p>
      <div class="foot-grid">
        <div class="foot-brand">
          <div class="logos"><img src="assets/img/logos/seven-pro-league.png" alt="Seven Pro League"><span class="display accent">×</span><img src="assets/img/logos/var-tienda.png" alt="VAR Tienda Deportiva"></div>
          <p>Seven Pro League y VAR Tienda Deportiva: el torneo de fútbol 7 de Barranquilla y la tienda que lo equipa.</p>
        </div>
        <div><h4>Torneo</h4><ul><li><a href="torneo.html#posiciones">Posiciones</a></li><li><a href="torneo.html#resultados">Resultados</a></li><li><a href="torneo.html#goleadores">Goleadores</a></li><li><a href="torneo.html#inscripcion">Inscripciones</a></li></ul></div>
        <div><h4>Tienda</h4><ul><li><a href="tienda.html?cat=guayos">Guayos</a></li><li><a href="tienda.html?cat=torretin">Torretín</a></li><li><a href="tienda.html?cat=futsal">Futsal</a></li><li><a href="guia.html">Guía de tallas</a></li></ul></div>
        <div><h4>Síguenos</h4><ul id="foot-redes"></ul></div>
      </div>
      <div class="foot-b">
        <span>© ${new Date().getFullYear()} Seven Pro League × VAR Tienda Deportiva</span>
        <a class="wn" href="https://www.webnaria.store/?utm_source=sevenpro&amp;utm_medium=footer" target="_blank" rel="noopener"><img src="assets/img/logos/webnaria.png" alt="">Página realizada por <b>Webnaria</b></a>
      </div>
    </div>
  </footer>
  <a class="wa-float" data-wa-general href="#" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${SP.ICON.wa}</a>
  <aside class="bag" id="bag" role="dialog" aria-modal="true" aria-label="Tu bolsa" hidden>
    <div class="bag-scrim" data-close-bag></div>
    <div class="bag-panel">
      <div class="bag-head"><h2 class="display">Tu bolsa</h2><button class="icon-btn" data-close-bag aria-label="Cerrar la bolsa">${SP.ICON.close}</button></div>
      <div class="bag-list" id="bag-list"></div>
      <div class="bag-foot" id="bag-foot">
        <div class="bag-total"><span>Total</span><b id="bag-total">$0</b></div>
        <p class="bag-note">Te confirmamos disponibilidad, pago y entrega por WhatsApp.</p>
        <a class="btn btn-wa btn-block" id="bag-send" href="#" target="_blank" rel="noopener">${SP.ICON.wa.replace('<svg', '<svg width="20" height="20" fill="currentColor"')} Enviar pedido</a>
      </div>
    </div>
  </aside>
  <div class="toast" id="toast" role="status" aria-live="polite"><span id="toast-txt"></span><button id="toast-btn">Ver bolsa</button></div>`);

// menú de celular
const menuBtn = $('#menu-btn');
SP.setMenu = open => { document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', open); };
menuBtn.addEventListener('click', () => SP.setMenu(!document.body.classList.contains('menu-open')));
$$('#menu a').forEach(a => a.addEventListener('click', () => SP.setMenu(false)));

// cabecera que se esconde al bajar (celular)
let lastY = scrollY, ticking = false;
addEventListener('scroll', () => {
  if (ticking || document.body.classList.contains('lock')) return; ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY, dy = y - lastY, b = document.body.classList;
    if (SP.movil.matches && !b.contains('menu-open') && y > 500) { if (dy > 8) b.add('nav-hide'); else if (dy < -8) b.remove('nav-hide'); }
    else b.remove('nav-hide');
    lastY = y; ticking = false;
  });
}, { passive: true });

// sitio: avisos, WhatsApp general y redes del pie
SP.sitio = null;
SP.alSitio = [];
SP.cargar('sitio', s => {
  if (!s) return;
  SP.sitio = s;
  const av = (s.avisos || []).filter(Boolean);
  $('#topbar').innerHTML = [...av, ...av, ...av, ...av].map(a => `<span>${SP.esc(a)}</span>`).join('');
  const gen = s.tienda?.enlace || SP.wa(s.tienda?.whatsapp, `Hola ${s.tienda?.nombre || 'VAR'} 👋`);
  $$('[data-wa-general]').forEach(a => { a.href = gen; });
  $('#foot-redes').innerHTML = (s.redes || []).map(r => `<li><a href="${SP.esc(r.url)}" target="_blank" rel="noopener">${SP.esc(r.usuario || r.red)}</a></li>`).join('');
  SP.alSitio.forEach(f => f(s));
  pintarBolsa();
});
SP.redesHTML = redes => (redes || []).map(r => `<a class="social" href="${SP.esc(r.url)}" target="_blank" rel="noopener">${SP.ICON[r.red] || SP.ICON.ext}<span>${SP.esc(r.nombre || r.red)}<small>${SP.esc(r.usuario || '')}</small></span></a>`).join('');
SP.patrocinadoresHTML = lista => (lista || []).filter(p => p.visible !== false).map((p, i) => `<a class="sponsor r" style="--d:${(i % 5) * .06}s" ${p.url ? `href="${SP.esc(p.url)}" target="_blank" rel="noopener"` : ''}><figure><img src="${SP.esc(p.logo)}" alt="${SP.esc(p.nombre)}" loading="lazy"></figure><span>${SP.esc(p.nombre)}</span></a>`).join('');

// ───────── bolsa (pedido por WhatsApp) ─────────
const bag = $('#bag'), bagN = $('#bag-n');
let items = SP.store.get('sp:bolsa', []);
const guardar = () => SP.store.set('sp:bolsa', items);
SP.agregar = it => {
  const x = items.find(i => i.id === it.id && i.color === it.color && i.talla === it.talla);
  if (x) x.cant++; else items.push({ ...it, cant: 1 });
  guardar(); pintarBolsa(); bump();
};
function bump() { bagN.classList.remove('bump'); void bagN.offsetWidth; bagN.classList.add('bump'); }
function pintarBolsa() {
  const n = items.reduce((s, i) => s + i.cant, 0), total = items.reduce((s, i) => s + i.precio * i.cant, 0);
  bagN.textContent = n; bagN.classList.toggle('on', n > 0);
  $('#bag-foot').hidden = !n;
  $('#bag-list').innerHTML = !n
    ? `<div class="bag-empty"><b>Tu bolsa está vacía</b>Agrega tus guayos y envía el pedido por WhatsApp.<br><br><a class="btn btn-ghost btn-sm" href="tienda.html">Ir a la tienda</a></div>`
    : items.map((i, k) => `<div class="bag-item" style="--g:${SP.esc(i.hex || '#3FE0F0')}">
        <figure><img src="${SP.esc(i.foto)}" alt=""></figure>
        <div><h3>${SP.esc(i.nombre)}</h3><p class="meta">Talla ${SP.esc(i.talla)} · ${SP.esc(i.colorNombre || '')}</p>
          <div class="bag-row"><div class="qty"><button data-q="${k}" data-d="-1" aria-label="Quitar uno">${SP.ICON.minus}</button><span>${i.cant}</span><button data-q="${k}" data-d="1" aria-label="Agregar uno">${SP.ICON.plus}</button></div><b class="tech">${SP.fmt(i.precio * i.cant)}</b></div>
          <button class="rm" data-rm="${k}">Quitar</button></div></div>`).join('');
  $('#bag-total').textContent = SP.fmt(total);
  const t = SP.sitio?.tienda || {};
  const lineas = items.map(i => `• ${i.nombre} — ${i.colorNombre || ''}\n   Talla ${i.talla} · ${i.cant} ${i.cant > 1 ? 'pares' : 'par'} · ${SP.fmt(i.precio * i.cant)}`).join('\n');
  $('#bag-send').href = SP.wa(t.whatsapp || '573112204194', `Hola ${t.nombre || 'VAR Tienda Deportiva'} 👋, quiero hacer este pedido:\n\n${lineas}\n\nTotal: ${SP.fmt(total)}\n\n¿Me confirman disponibilidad, pago y entrega? ⚽`);
}
$('#bag-list').addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
  if (q) { const it = items[+q.dataset.q]; it.cant += +q.dataset.d; if (it.cant < 1) items.splice(+q.dataset.q, 1); }
  else if (rm) items.splice(+rm.dataset.rm, 1);
  else return;
  guardar(); pintarBolsa();
});
SP.abrirBolsa = () => {
  if (!bag.hidden) return;
  bag.hidden = false; SP.lock();
  requestAnimationFrame(() => requestAnimationFrame(() => bag.classList.add('open')));
  history.pushState({ bolsa: 1 }, '', location.pathname + location.search + '#bolsa');
};
const ocultarBolsa = () => { if (bag.hidden) return; bag.classList.remove('open'); setTimeout(() => { bag.hidden = true; SP.unlock(); }, SP.reduce ? 0 : 450); };
SP.cerrarBolsa = () => (history.state?.bolsa ? history.back() : ocultarBolsa());
$('#bag-btn').addEventListener('click', SP.abrirBolsa);
bag.addEventListener('click', e => { if (e.target.closest('[data-close-bag]')) SP.cerrarBolsa(); });
addEventListener('popstate', () => { if (!bag.hidden && !history.state?.bolsa) ocultarBolsa(); });
addEventListener('keydown', e => { if (e.key === 'Escape') { if (!bag.hidden) SP.cerrarBolsa(); else SP.setMenu(false); } });
pintarBolsa();

let toastT;
SP.toast = (txt, conBolsa = true) => {
  $('#toast-txt').textContent = txt; $('#toast-btn').hidden = !conBolsa;
  const t = $('#toast'); t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
};
$('#toast-btn').addEventListener('click', () => { $('#toast').classList.remove('show'); SP.abrirBolsa(); });

addEventListener('resize', () => $$('.tabs').forEach(SP.pildora));
document.fonts?.ready.then(() => $$('.tabs').forEach(SP.pildora));
SP.revelar();
