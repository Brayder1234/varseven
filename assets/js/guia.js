// Guía: superficies y calculadora de talla
'use strict';
(() => {
  const { $, $$, esc, ICON } = SP;
  const SUP = [
    { id: 'fg', nombre: 'FG', sub: 'Césped natural', titulo: 'Firm Ground', cat: 'guayos', img: 'assets/img/suelas/fg.webp',
      texto: 'Tacos de goma firmes, cónicos o laminados, que se clavan en el césped natural y te dan tracción en cada arranque y frenada.',
      chips: ['Fútbol 11', 'Césped natural', 'Tacos de goma'], barras: { Agarre: 95, Estabilidad: 82, Giro: 70 } },
    { id: 'ag', nombre: 'AG', sub: 'Grama sintética', titulo: 'Artificial Grass', cat: 'guayos', img: 'assets/img/suelas/ag.webp',
      texto: 'Tacos más cortos y numerosos, pensados para la grama sintética de pelo largo. Reparten la presión y cuidan la rodilla en los giros.',
      chips: ['Sintética pelo largo', 'Tacos cortos', 'Menos impacto'], barras: { Agarre: 86, Estabilidad: 86, Giro: 80 } },
    { id: 'tf', nombre: 'TF', sub: 'Torretín', titulo: 'Multitaco · Turf', cat: 'torretin', img: 'assets/img/suelas/tf.webp', recomendado: true,
      texto: 'Suela de caucho con decenas de microtacos: agarre y comodidad en la sintética de pelo corto. La más usada en fútbol 5, 7 y 8.',
      chips: ['Fútbol 7', 'Sintética pelo corto', 'Microtacos'], barras: { Agarre: 80, Comodidad: 92, Giro: 90 } },
    { id: 'ic', nombre: 'IC', sub: 'Futsal · micro', titulo: 'Indoor Court', cat: 'futsal', img: 'assets/img/suelas/ic.webp',
      texto: 'Suela lisa de goma que no marca el piso. Control total en cancha cubierta, coliseo y microfútbol.',
      chips: ['Futsal', 'Piso liso', 'No marca'], barras: { Agarre: 74, Control: 94, Giro: 96 } },
  ];
  let sel = location.hash === '#ic' ? 'ic' : 'tf';

  $('#sup-tabs').innerHTML = '<span class="tabs-pill"></span>' + SUP.map(s => `<button role="tab" data-s="${s.id}" aria-selected="${s.id === sel}">${s.nombre}<small>${esc(s.sub)}</small></button>`).join('');
  function pintar() {
    const s = SUP.find(x => x.id === sel);
    $$('#sup-tabs [data-s]').forEach(b => b.setAttribute('aria-selected', b.dataset.s === sel));
    SP.pildora($('#sup-tabs'));
    $('#sup').innerHTML = `
      <div class="sup-vis"><img src="${s.img}" alt="Suela ${s.nombre}" ><span class="sup-code display">${s.nombre}</span></div>
      <div>
        ${s.recomendado ? '<span class="sup-badge">★ Recomendado para la Seven Pro League</span>' : ''}
        <h3 class="display">${esc(s.titulo)}</h3>
        <p>${esc(s.texto)}</p>
        <div class="sup-chips">${s.chips.map(c => `<span>${esc(c)}</span>`).join('')}</div>
        <div class="barras">${Object.entries(s.barras).map(([k, v]) => `<div class="barra">${k}<i style="--v:0%" data-v="${v}%"></i></div>`).join('')}</div>
        <a class="btn btn-light" href="tienda.html?cat=${s.cat}">Ver ${s.cat === 'guayos' ? 'guayos' : s.cat === 'torretin' ? 'torretín' : 'futsal'} ${s.nombre} ${ICON.arrow}</a>
      </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $$('#sup .barra i').forEach(i => i.style.setProperty('--v', i.dataset.v))));
  }
  $('#sup-tabs').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { sel = b.dataset.s; pintar(); } });
  pintar();

  // calculadora
  let ancho = false;
  function calcular() {
    const cm = +$('#cm').value, t = SP.tallaPara(cm, ancho);
    $('#cm-txt').innerHTML = `${cm.toFixed(1).replace('.', ',')}<small>cm</small>`;
    $('#pie-svg').style.transform = `scaleY(${(0.82 + (cm - 22.5) / 7.5 * 0.3).toFixed(3)})`;
    $('#res').innerHTML = [['COL', t.col], ['EUR', t.eur], ['USA', t.us], ['UK', t.uk]].map(([k, v]) => `<div><small>${k}</small><b>${String(v).replace('.', ',')}</b></div>`).join('');
    $('#consejo').innerHTML = `Tu talla sugerida es <b>${t.col} COL (EU ${t.eur})</b>.${ancho ? ' Como tu pie es ancho, subimos media talla.' : ''} En torretín y futsal usa tu talla exacta; si quedas entre dos, elige la mayor.`;
    $('#ir-tienda').href = 'tienda.html';
  }
  $('#cm').addEventListener('input', calcular);
  $('#ancho').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; ancho = b.dataset.a === '1'; $$('#ancho button').forEach(x => x.setAttribute('aria-pressed', x === b)); calcular(); });
  calcular();
})();
