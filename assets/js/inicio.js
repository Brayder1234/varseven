// Inicio: portada Torneo | Tienda, resumen del torneo, inscripción, canchas, secciones editables y aliados
'use strict';
(() => {
  const { $, $$, esc, fmt, ICON } = SP;
  let sitio = null, productos = null;

  // ───────── torneo ─────────
  SP.cargar('torneo', t => {
    if (!t) return;
    const E = SP.equipoPorId(t), tabla = SP.tabla(t), gol = SP.goleadores(t)[0];
    const prox = SP.proximaFecha(t), partidos = (t.partidos || []).filter(p => p.fecha === prox).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
    $('#res-temporada').textContent = `${t.nombre} · ${t.temporada}`;
    const meta = [];
    if (prox) meta.push(`<span>Fecha ${prox} · ${esc(SP.fecha(partidos[0]?.dia))}</span>`);
    if (tabla[0]?.pj) meta.push(`<span><img src="${esc(tabla[0].eq.escudo)}" alt="">Líder: ${esc(tabla[0].eq.nombre)}</span>`);
    if (gol) meta.push(`<span>⚽ ${esc(gol.jugador.nombre)} · ${gol.goles}</span>`);
    $('#door-torneo-meta').innerHTML = meta.join('');

    const crest = (id, cls = '') => `<img class="crest ${cls}" src="${esc(E[id]?.escudo)}" alt="" loading="lazy">`;
    $('#res-proxima').innerHTML = prox ? `
      <div class="card-h"><h3 class="display">Fecha ${prox}</h3><small>${esc(SP.fecha(partidos[0]?.dia, { weekday: 'long', day: 'numeric', month: 'long' }))}</small></div>
      <div class="vs-list">${partidos.map(p => `<a class="vs" href="torneo.html#partidos">
        <span class="t">${crest(p.local, 'crest-sm')}<span>${esc(E[p.local]?.nombre)}</span></span>
        <span class="mid">${p.estado === 'finalizado' ? `<b>${p.gl} - ${p.gv}</b>` : esc(SP.hora(p.hora) || 'vs')}</span>
        <span class="t v">${crest(p.visita, 'crest-sm')}<span>${esc(E[p.visita]?.nombre)}</span></span></a>`).join('')}</div>
      ${SP.descansa(t, prox).length ? `<p class="descansa">Descansa: ${SP.descansa(t, prox).map(e => esc(e.nombre)).join(', ')}</p>` : ''}`
      : `<div class="card-h"><h3 class="display">Fase terminada</h3></div><p class="muted">Pronto anunciamos la siguiente etapa.</p>`;

    $('#res-tabla').innerHTML = `
      <div class="card-h"><h3 class="display">Posiciones</h3><small>Top 5</small></div>
      <table class="mini-tabla"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>DIF</th><th>PTS</th></tr></thead><tbody>
      ${tabla.slice(0, 5).map((x, i) => `<tr><td class="pos">${i + 1}</td><td class="eq"><div>${crest(x.eq.id, 'crest-sm')}${esc(x.eq.nombre)}</div></td><td>${x.pj}</td><td>${x.dif > 0 ? '+' : ''}${x.dif}</td><td class="pts">${x.pts}</td></tr>`).join('')}
      </tbody></table>
      ${gol ? `<div class="lider"><span class="n display">${gol.goles}</span><div><small>Goleador del torneo</small><b>${esc(gol.jugador.nombre)}</b><small>${esc(gol.equipo?.nombre || '')}</small></div>${gol.equipo ? crest(gol.equipo.id, 'crest-lg') : ''}</div>` : ''}`;

    const ins = t.inscripcion;
    const sec = $('#inscripcion');
    sec.hidden = !ins?.activa;
    if (ins?.activa) {
      $('#insc-titulo').innerHTML = esc(ins.titulo).replace(/(\d{4})$/, '<span class="grad">$1</span>');
      $('#insc-premios').textContent = [ins.fechas, ins.premios].filter(Boolean).join(' · ');
      $('#insc-datos').innerHTML = [['Cupos', ins.cupos], ['Lugar', ins.lugar], ['Horarios', (ins.horarios || []).join(' · '), 'ancho']]
        .filter(x => x[1]).map(([k, v, c]) => `<div class="${c || ''}"><small>${k}</small><b>${esc(v)}</b></div>`).join('');
      $('#insc-btn').href = SP.wa(ins.whatsapp, ins.mensaje);
      $('#insc-img').src = ins.flyer;
      SP.cuenta($('#insc-cuenta'), ins.inicio);
      $('#insc-cuenta-tit').hidden = $('#insc-cuenta').hidden;
    }
    SP.revelar();
  });

  // ───────── sitio: canchas, secciones, aliados, redes ─────────
  SP.cargar('sitio', s => {
    if (!s) return;
    sitio = s;
    $('#canchas-grid').innerHTML = (s.categorias || []).map((c, i) => `
      <a class="cancha r" href="tienda.html?cat=${esc(c.id)}" style="--g:${esc(c.color)};--d:${i * .08}s">
        <span class="cancha-top"><span>0${i + 1}</span><b>${esc(c.codigo)}</b></span>
        <span class="cancha-vis"><img class="suela" src="${esc(c.suela)}" alt="" loading="lazy"><img class="lado" src="${esc(c.foto)}" alt="" loading="lazy"></span>
        <small>${esc(c.superficie)}</small><h3 class="display">${esc(c.nombre)}</h3><p>${esc(c.desc)}</p>
        <span class="cancha-foot"><span data-cuenta="${esc(c.id)}">Ver modelos</span><span class="go">${ICON.arrow}</span></span>
      </a>`).join('');
    $('#sponsors').innerHTML = SP.patrocinadoresHTML(s.patrocinadores);
    $('#socials').innerHTML = SP.redesHTML(s.redes);
    secciones();
    SP.revelar();
  });

  function secciones() {
    if (!sitio) return;
    const html = (sitio.secciones || []).filter(x => x.visible !== false).map(x => {
      const eyebrow = x.eyebrow ? `<p class="eyebrow r">${esc(x.eyebrow)}</p>` : '';
      const boton = x.boton?.url ? `<a class="btn btn-primary" href="${esc(x.boton.url)}">${esc(x.boton.texto || 'Ver más')} ${ICON.arrow}</a>` : '';
      if (x.tipo === 'beneficios') return `<section class="sec"><div class="wrap benef">
          <div>${eyebrow}<h2 class="display h2 r">${esc(x.titulo)}</h2>${x.texto ? `<p class="lead r" style="margin-top:16px">${esc(x.texto)}</p>` : ''}</div>
          <div class="benef-grid">${(x.items || []).map((it, i) => `<div class="benef-item r" style="--d:${i * .07}s"><span class="num display">0${i + 1}</span><div><h3>${esc(it.titulo)}</h3><p>${esc(it.texto)}</p></div></div>`).join('')}</div>
        </div></section>`;
      if (x.tipo === 'banner') return `<section class="sec" style="padding-top:0"><div class="wrap"><div class="banner r">
          <div>${x.eyebrow ? `<p class="eyebrow" style="color:var(--cyan-2)">${esc(x.eyebrow)}</p>` : ''}<h2 class="display h2" style="margin-top:12px">${esc(x.titulo)}</h2>${x.texto ? `<p>${esc(x.texto)}</p>` : ''}${boton}</div>
          ${x.imagen ? `<img src="${esc(x.imagen)}" alt="" loading="lazy">` : ''}</div></div></section>`;
      if (x.tipo === 'productos') {
        const lista = elegirProductos(x);
        if (productos && !lista.length) return '';
        return `<section class="sec"><div class="wrap">
          <div class="head"><div>${eyebrow}<h2 class="display h2 r">${esc(x.titulo)}</h2></div>${x.boton?.url ? `<a class="link r" href="${esc(x.boton.url)}">${esc(x.boton.texto || 'Ver más')} ${ICON.arrow}</a>` : ''}</div>
          <div class="pgrid">${productos ? lista.map(SP.tarjeta).join('') : Array.from({ length: 4 }, () => '<div class="sk" style="aspect-ratio:1/1.25"></div>').join('')}</div>
        </div></section>`;
      }
      if (x.tipo === 'texto') return `<section class="sec"><div class="wrap" style="max-width:860px">${eyebrow}<h2 class="display h2 r">${esc(x.titulo)}</h2><p class="lead r" style="margin-top:16px;max-width:none">${esc(x.texto)}</p>${boton ? `<div class="r" style="margin-top:22px">${boton}</div>` : ''}</div></section>`;
      return '';
    }).join('');
    $('#secciones').innerHTML = html;
    SP.revelar($('#secciones'));
  }
  function elegirProductos(x) {
    if (!productos) return [];
    let l = productos;
    if (x.filtro === 'destacados') l = l.filter(p => p.destacado);
    else if (x.filtro === 'nuevos') l = l.filter(p => p.nuevo);
    else if (x.filtro === 'ofertas') l = l.filter(p => SP.rebaja(p.precio, p.antes));
    else if (SP.CATS[x.filtro]) l = l.filter(p => p.cat === x.filtro);
    else if (x.filtro === 'ids') l = (x.ids || []).map(id => productos.find(p => p.id === id)).filter(Boolean);
    return l.slice(0, +x.cantidad || 8);
  }

  // ───────── productos: guayos que rotan en la puerta de la tienda ─────────
  let timer;
  SP.cargar('productos', ps => {
    if (!ps) return;
    productos = ps;
    secciones();
    const cuenta = {}; ps.forEach(p => { cuenta[p.cat] = (cuenta[p.cat] || 0) + 1; });
    $$('[data-cuenta]').forEach(el => { const n = cuenta[el.dataset.cuenta] || 0; el.textContent = `${n} ${n === 1 ? 'modelo' : 'modelos'}`; el.closest('.cancha').hidden = !n; });
    // un modelo por cancha (primero los destacados) y uno más
    const orden = [...ps.filter(p => p.destacado), ...ps.filter(p => !p.destacado)].filter(p => p.colores?.[0]?.foto);
    const vitrina = [];
    for (const cat of ['guayos', 'torretin', 'futsal', 'guayos']) { const p = orden.find(x => x.cat === cat && !vitrina.includes(x)); if (p) vitrina.push(p); }
    const box = $('#door-shoes');
    box.innerHTML = vitrina.map(p => `<img src="${esc(p.colores[0].foto)}" alt="" data-g="${esc(p.colores[0].hex?.[0] || '#3FE0F0')}">`).join('');
    const imgs = $$('img', box), door = $('#door-tienda');
    let i = 0;
    const mostrar = () => {
      imgs.forEach((im, k) => { im.classList.toggle('on', k === i); im.classList.toggle('out', k === (i + imgs.length - 1) % imgs.length && imgs.length > 1); });
      door.style.setProperty('--g', imgs[i]?.dataset.g || '#3FE0F0');
    };
    if (imgs.length) { mostrar(); clearInterval(timer); if (!SP.reduce && imgs.length > 1) timer = setInterval(() => { if (!document.hidden) { i = (i + 1) % imgs.length; mostrar(); } }, 4200); }
  });

  SP.pausarFuera($('#split'));
  SP.pausarFuera($('.ribbon'));

  // ───────── oferta de lanzamiento: banner grande + ventana al entrar + cuenta regresiva ─────────
  let reloj = null;
  SP.cargar('sitio', st => {
    if (!st) return;
    const lz = SP.lanzamiento(), sec = $('#oferta');
    if (!lz) { sec.hidden = true; return; }
    const pronto = lz.fase === 'pronto';
    const objetivo = pronto ? lz.ini : lz.fin;
    const cuenta = () => {
      let ms = Math.max(0, (objetivo ? objetivo - Date.now() : 0)), z = n => String(n).padStart(2, '0');
      const d = Math.floor(ms / 864e5); ms %= 864e5;
      return [[d, 'días'], [z(Math.floor(ms / 36e5)), 'horas'], [z(Math.floor(ms % 36e5 / 6e4)), 'min'], [z(Math.floor(ms % 6e4 / 1e3)), 'seg']].map(([n, t]) => `<div><b class="display">${n}</b><small>${t}</small></div>`).join('');
    };
    const titulo = pronto ? `Desde el ${esc(lz.desde)}` : '¡Ya empezó!';
    const fechas = `Del ${esc(lz.desde)} al ${esc(lz.hasta)}`;
    sec.hidden = false;
    sec.innerHTML = `<div class="wrap of-in">
      <div class="of-big display" aria-hidden="true"><span>−${lz.pct}%</span></div>
      <div class="of-txt">
        <p class="eyebrow">${esc(lz.l.texto || 'Oferta de lanzamiento')} · ${titulo}</p>
        <h2 class="display">${lz.pct}% de descuento en <span class="grad">toda la tienda</span></h2>
        <p class="lead">${fechas}. Celebramos el lanzamiento de la página con guayos, torretín y futsal a precio especial.</p>
        <p class="of-cuenta-t">${pronto ? 'Empieza en' : 'Termina en'}</p>
        <div class="of-cuenta" id="of-cuenta">${cuenta()}</div>
        <a class="btn btn-primary of-btn" href="tienda.html">Ver la tienda <svg class="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      </div></div>`;
    clearInterval(reloj);
    reloj = setInterval(() => { const c = $('#of-cuenta'); if (c) c.innerHTML = cuenta(); }, 1000);

    // ventana al entrar: una vez por visita
    if (SP.store.get('sp:of-pop-' + (lz.l.desde || ''), false) && !location.hash.includes('oferta')) return;
    try { if (sessionStorage.getItem('sp:of-pop')) return; sessionStorage.setItem('sp:of-pop', '1'); } catch { /* sin almacenamiento: se muestra */ }
    const pop = document.createElement('div');
    pop.className = 'of-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true'); pop.setAttribute('aria-label', 'Oferta de lanzamiento');
    pop.innerHTML = `<div class="of-pop-scrim" data-x></div><div class="of-pop-card">
      <button class="of-pop-x" data-x aria-label="Cerrar"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <p class="eyebrow">🔥 ${pronto ? 'Muy pronto' : (lz.finDia ? 'Solo hasta el ' + esc(lz.finDia) : 'Por tiempo limitado')}</p>
      <div class="of-pop-pct display">−${lz.pct}%</div>
      <h3 class="display">En toda la tienda</h3>
      <p>${fechas}.<br>Lanzamiento de la página de <b>Seven Pro Shop × VAR</b>.</p>
      <a class="btn btn-primary" href="tienda.html">Quiero mi descuento <svg class="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      <button class="of-pop-no" data-x>Ahora no</button></div>`;
    const cerrar = () => { pop.classList.remove('on'); setTimeout(() => pop.remove(), 400); document.removeEventListener('keydown', tecla); };
    const tecla = e => { if (e.key === 'Escape') cerrar(); };
    pop.addEventListener('click', e => { if (e.target.closest('[data-x]')) cerrar(); });
    document.addEventListener('keydown', tecla);
    const mostrar = () => { document.body.appendChild(pop); setTimeout(() => pop.classList.add('on'), 700); };
    // si está la apertura del estadio, la ventana espera a que termine
    if (document.documentElement.classList.contains('intro-on')) document.addEventListener('sp:intro-fin', mostrar, { once: true }); else mostrar();
  });
})();
