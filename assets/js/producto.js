// Ficha de producto: color, talla, bolsa y pedido por WhatsApp
// varias descripciones importadas vienen cortadas a mitad de frase: se muestran hasta la última frase completa
const descLimpia = d => {
  let t = String(d).replace(/_{3,}/g, ' ').replace(/\s+/g, ' ').trim();
  if (/[.!?)»"]$/.test(t)) return t;
  const k = Math.max(t.lastIndexOf('. '), t.lastIndexOf('! '), t.lastIndexOf('? '));
  return k > 40 ? t.slice(0, k + 1) : t.replace(/[,;:\s]+$/, '') + '…';
};
'use strict';
(() => {
  const { $, $$, esc, fmt, ICON } = SP;
  const qs = new URLSearchParams(location.search);
  const id = qs.get('id');
  let P = null, color = null, talla = null, todos = [];

  SP.cargar('productos', ps => {
    if (!ps) return noExiste();
    todos = ps;
    const p = ps.find(x => x.id === id);
    if (!p) return noExiste();
    const nuevo = !P || P.id !== p.id;
    P = p;
    color = p.colores.find(c => c.id === (color?.id || qs.get('c'))) || p.colores[0];
    if (nuevo) talla = null;
    pintar();
    relacionados();
  });
  function noExiste() {
    $('#pd').innerHTML = `<div class="empty" style="grid-column:1/-1"><h2 class="display h2">No encontramos este modelo</h2><p style="margin:12px 0 22px">Puede que ya no esté disponible.</p><a class="btn btn-primary" href="tienda.html">Ver la tienda ${ICON.arrow}</a></div>`;
  }

  const slides = c => [
    ...(c.foto ? [{ src: c.foto, cut: true }] : []),
    ...(c.fotos || []).map(u => ({ src: SP.img(u, 1000), thumb: SP.img(u, 200) })),
  ];

  function pintar() {
    const cat = SP.CATS[P.cat] || {};
    const nombre = `${P.marca} ${P.nombre}`;
    document.title = `${nombre} · Seven Pro Shop × VAR`;
    $('meta[name="description"]').setAttribute('content', `${nombre} — ${cat.nombre || ''} ${cat.code || ''}. ${fmt(color.precio || P.precio)}. Pide por WhatsApp.`);
    $('#crumbs').innerHTML = `<a href="index.html">Inicio</a> / <a href="tienda.html">Tienda</a> / <a href="tienda.html?cat=${esc(P.cat)}">${esc(cat.nombre || '')}</a> / ${esc(P.nombre)}`;
    const precio = color.precio || P.precio, antes = color.antes || 0;
    const tallas = color.tallas || [];
    const s = slides(color);
    $('#pd').innerHTML = `
      <div class="pd-gal">
        <div class="pd-stage" style="--g:${esc(color.hex?.[0] || '#3FE0F0')}"><div class="pd-track" id="track">${s.map((x, i) => `<div class="pd-slide"><img class="${x.cut ? 'cut' : 'foto'}" src="${esc(x.src)}" alt="${esc(nombre)}, foto ${i + 1}" ${i ? 'loading="lazy"' : ''}></div>`).join('')}</div></div>
        <div class="pd-thumbs" id="thumbs">${s.map((x, i) => `<button class="${x.cut ? 'cut' : ''}" aria-current="${i === 0}" aria-label="Foto ${i + 1}"><img src="${esc(x.thumb || x.src)}" alt="" loading="lazy"></button>`).join('')}</div>
      </div>
      <div class="pd-info">
        <p class="marca">${esc(P.marca)} <span>· ${esc(cat.nombre || '')} ${esc(cat.code || '')}</span></p>
        <h1 class="display">${esc(P.nombre)}</h1>
        <div class="pd-price">${SP.descuentoHoy() ? `<b>${fmt(SP.menos(precio, SP.descuentoHoy()))}</b><s>${fmt(precio)}</s><em>-${SP.descuentoHoy()}% hoy</em>` : `<b>${fmt(precio)}</b>${SP.rebaja(precio, antes) ? `<s>${fmt(antes)}</s><em>-${SP.rebaja(precio, antes)}%</em>` : ''}`}</div>
        ${P.desc ? `<p class="pd-desc">${esc(descLimpia(P.desc))}</p>` : ''}
        <div class="specs">${[['Superficie', cat.sup], ['Suela', cat.code], ['Colores', P.colores.length]].filter(x => x[1]).map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
        ${P.colores.length > 1 ? `<div class="pd-block"><h3>Color <b>${esc(color.nombre || '')}</b></h3><div class="colores" id="colores">${P.colores.map(c => `<button style="--c:${esc(c.hex?.[0] || '#888')}" data-c="${esc(c.id)}" aria-pressed="${c.id === color.id}" aria-label="Color ${esc(c.nombre)}"><img src="${esc(c.foto || SP.img(c.fotos?.[0], 160))}" alt="" loading="lazy"></button>`).join('')}</div></div>` : ''}
        <div class="pd-block" id="bloque-talla"><h3>Talla <a href="#" id="ver-guia">Guía de tallas</a></h3>
          <div class="tallas" id="tallas">${tallas.map((t, i) => `<button class="talla" data-t="${i}" ${t.ok ? '' : 'disabled'} aria-pressed="${talla === t.col}" aria-label="Talla ${esc(t.col)} COL${t.ok ? '' : ', agotada'}"><b>${esc(t.col)}</b><small>${t.eur ? `EU ${esc(t.eur)}` : ''}${t.us ? ` · US ${esc(t.us)}` : ''}</small></button>`).join('')}</div>
          <p class="msg" id="msg" hidden>Elige tu talla para agregarlo a la bolsa.</p></div>
        <div class="pd-actions">
          <button class="btn btn-primary" id="agregar">${ICON.bag} <span>Agregar a la bolsa</span></button>
          <a class="btn btn-wa" id="wa" href="#" target="_blank" rel="noopener" aria-label="Preguntar por WhatsApp">${ICON.wa}</a>
        </div>
        <ul class="pd-notas"><li>${ICON.check}Te confirmamos disponibilidad por WhatsApp.</li><li>${ICON.check}¿Dudas con la talla o la suela? Te asesoramos.</li></ul>
      </div>`;
    waLink();
    const track = $('#track');
    track.addEventListener('scroll', () => { const i = Math.round(track.scrollLeft / track.clientWidth); $$('#thumbs button').forEach((b, k) => b.setAttribute('aria-current', k === i)); }, { passive: true });
    $('#thumbs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) track.scrollTo({ left: [...b.parentNode.children].indexOf(b) * track.clientWidth, behavior: SP.reduce ? 'auto' : 'smooth' }); });
    $('#colores')?.addEventListener('click', e => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      color = P.colores.find(c => c.id === b.dataset.c);
      if (!(color.tallas || []).some(t => t.col === talla && t.ok)) talla = null;
      history.replaceState(null, '', `?id=${encodeURIComponent(P.id)}&c=${encodeURIComponent(color.id)}`);
      pintar();
    });
    $('#tallas').addEventListener('click', e => {
      const b = e.target.closest('[data-t]'); if (!b || b.disabled) return;
      talla = tallas[+b.dataset.t].col;
      $$('#tallas .talla').forEach(x => x.setAttribute('aria-pressed', x === b));
      $('#msg').hidden = true; waLink();
    });
    $('#agregar').addEventListener('click', agregar);
    $('#ver-guia').addEventListener('click', e => { e.preventDefault(); abrirGuia(); });
  }

  function waLink() {
    const t = SP.sitio?.tienda || {};
    const precio = color.precio || P.precio;
    $('#wa').href = SP.wa(t.whatsapp || '573112204194', `Hola ${SP.marca()} 👋, me interesa este modelo:\n\n👟 ${P.marca} ${P.nombre}\nColor: ${color.nombre}\nTalla: ${talla ? talla + ' COL' : 'aún no sé, ¿me ayudan?'}\nPrecio: ${fmt(precio)}\n\n${location.href}`);
  }
  // con el sitio llegan las promociones (precio del día) y el nombre del saludo
  SP.alSitio.push(() => P && pintar());

  function agregar() {
    if (!talla) {
      $('#msg').hidden = false;
      const b = $('#bloque-talla'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      b.scrollIntoView({ block: 'center', behavior: SP.reduce ? 'auto' : 'smooth' });
      navigator.vibrate?.([12, 40, 12]);
      return;
    }
    navigator.vibrate?.(12);
    SP.agregar({ id: P.id, color: color.id, talla, nombre: `${P.marca} ${P.nombre}`, colorNombre: color.nombre, precio: color.precio || P.precio, foto: color.foto || SP.img(color.fotos?.[0], 300), hex: color.hex?.[0] });
    $('#agregar span').textContent = '¡Agregado a tu bolsa!';
    setTimeout(() => { const s = $('#agregar span'); if (s) s.textContent = 'Agregar a la bolsa'; }, 2600);
    SP.toast(`${P.nombre} · Talla ${talla}`);
  }

  function relacionados() {
    const rel = todos.filter(x => x.cat === P.cat && x.id !== P.id).sort((a, b) => (b.marca === P.marca) - (a.marca === P.marca)).slice(0, 4);
    $('#relacionados-sec').hidden = !rel.length;
    $('#relacionados').innerHTML = rel.map(SP.tarjeta).join('');
    $('#rel-link').href = `tienda.html?cat=${encodeURIComponent(P.cat)}`;
    SP.revelar();
  }

  // guía de tallas rápida
  const gt = $('#gt');
  $('#gt-body').innerHTML = SP.TALLAS.map(t => `<tr><td>${t.cm.toFixed(1)}</td><td><b>${t.col}</b></td><td>${t.eur}</td><td>${t.us}</td></tr>`).join('');
  function abrirGuia() { gt.hidden = false; SP.lock(); }
  gt.addEventListener('click', e => { if (e.target.closest('[data-gt]')) { gt.hidden = true; SP.unlock(); } });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !gt.hidden) { gt.hidden = true; SP.unlock(); } });
})();
