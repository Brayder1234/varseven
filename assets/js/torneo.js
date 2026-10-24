// Torneo: todo se calcula a partir de los partidos guardados en el panel
'use strict';
(() => {
  const { $, $$, esc, ICON } = SP;
  let T = null, E = {}, J = {}, fechaSel = null, fotos = [], lbI = 0, golTodos = false;
  const crest = (id, cls = '') => `<img class="crest ${cls}" src="${esc(E[id]?.escudo || 'assets/img/logos/seven-pro-league.png')}" alt="" loading="lazy">`;
  const nombre = id => esc(E[id]?.nombre || 'Por definir');

  SP.cargar('torneo', t => {
    if (!t) { $('#ins').innerHTML = '<p class="empty">No pudimos cargar el torneo. Intenta de nuevo en un momento.</p>'; return; }
    T = t; E = SP.equipoPorId(t); J = SP.jugadorPorId(t);
    hero(); inscripcion(); posiciones(); proximos(); resultados(); goleadores(); sanciones(); galeria();
    SP.revelar();
  });
  SP.cargar('sitio', s => {
    if (!s) return;
    $('#socials').innerHTML = SP.redesHTML(s.redes);
    $('#sponsors').innerHTML = SP.patrocinadoresHTML(s.patrocinadores);
    SP.revelar();
  });

  function hero() {
    const jug = SP.jugados(T), goles = jug.reduce((s, p) => s + (+p.gl) + (+p.gv), 0);
    $('#t-nombre').innerHTML = esc(T.nombre).replace(/(League.*)$/i, '<span class="accent">$1</span>');
    $('#t-temporada').textContent = [T.temporada, T.lema].filter(Boolean).join(' · ');
    $('#t-stats').innerHTML = [[T.equipos.length, 'Equipos'], [jug.length, 'Partidos jugados'], [goles, 'Goles'], [jug.length ? (goles / jug.length).toFixed(1) : '0', 'Goles por partido']]
      .map(([b, s]) => `<div><b>${b}</b><small>${s}</small></div>`).join('');
  }

  function inscripcion() {
    const i = T.inscripcion;
    if (!i?.activa) { $('#ins').innerHTML = `<div class="ins-cerrada"><h3 class="display h3">Inscripciones cerradas</h3><p>Muy pronto abrimos cupos para el próximo torneo.</p></div>`; return; }
    $('#ins').innerHTML = `<div class="ins-box r">
      <a class="ins-flyer" href="${esc(i.flyer)}" target="_blank" rel="noopener"><img src="${esc(i.flyer)}" alt="${esc(i.titulo)}"></a>
      <div class="ins-info">
        <p class="eyebrow">Inscripciones abiertas</p>
        <h2 class="display h2" style="margin-top:12px">${esc(i.titulo)}</h2>
        ${i.premios ? `<p class="lead">${esc(i.premios)}</p>` : ''}
        <ul class="ins-list">${[['Fechas', i.fechas], ['Cupos', i.cupos], ['Lugar', i.lugar], ['Horarios', (i.horarios || []).join(' · ')]]
          .filter(x => x[1]).map(([k, v]) => `<li><small>${k}</small><b>${esc(v)}</b></li>`).join('')}</ul>
        <a class="btn btn-wa" href="${esc(SP.wa(i.whatsapp, i.mensaje))}" target="_blank" rel="noopener">${ICON.wa.replace('<svg', '<svg width="20" height="20" fill="currentColor"')} Inscribir mi equipo</a>
      </div></div>`;
  }

  function posiciones() {
    const R = T.reglas || {}, tabla = SP.tabla(T), cl = +R.clasifican || tabla.length;
    const ult = SP.jugados(T).reduce((m, p) => Math.max(m, p.fecha), 0);
    $('#pos-fase').textContent = `${T.fase || 'Fase de grupos'}${ult ? ` · después de la fecha ${ult}` : ''}`;
    $('#tabla tbody').innerHTML = tabla.map((x, i) => `<tr class="${i >= cl ? 'fuera' : ''}">
      <td class="pos">${i + 1}</td><td class="eq"><div>${crest(x.eq.id, 'crest-sm')}${esc(x.eq.nombre)}</div></td>
      <td class="pts">${x.pts}</td><td>${x.pj}</td><td class="ocultar">${x.pg}</td><td class="ocultar">${x.pe}</td><td class="ocultar">${x.pp}</td>
      <td>${x.gf}</td><td>${x.gc}</td><td>${x.dif > 0 ? '+' : ''}${x.dif}</td>
      <td class="ocultar"><span class="forma">${x.forma.map(f => `<i class="${f}">${f}</i>`).join('')}</span></td></tr>`).join('');
    $('#leyenda').innerHTML = cl < tabla.length ? `<span>${esc(R.textoClasifica || 'Clasifica')}</span><span class="fuera">${esc(R.textoEliminado || 'Eliminado')}</span>` : '';
  }

  function tarjeta(p, abrir = true) {
    const fin = p.estado === 'finalizado';
    const w = fin ? (+p.gl > +p.gv ? 'l' : +p.gl < +p.gv ? 'v' : '') : '';
    const tag = abrir && fin ? 'button' : 'div';
    return `<${tag} class="partido r" ${tag === 'button' ? `data-id="${esc(p.id)}" aria-label="Ver detalle: ${nombre(p.local)} ${p.gl} - ${p.gv} ${nombre(p.visita)}"` : ''}>
      <span class="eq ${w === 'l' ? 'win' : ''}">${crest(p.local)}<span>${nombre(p.local)}</span></span>
      <span class="marcador">
        <span class="estado ${fin ? 'fin' : ''}">${fin ? 'FINAL' : p.estado === 'aplazado' ? 'APLAZADO' : 'PROGRAMADO'}</span>
        ${fin ? `<span class="goles">${p.gl} : ${p.gv}</span>` : `<span class="hora">${esc(SP.hora(p.hora) || 'vs')}</span>`}
        <span class="cuando">${esc(SP.fecha(p.dia))}${fin && p.hora ? ' · ' + esc(SP.hora(p.hora)) : ''}${p.cancha ? ' · ' + esc(p.cancha) : ''}</span>
      </span>
      <span class="eq ${w === 'v' ? 'win' : ''}">${crest(p.visita)}<span>${nombre(p.visita)}</span></span>
      ${tag === 'button' ? `<span class="ver">${p.fotos ? 'Goles y fotos' : 'Ver goles'}</span>` : ''}
    </${tag}>`;
  }
  const centrar = (barra, el, suave) => {
    if (!barra || !el) return;
    const x = el.offsetLeft - (barra.clientWidth - el.offsetWidth) / 2;
    barra.scrollTo({ left: Math.max(0, x), behavior: suave && !SP.reduce ? 'smooth' : 'instant' });
  };
  const ordenHora = (a, b) => (a.dia || '').localeCompare(b.dia || '') || (a.hora || '').localeCompare(b.hora || '');

  function proximos() {
    const f = SP.proximaFecha(T);
    if (!f) { $('#proximos').innerHTML = '<p class="empty">No hay partidos programados por ahora.</p>'; $('#prox-sub').textContent = 'Calendario'; return; }
    const ps = T.partidos.filter(p => p.fecha === f && p.estado !== 'finalizado').sort(ordenHora);
    const d = SP.descansa(T, f);
    $('#prox-sub').textContent = `Fecha ${f} · ${SP.fecha(ps[0]?.dia, { weekday: 'long', day: 'numeric', month: 'long' })}`;
    $('#proximos').innerHTML = `<div class="partidos">${ps.map(p => tarjeta(p, false)).join('')}</div>
      ${d.length ? `<p class="descanso">Descansa: <b>${d.map(e => esc(e.nombre)).join(', ')}</b></p>` : ''}`;
  }

  function resultados() {
    const fechas = SP.fechas(T);
    const jugadas = new Set(SP.jugados(T).map(p => p.fecha));
    if (fechaSel === null || !fechas.includes(fechaSel)) fechaSel = Math.max(...[...jugadas], fechas[0] || 1);
    $('#fecha-chips').innerHTML = fechas.map(f => `<button aria-pressed="${f === fechaSel}" class="${jugadas.has(f) ? '' : 'pend'}" data-f="${f}">Fecha ${f}</button>`).join('');
    const ps = T.partidos.filter(p => p.fecha === fechaSel).sort(ordenHora);
    const fin = ps.filter(p => p.estado === 'finalizado'), goles = fin.reduce((s, p) => s + (+p.gl) + (+p.gv), 0);
    $('#fecha-stats').innerHTML = [[fin.length, 'Juegos'], [fin.filter(p => +p.gl === +p.gv).length, 'Empates'], [goles, 'Goles'], [fin.length ? (goles / fin.length).toFixed(1) : '0', 'Promedio']]
      .map(([b, s]) => `<div><b>${b}</b><small>${s}</small></div>`).join('');
    $('#fecha-partidos').innerHTML = ps.map(p => tarjeta(p)).join('');
    const d = SP.descansa(T, fechaSel);
    $('#fecha-descansa').innerHTML = d.length ? `Descansa: <b>${d.map(e => esc(e.nombre)).join(', ')}</b>` : '';
    SP.revelar($('#resultados'));
    centrar($('#fecha-chips'), $('#fecha-chips [aria-pressed="true"]'), false);
  }
  $('#fecha-chips').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { fechaSel = +b.dataset.f; resultados(); } });

  // detalle de partido: goles por equipo
  const md = $('#md');
  document.addEventListener('click', e => {
    const b = e.target.closest('button.partido[data-id]');
    if (b) abrirPartido(b.dataset.id);
    if (e.target.closest('#md [data-close]')) cerrarPartido();
  });
  function abrirPartido(id) {
    const p = T.partidos.find(x => x.id === id);
    if (!p) return;
    const lista = eq => {
      const c = {};
      (p.goles || []).filter(g => g.equipo === eq).forEach(g => { const k = (g.tipo === 'autogol' ? 'ag:' : '') + (g.jugador || ''); c[k] = (c[k] || 0) + 1; });
      return Object.entries(c).map(([k, n]) => {
        const ag = k.startsWith('ag:'), jid = k.replace('ag:', '');
        return `<li>⚽ ${esc(J[jid]?.nombre || 'Gol')}${ag ? ' (autogol)' : ''}${n > 1 ? ` <b>×${n}</b>` : ''}</li>`;
      }).join('') || '<li style="color:var(--dim)">—</li>';
    };
    const reg = (p.goles || []).length, total = (+p.gl) + (+p.gv);
    $('#md-panel').innerHTML = `<button class="icon-btn md-close" data-close aria-label="Cerrar">${ICON.close}</button>
      <div class="md-head">
        <div class="eq">${crest(p.local, 'crest-lg')}<span>${nombre(p.local)}</span></div>
        <div><div class="res">${p.gl} : ${p.gv}</div><small>Fecha ${p.fecha} · ${esc(SP.fecha(p.dia))}${p.hora ? ' · ' + esc(SP.hora(p.hora)) : ''}</small></div>
        <div class="eq">${crest(p.visita, 'crest-lg')}<span>${nombre(p.visita)}</span></div>
      </div>
      <div class="md-body">
        <h4>Goles</h4>
        <div class="md-goles"><ul>${lista(p.local)}</ul><ul class="v">${lista(p.visita)}</ul></div>
        ${reg < total ? `<p class="md-nota">${total - reg} ${total - reg === 1 ? 'gol sin autor registrado' : 'goles sin autor registrado'}.</p>` : ''}
        ${p.mvp ? `<p class="md-mvp">⭐ Jugador del partido: ${esc(J[p.mvp]?.nombre || p.mvp)}</p>` : ''}
        ${p.fotos ? `<a class="btn btn-light md-fotos" href="${esc(p.fotos)}" target="_blank" rel="noopener">📸 Fotos del partido ${ICON.ext}</a>` : ''}
      </div>`;
    md.hidden = false; SP.lock();
    history.pushState({ partido: id }, '', location.pathname + '#resultados');
  }
  const ocultarPartido = () => { if (md.hidden) return; md.hidden = true; SP.unlock(); };
  const cerrarPartido = () => (history.state?.partido ? history.back() : ocultarPartido());
  addEventListener('popstate', () => { if (!history.state?.partido) ocultarPartido(); if (!history.state?.foto) ocultarFoto(); });

  function goleadores() {
    const g = SP.goleadores(T);
    if (!g.length) { $('#podio').innerHTML = '<p class="empty">Aún no hay goles registrados.</p>'; return; }
    const top = g.slice(0, 3), orden = [top[1], top[0], top[2]].filter(Boolean);
    $('#podio').innerHTML = orden.map(x => {
      const pos = g.indexOf(x) + 1;
      return `<div class="podio-item p${pos} r"><span class="lugar">${pos}</span>${x.equipo ? crest(x.equipo.id, pos === 1 ? 'crest-lg' : '') : ''}<span class="n display">${x.goles}</span><b>${esc(x.jugador.nombre)}</b><small>${esc(x.equipo?.nombre || '')}</small></div>`;
    }).join('');
    const resto = g.slice(3), visibles = golTodos ? resto : resto.slice(0, 12);
    $('#gol-lista').innerHTML = visibles.map((x, i) => `<div class="gol-row"><span class="pos">${i + 4}</span>${x.equipo ? crest(x.equipo.id, 'crest-sm') : '<span></span>'}<b>${esc(x.jugador.nombre)}<small>${esc(x.equipo?.nombre || '')}</small></b><span class="g">${x.goles}</span></div>`).join('');
    $('#gol-mas').innerHTML = resto.length > 12 ? `<button class="btn btn-blue btn-sm" id="gol-btn">${golTodos ? 'Ver menos' : `Ver los ${g.length} goleadores`}</button>` : '';
    $('#gol-btn')?.addEventListener('click', () => { golTodos = !golTodos; goleadores(); });
  }

  function sanciones() {
    const s = T.sanciones || {};
    const lista = (s.lista || []).filter(x => x.jugador || x.equipo);
    $('#sanc').innerHTML = `<div class="sanc r">
      <div><span class="sanc-cards"><i></i><i></i></span><p class="eyebrow" style="color:#FF8A9A">Disciplina</p><h2 class="display h2" style="margin-top:12px">Sanciones</h2>
        <p class="lead" style="margin-top:12px">${esc(s.texto || 'Reporte de tarjetas y suspensiones del torneo.')}</p>
        ${s.url ? `<a class="btn btn-light" style="margin-top:22px" href="${esc(s.url)}" target="_blank" rel="noopener">Ver sanciones ${ICON.ext}</a>` : '<p class="md-nota" style="margin-top:18px">Pronto publicamos el reporte de esta fecha.</p>'}
      </div>
      <div>${lista.length ? `<table class="sanc-lista"><thead><tr><th>Jugador</th><th>Equipo</th><th>Sanción</th></tr></thead><tbody>${lista.map(x => `<tr><td>${esc(x.jugador)}</td><td>${esc(E[x.equipo]?.nombre || x.equipo || '')}</td><td>${esc(x.motivo || '')}${x.fechas ? ` · ${x.fechas} ${+x.fechas === 1 ? 'fecha' : 'fechas'}` : ''}</td></tr>`).join('')}</tbody></table>`
        : '<p class="muted" style="color:var(--muted)">No hay jugadores suspendidos en este momento.</p>'}</div>
    </div>`;
  }

  // galería con visor
  // jugadores del partido de la última fecha (las fotos completas de cada partido van por enlace de Drive)
  function galeria() {
    fotos = (T.fotos || []).filter(f => f.url);
    const f = T.fotosFecha || SP.jugados(T).reduce((m, p) => Math.max(m, p.fecha), 0);
    $('#jug-fecha').textContent = f ? `Fecha ${f}` : 'Última fecha';
    $('#fotos').hidden = !fotos.length;
    $('#galeria').innerHTML = fotos.map((f, i) => `<button data-foto="${i}" class="r" style="--d:${(i % 4) * .05}s"><img src="${esc(f.url)}" alt="${esc(f.titulo || '')}" loading="lazy"><span>${esc(f.titulo || '')}</span></button>`).join('');
  }
  const lb = $('#lb');
  const verFoto = i => { lbI = (i + fotos.length) % fotos.length; $('#lb-img').src = fotos[lbI].url; $('#lb-cap').textContent = fotos[lbI].titulo || ''; };
  const ocultarFoto = () => { if (lb.hidden) return; lb.hidden = true; SP.unlock(); };
  $('#galeria').addEventListener('click', e => { const b = e.target.closest('[data-foto]'); if (!b) return; verFoto(+b.dataset.foto); lb.hidden = false; SP.lock(); history.pushState({ foto: 1 }, '', location.pathname + '#fotos'); });
  lb.addEventListener('click', e => {
    const b = e.target.closest('[data-lb]');
    if (b?.dataset.lb === 'cerrar' || e.target === lb || e.target.classList.contains('lb-img')) history.state?.foto ? history.back() : ocultarFoto();
    else if (b) verFoto(lbI + +b.dataset.lb);
  });
  let tx = 0;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) verFoto(lbI + (d < 0 ? 1 : -1)); });
  addEventListener('keydown', e => {
    if (!lb.hidden) { if (e.key === 'ArrowRight') verFoto(lbI + 1); if (e.key === 'ArrowLeft') verFoto(lbI - 1); if (e.key === 'Escape') history.state?.foto ? history.back() : ocultarFoto(); }
    else if (!md.hidden && e.key === 'Escape') cerrarPartido();
  });

  // sub-navegación: resalta la sección visible
  const links = $$('#subnav a');
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    centrar($('#subnav'), $('#subnav a.on'), true);
  }), { rootMargin: '-40% 0px -55% 0px' });
  links.forEach(a => { const s = document.getElementById(a.getAttribute('href').slice(1)); if (s) obs.observe(s); });
})();
