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
    hero(); inscripcion(); llaves(); posiciones(); proximos(); resultados(); goleadores(); sanciones(); galeria(); medios(); promosTorneo();
    SP.revelar();
  });
  SP.cargar('sitio', s => {
    if (!s) return;
    $('#socials').innerHTML = SP.redesHTML(s.redes);
    $('#sponsors').innerHTML = SP.patrocinadoresHTML(s.patrocinadores);
    promosTorneo();
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
        <p class="cuenta-tit" id="ins-cuenta-tit" hidden>El torneo arranca en</p><div class="cuenta" id="ins-cuenta" hidden style="margin-bottom:24px"></div>
        <p class="promo-nota" id="ins-promo" hidden></p>
        <a class="btn btn-wa" href="${esc(SP.wa(i.whatsapp, i.mensaje))}" target="_blank" rel="noopener">${ICON.wa.replace('<svg', '<svg width="20" height="20" fill="currentColor"')} Inscribir mi equipo</a>
      </div></div>`;
    SP.cuenta($('#ins-cuenta'), i.inicio);
    $('#ins-cuenta-tit').hidden = $('#ins-cuenta').hidden;
  }

  function posiciones() {
    const R = T.reglas || {}, tabla = SP.tabla(T), cl = +R.clasifican || tabla.length;
    const ult = SP.jugados(T).filter(p => !SP.esLlave(p)).reduce((m, p) => Math.max(m, p.fecha), 0);
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
    const g = SP.esLlave(p) ? SP.ganador(p) : null;
    const w = fin ? (g ? (g === p.local ? 'l' : 'v') : +p.gl > +p.gv ? 'l' : +p.gl < +p.gv ? 'v' : '') : '';
    const tag = abrir && fin ? 'button' : 'div';
    return `<${tag} class="partido r" ${tag === 'button' ? `data-id="${esc(p.id)}" aria-label="Ver detalle: ${nombre(p.local)} ${p.gl} - ${p.gv} ${nombre(p.visita)}"` : ''}>
      <span class="eq ${w === 'l' ? 'win' : ''}">${crest(p.local)}<span>${nombre(p.local)}</span></span>
      <span class="marcador">
        <span class="estado ${fin ? 'fin' : ''}">${fin ? 'FINAL' : p.estado === 'aplazado' ? 'APLAZADO' : 'PROGRAMADO'}</span>
        ${fin ? `<span class="goles">${p.gl} : ${p.gv}</span>${pen(p) ? `<span class="pen">${pen(p)}</span>` : ''}` : `<span class="hora">${esc(SP.hora(p.hora) || 'vs')}</span>`}
        <span class="cuando">${esc(SP.fecha(p.dia))}${fin && p.hora ? ' · ' + esc(SP.hora(p.hora)) : ''}${p.cancha ? ' · ' + esc(p.cancha) : ''}</span>
      </span>
      <span class="eq ${w === 'v' ? 'win' : ''}">${crest(p.visita)}<span>${nombre(p.visita)}</span></span>
      ${tag === 'button' ? `<span class="ver">${p.fotos ? 'Goles y fotos' : 'Ver goles'}</span>` : ''}
    </${tag}>`;
  }
  // penales: solo en eliminación cuando hubo empate
  const pen = p => SP.esLlave(p) && +p.gl === +p.gv && p.pl != null && p.pv != null && p.pl !== '' && p.pv !== '' ? `Penales ${p.pl} - ${p.pv}` : '';

  // ───────── llaves de la fase final ─────────
  function llaves() {
    const L = SP.llaves(T), hay = (T.partidos || []).some(SP.esLlave);
    const ver = !!L && (!L.gruposAbiertos || hay);
    $('#llaves').hidden = !ver; $('#sub-llaves').hidden = !ver;
    if (!ver) return;
    // dibujo como el cuadro oficial del torneo (1080 × 880): escudos a los lados, nodos donde aparece cada ganador y la copa al centro
    const X = x => (x / 1080 * 100).toFixed(2) + '%', Y = y => (y / 880 * 100).toFixed(2) + '%';
    const pos = (x, y) => `left:${X(x)};top:${Y(y)}`;
    const marcador = m => {
      const p = m.p;
      if (!p) return '';
      if (p.estado !== 'finalizado') return ''; // la fecha y la hora están en Próximos partidos
      const aL = m.a && p.local === m.a.id, ga = aL ? p.gl : p.gv, gb = aL ? p.gv : p.gl;
      const pa = aL ? p.pl : p.pv, pb = aL ? p.pv : p.pl;
      return `${ga} - ${gb}${pen(p) ? `\npen. ${pa}-${pb}` : ''}`;
    };
    const equipo = (x, m, cx, cy, sx) => {
      const est = m.ganador ? (m.ganador.id === x.id ? 'gana' : 'pierde') : '';
      return `<div class="ll-t ${est}" style="${pos(cx, cy)}" title="${nombre(x.id)}">${crest(x.id)}</div><b class="ll-sd display ${est}" style="${pos(sx, cy)}">${x.pos}</b>`;
    };
    const nodo = (m, cx, cy, lado = '') => {
      const fin = m.p?.estado === 'finalizado', g = m.ganador;
      const tag = fin ? 'button' : 'div', txt = marcador(m);
      return `<${tag} class="ll-n${g ? ' listo' : ''}" style="${pos(cx, cy)}" ${fin ? `data-abrir="${esc(m.p.id)}" aria-label="Ver detalle del partido"` : ''}>${g ? crest(g.id) : '<span class="ll-bola"></span>'}${txt ? `<span class="ll-l ${lado}">${esc(txt)}</span>` : ''}</${tag}>`;
    };
    const c = L.cuartos, sf = L.semis, F = L.final, campeon = L.campeon;
    const ronda = campeon ? `Campeón: ${E[campeon.id]?.nombre || ''}` : F.p || (sf[0].ganador && sf[1].ganador) ? 'Gran final' : sf.some(m => m.p) || c.every(m => m.ganador) ? 'Semifinales' : 'Cuartos de final';
    const LINEAS = 'M262 68H303V150M262 310H303V230M338 190H398V680H338M262 553H303V640M262 797H303V720M398 427H440';
    $('#bracket').innerHTML = `
      <div class="ll-tit"><b class="display">Fase final</b><span class="display">${esc(ronda)}</span></div>
      <div class="ll-cuadro">
        <svg class="ll-lineas" viewBox="0 0 1080 880" preserveAspectRatio="none" aria-hidden="true"><path d="${LINEAS}"/><path d="${LINEAS}" transform="matrix(-1 0 0 1 1080 0)"/><path d="M504 427H576M540 427V392"/></svg>
        <img class="ll-copa" src="assets/img/torneo/trofeo.webp" alt="Copa Seven Pro League" style="${pos(540, 180)}">
        ${campeon ? `<div class="ll-campeon-e" style="${pos(540, 230)}">${crest(campeon.id)}</div><p class="ll-campeon" style="${pos(540, 368)}"><small>Campeón</small> <b class="display">${nombre(campeon.id)}</b></p>` : ''}
        ${equipo(c[0].a, c[0], 200, 68, 118)}${equipo(c[0].b, c[0], 200, 310, 118)}${nodo(c[0], 303, 190, 'der')}
        ${equipo(c[1].a, c[1], 200, 553, 118)}${equipo(c[1].b, c[1], 200, 797, 118)}${nodo(c[1], 303, 680, 'der')}
        ${equipo(c[2].a, c[2], 880, 68, 962)}${equipo(c[2].b, c[2], 880, 310, 962)}${nodo(c[2], 777, 190, 'izq')}
        ${equipo(c[3].a, c[3], 880, 553, 962)}${equipo(c[3].b, c[3], 880, 797, 962)}${nodo(c[3], 777, 680, 'izq')}
        ${nodo(sf[0], 472, 427)}${nodo(sf[1], 608, 427)}
        ${F.p?.estado === 'finalizado' ? `<p class="ll-final" style="${pos(540, 548)}">Final · ${esc(marcador(F))}</p>` : ''}
        <div class="ll-makro display" style="${pos(540, 618)}"><b>7VS7</b><span>Cancha<br>Makro</span></div>
        <div class="ll-marca" style="${pos(540, 765)}"><img src="assets/img/logos/seven-pro-league.png" alt=""><span class="display">#El poder <small>del</small><br>fútbol aficionado</span></div>
      </div>`;
    // en celular los marcadores no caben en el dibujo: van en una lista corta debajo
    const lista = [...c, ...sf, F].filter(m => m.p && m.a && m.b).map(m => {
      const p = m.p, fin = p.estado === 'finalizado';
      const lado = x => `<span class="${m.ganador ? (m.ganador.id === x.id ? 'gana' : 'pierde') : ''}">${crest(x.id, 'crest-sm')}${nombre(x.id)}</span>`;
      const centro = fin ? esc(marcador(m)) : esc([SP.fecha(p.dia, { day: 'numeric', month: 'short' }), SP.hora(p.hora)].filter(x => x && x !== 'Por definir').join(' · ') || 'vs');
      return `<${fin ? `button data-abrir="${esc(p.id)}"` : 'div'} class="ll-fila"><small>${SP.FASES[m.fase]}</small>${lado(m.a)}<b>${centro}</b>${lado(m.b)}</${fin ? 'button' : 'div'}>`;
    }).join('');
    $('#bracket').insertAdjacentHTML('beforeend', lista ? `<div class="ll-lista">${lista}</div>` : '');
    $$('#bracket img[loading="lazy"]').forEach(i => { i.loading = 'eager'; }); // los escudos de abajo a veces no cargaban
    $('#ll-nota').textContent = L.gruposAbiertos ? 'Así quedarían los cruces si la fase de grupos terminara hoy.' : 'Los cruces salen de la tabla final y cada ganador avanza solo con su resultado. Toca un partido jugado para ver los goles.';
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
    $('#prox-sub').textContent = `${SP.nombreFecha(T, f)} · ${SP.fecha(ps[0]?.dia, { weekday: 'long', day: 'numeric', month: 'long' })}`;
    $('#proximos').innerHTML = `<div class="partidos">${ps.map(p => tarjeta(p, false)).join('')}</div>
      ${d.length ? `<p class="descanso">Descansa: <b>${d.map(e => esc(e.nombre)).join(', ')}</b></p>` : ''}`;
  }

  function resultados() {
    const fechas = SP.fechas(T);
    const jugadas = new Set(SP.jugados(T).map(p => p.fecha));
    if (fechaSel === null || !fechas.includes(fechaSel)) fechaSel = Math.max(...[...jugadas], fechas[0] || 1);
    $('#fecha-chips').innerHTML = fechas.map(f => `<button aria-pressed="${f === fechaSel}" class="${jugadas.has(f) ? '' : 'pend'}" data-f="${f}">${esc(SP.nombreFecha(T, f))}</button>`).join('');
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
    const b = e.target.closest('button.partido[data-id], [data-abrir]');
    if (b) abrirPartido(b.dataset.id || b.dataset.abrir);
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
        <div><div class="res">${p.gl} : ${p.gv}</div>${pen(p) ? `<small class="pen">${pen(p)}</small>` : ''}<small>${esc(SP.nombreFecha(T, p.fecha))} · ${esc(SP.fecha(p.dia))}${p.hora ? ' · ' + esc(SP.hora(p.hora)) : ''}</small></div>
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
    SP.revelar($('#podio'));
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
  // beneficios de la tienda para jugadores (panel → Promociones)
  function promosTorneo() {
    if (!T) return;
    const P = SP.promos(), ins = $('#ins-promo'), mvp = $('#mvp-promo');
    if (ins) {
      ins.hidden = !P.inscritos.activo;
      ins.innerHTML = `🏷️ Si juegas el torneo: <b>${+P.inscritos.porcentaje ? P.inscritos.porcentaje + '% de descuento' : 'descuento'}</b> en la tienda cualquier día${P.inscritos.domicilio ? ' y <b>domicilio gratis</b>' : ''}.`;
    }
    mvp.hidden = !P.mvp.activo;
    mvp.innerHTML = '⭐ Los MVP de la fecha reciben un <b>código de descuento personal</b> para la tienda (se usa una sola vez).';
  }

  function galeria() {
    fotos = (T.fotos || []).filter(f => f.url);
    const f = T.fotosFecha || SP.jugados(T).reduce((m, p) => Math.max(m, p.fecha), 0);
    $('#jug-fecha').textContent = f ? `Fecha ${f}` : 'Última fecha';
    $('#fotos').hidden = !fotos.length;
    $('#galeria').innerHTML = fotos.map((f, i) => `<button data-foto="${i}" class="r" style="--d:${(i % 4) * .05}s"><img src="${esc(f.url)}" alt="${esc(f.titulo || '')}" loading="lazy"><span>${esc(f.titulo || '')}</span></button>`).join('');
  }
  // fotos y jugadas destacadas (panel → Fotos y videos): los videos de YouTube se ven en el visor
  let medList = [];
  function medios() {
    medList = (T.medios || []).filter(m => m.url);
    $('#medios').hidden = !medList.length;
    // una sola línea que se mueve sola (como la barra de avisos): la lista se repite para que el giro no tenga saltos
    const tarjeta = (m, i, copia) => {
      const id = m.tipo === 'video' ? SP.youtubeId(m.url) : '';
      const img = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : m.tipo === 'video' ? '' : m.url;
      // los videos se reproducen solos (sin sonido, en bucle) mientras están a la vista
      const media = m.subido ? `<video src="${esc(m.url)}#t=0.1" preload="auto" muted loop playsinline webkit-playsinline tabindex="-1" data-auto></video><i class="play">▶</i>`
        : img ? `<img src="${esc(img)}" alt="${esc(copia ? '' : m.titulo || '')}" loading="lazy">${id ? `<div class="yt ${/\/shorts\//.test(m.url) ? 'short' : ''}" data-yt="${id}"></div>` : ''}` : '<div class="sin-mini">▶</div>';
      return `<button data-medio="${i}" class="${m.tipo === 'video' ? 'es-video' : ''}" ${copia ? 'tabindex="-1" aria-hidden="true"' : ''}>${media}${m.tipo === 'video' && !m.subido && !id ? '<i class="play">▶</i>' : ''}${m.titulo ? `<span>${esc(m.titulo)}</span>` : ''}</button>`;
    };
    const vueltas = Math.max(1, Math.ceil(7 / (medList.length || 1)));
    const uno = Array.from({ length: vueltas }, (_, k) => medList.map((m, i) => tarjeta(m, i, k > 0))).flat().join('');
    const copia = medList.map((m, i) => tarjeta(m, i, true)).join('').repeat(vueltas);
    const ancho = medList.length * vueltas * (SP.movil.matches ? 188 : 250); // alto de la tarjeta × proporción + separación
    $('#medios-grid').innerHTML = `<div class="cinta-pista" style="--dur:${Math.max(20, Math.round(ancho / 55))}s">${uno}${copia}</div>`;
    autoplay();
  }
  // si el celular bloquea el autoplay (ahorro de batería o de datos), se deja el ícono de play y se reintenta en el primer toque o scroll
  const arrancar = v => {
    v.muted = true;
    const p = v.play();
    const marca = ok => v.closest('button')?.classList.toggle('auto-ok', ok);
    if (p && p.then) p.then(() => marca(true)).catch(() => marca(false)); else marca(true);
  };
  ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(ev => addEventListener(ev, () => {
    $$('#medios-grid video[data-auto]').forEach(v => { const r = v.getBoundingClientRect(); if (v.paused && r.right > 0 && r.left < innerWidth) arrancar(v); });
  }, { passive: true, once: false }));
  // reproduce solo lo que se ve: así el celular no carga todos los videos a la vez
  let vistos;
  function autoplay() {
    vistos?.disconnect();
    if (SP.reduce || !('IntersectionObserver' in window)) return;
    vistos = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target.matches('video') ? e.target : null, y = e.target.matches('.yt') ? e.target : null;
      if (v) { if (e.isIntersecting) arrancar(v); else v.pause(); }
      if (y) {
        if (e.isIntersecting && !y.firstChild) y.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${y.dataset.yt}?autoplay=1&mute=1&controls=0&loop=1&playlist=${y.dataset.yt}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1" title="" tabindex="-1" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        else if (!e.isIntersecting) y.innerHTML = '';
      }
    }), { threshold: .35 });
    $$('#medios-grid video[data-auto], #medios-grid .yt').forEach(el => vistos.observe(el));
  }

  const lb = $('#lb');
  let lista = [];
  const verFoto = i => {
    lbI = (i + lista.length) % lista.length;
    const m = lista[lbI], id = m.tipo === 'video' ? SP.youtubeId(m.url) : '';
    $('.lb-img', lb).innerHTML = m.subido ? `<video class="lb-vid" src="${esc(m.url)}" controls autoplay playsinline></video>` : m.tipo === 'video'
      ? (id ? `<div class="lb-video"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${esc(m.titulo || 'Video')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`
        : `<a class="btn btn-light" href="${esc(m.url)}" target="_blank" rel="noopener">Ver video ${ICON.ext}</a>`)
      : `<img src="${esc(m.url)}" alt="">`;
    $('#lb-cap').textContent = m.titulo || '';
  };
  const ocultarFoto = () => { if (lb.hidden) return; lb.hidden = true; $('.lb-img', lb).innerHTML = ''; SP.unlock(); };
  const abrir = (l, i, hash) => { lista = l; verFoto(i); lb.hidden = false; SP.lock(); history.pushState({ foto: 1 }, '', location.pathname + hash); };
  $('#galeria').addEventListener('click', e => { const b = e.target.closest('[data-foto]'); if (b) abrir(fotos, +b.dataset.foto, '#fotos'); });
  $('#medios-grid').addEventListener('click', e => { const b = e.target.closest('[data-medio]'); if (b) abrir(medList, +b.dataset.medio, '#medios'); });
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
