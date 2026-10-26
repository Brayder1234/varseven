// Tienda: catálogo con filtros guardados en la URL (al volver de un producto se conserva todo)
'use strict';
(() => {
  const { $, $$, esc } = SP;
  const POR_PAGINA = 24;
  const qs = new URLSearchParams(location.search);
  const st = { cat: qs.get('cat') || 'todos', marca: qs.get('marca') || 'todas', q: qs.get('q') || '', orden: qs.get('orden') || 'nuevo' };
  const claveVista = 'sp:vista:' + location.search;
  let mostrar = +sessionStorage.getItem(claveVista) || POR_PAGINA;
  let P = [], CATS = Object.entries(SP.CATS).map(([id, c]) => ({ id, ...c }));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  $('#q').value = st.q; $('#orden').value = st.orden;
  // pestaña Niños: los modelos con tallas de niño salen de su categoría y van todos aquí
  const NINOS = { id: 'ninos', nombre: 'Niños', code: '' };
  const enPestana = (p, cat) => cat === 'todos' || (cat === 'ninos' ? SP.esNino(p) : p.cat === cat && !SP.esNino(p));

  SP.cargar('sitio', s => {
    if (s?.categorias?.length) CATS = s.categorias.map(c => ({ id: c.id, nombre: c.nombre, code: c.codigo, sup: c.superficie }));
    pintarTabs();
    embajadores(s?.embajadores);
    pintarPromos();
    if (P.length) pintar();
  });
  // promociones (panel → Promociones): martes, jugadores inscritos y MVP de la fecha
  function pintarPromos() {
    const P = SP.promos(), hoy = SP.descuentoHoy(), dia = SP.DIAS[+P.martes.dia] || 'martes';
    const pi = +P.inscritos.porcentaje, pm = +P.mvp.porcentaje;
    const l = [
      P.martes.activo && +P.martes.porcentaje && { on: !!hoy, big: `-${P.martes.porcentaje}%`, t: hoy ? `¡Hoy es ${dia} de descuento!` : `Todos los ${dia}`, s: hoy ? 'El precio con descuento ya aparece en cada guayo.' : `${P.martes.porcentaje}% de descuento en toda la tienda.` },
      P.inscritos.activo && { big: pi ? `${pi}%` : '✓', t: '¿Juegas la Seven Pro League?', s: `${pi ? pi + '% de descuento' : 'Descuento'} cualquier día${P.inscritos.domicilio ? ' + domicilio gratis' : ''}. Márcalo en la bolsa.` },
      P.mvp.activo && { big: 'MVP', t: 'MVP de la fecha', s: 'Descuento personal para el mejor jugador de cada fecha. Recibes un código de un solo uso para la bolsa.' },
    ].filter(Boolean);
    $('#promos').innerHTML = l.map((x, i) => `<div class="promo ${x.on ? 'on' : ''} r" style="--d:${i * .07}s"><b class="display">${esc(x.big)}</b><div><h3>${esc(x.t)}</h3><p>${esc(x.s)}</p></div></div>`).join('');
    $('.promos-sec').hidden = !l.length;
    SP.revelar($('#promos'));
  }
  function embajadores(lista) {
    const l = (lista || []).filter(x => x.visible !== false && x.foto);
    $('#embajadores').hidden = !l.length;
    $('#emb-grid').innerHTML = l.map((x, i) => `<${x.url ? `a href="${esc(x.url)}" target="_blank" rel="noopener"` : 'div'} class="emb r" style="--d:${(i % 4) * .07}s">
      <img src="${esc(x.foto)}" alt="${esc(x.nombre)}" loading="lazy">
      <span class="emb-txt">${x.frase ? `<q>${esc(x.frase)}</q>` : ''}<b>${esc(x.nombre)}</b>${x.rol ? `<small>${esc(x.rol)}</small>` : ''}${x.usuario ? `<em>${SP.ICON.instagram}${esc(x.usuario)}</em>` : ''}</span>
    </${x.url ? 'a' : 'div'}>`).join('');
    SP.revelar($('#embajadores'));
  }
  SP.cargar('productos', ps => {
    if (!ps) { $('#grid').innerHTML = '<p class="empty">No pudimos cargar los productos. Revisa tu conexión.</p>'; return; }
    P = ps; pintarTabs(); pintar(true);
  });
  if (!P.length) $('#grid').innerHTML = Array.from({ length: 8 }, () => '<div class="sk" style="aspect-ratio:1/1.25"></div>').join('');

  function pintarTabs() {
    const n = c => P.filter(p => enPestana(p, c)).length;
    // una categoría sin productos todavía no se muestra
    const visibles = (P.length ? [...CATS, NINOS].filter(c => n(c.id) || st.cat === c.id) : CATS);
    $('#tabs').innerHTML = '<span class="tabs-pill"></span>' + [{ id: 'todos', nombre: 'Todos' }, ...visibles]
      .map(c => `<button role="tab" data-cat="${esc(c.id)}" aria-selected="${st.cat === c.id}">${esc(c.nombre)}${P.length ? `<sup>${n(c.id)}</sup>` : ''}</button>`).join('');
    $('#hero-cats').innerHTML = visibles.map(c => `<a href="?cat=${esc(c.id)}">${esc(c.nombre)}${c.code ? ` <b>${esc(c.code)}</b>` : ''}</a>`).join('');
    requestAnimationFrame(() => SP.pildora($('#tabs')));
  }

  function filtrados() {
    const q = norm(st.q).split(/\s+/).filter(Boolean);
    let l = P.filter(p => enPestana(p, st.cat) && (st.marca === 'todas' || p.marca === st.marca)
      && q.every(w => norm(`${p.marca} ${p.nombre} ${SP.CATS[p.cat]?.nombre} ${(p.colores || []).map(c => c.nombre).join(' ')}`).includes(w)));
    if (st.orden === 'asc') l = [...l].sort((a, b) => a.precio - b.precio);
    else if (st.orden === 'desc') l = [...l].sort((a, b) => b.precio - a.precio);
    else if (st.orden === 'az') l = [...l].sort((a, b) => `${a.marca} ${a.nombre}`.localeCompare(`${b.marca} ${b.nombre}`));
    return l;
  }

  function pintar(inicial = false) {
    // marcas disponibles en la categoría actual
    const base = P.filter(p => enPestana(p, st.cat));
    const marcas = [...new Set(base.map(p => p.marca))].sort((a, b) => base.filter(p => p.marca === b).length - base.filter(p => p.marca === a).length);
    if (st.marca !== 'todas' && !marcas.includes(st.marca)) st.marca = 'todas';
    $('#marcas').innerHTML = [['todas', 'Todas las marcas'], ...marcas.map(m => [m, m])].map(([k, t]) => `<button class="chip" data-marca="${esc(k)}" aria-pressed="${st.marca === k}">${esc(t)}</button>`).join('');
    $$('#tabs [data-cat]').forEach(b => b.setAttribute('aria-selected', b.dataset.cat === st.cat));
    SP.pildora($('#tabs'));

    const l = filtrados();
    $('#count').innerHTML = `<b>${l.length}</b> ${l.length === 1 ? 'modelo' : 'modelos'}${st.q ? ` para “${esc(st.q)}”` : ''}`;
    $('#grid').innerHTML = l.length ? l.slice(0, mostrar).map(SP.tarjeta).join('')
      : `<div class="empty" style="grid-column:1/-1">No encontramos modelos con esos filtros.<br><br><button class="btn btn-ghost btn-sm" id="limpiar">Quitar filtros</button></div>`;
    $('#ver-mas').innerHTML = l.length > mostrar ? `<span>Viendo ${Math.min(mostrar, l.length)} de ${l.length}</span><button class="btn btn-blue" id="mas">Ver más modelos</button>` : '';
    SP.revelar($('#grid'));
    if (inicial) {
      // al volver de un producto: restaurar la posición
      const y = +sessionStorage.getItem(claveVista + ':y');
      if (y) requestAnimationFrame(() => scrollTo({ top: y, behavior: 'instant' }));
    }
  }

  function aplicar(patch, irArriba = true) {
    Object.assign(st, patch);
    mostrar = POR_PAGINA;
    const u = new URLSearchParams();
    if (st.cat !== 'todos') u.set('cat', st.cat);
    if (st.marca !== 'todas') u.set('marca', st.marca);
    if (st.q) u.set('q', st.q);
    if (st.orden !== 'nuevo') u.set('orden', st.orden);
    history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
    pintar();
    if (irArriba) { const t = $('#catalogo').getBoundingClientRect().top + scrollY - 60; if (scrollY > t) scrollTo({ top: t, behavior: 'smooth' }); }
  }

  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) aplicar({ cat: b.dataset.cat }); });
  $('#marcas').addEventListener('click', e => { const b = e.target.closest('[data-marca]'); if (b) aplicar({ marca: b.dataset.marca }, false); });
  $('#orden').addEventListener('change', e => aplicar({ orden: e.target.value }, false));
  let tq; $('#q').addEventListener('input', e => { clearTimeout(tq); tq = setTimeout(() => aplicar({ q: e.target.value.trim() }, false), 220); });
  document.addEventListener('click', e => {
    if (e.target.closest('#mas')) { mostrar += POR_PAGINA; pintar(); }
    if (e.target.closest('#limpiar')) { $('#q').value = ''; aplicar({ cat: 'todos', marca: 'todas', q: '' }); }
    if (e.target.closest('.pcard-hit')) { sessionStorage.setItem('sp:vista:' + location.search, mostrar); sessionStorage.setItem('sp:vista:' + location.search + ':y', scrollY); }
  });

  // barra de filtros con fondo cuando queda fija
  const tb = $('#toolbar');
  addEventListener('scroll', () => tb.classList.toggle('stuck', tb.getBoundingClientRect().top <= ($('#nav').getBoundingClientRect().bottom + 2)), { passive: true });
})();
