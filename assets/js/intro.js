// Apertura del inicio: se encienden las luces, penalti, ¡GOL! con la tribuna y se abre la página.
// El sonido necesita que la persona toque la pantalla (los navegadores lo bloquean), por eso arranca con "Entrar al estadio".
// Grito de tribuna: "Arrowhead Stadium crowd noise" de Kj1595, CC BY-SA 4.0, vía Wikimedia Commons (recortado y comprimido).
'use strict';
(() => {
  const intro = document.getElementById('intro');
  const html = document.documentElement;
  if (!intro) return;
  if (html.classList.contains('intro-visto')) { intro.remove(); return; }
  window.SPintro = true;
  const $ = s => intro.querySelector(s);
  const $$ = s => [...intro.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const anim = (el, frames, op) => (typeof el === 'string' ? $$(el) : [el]).filter(Boolean).map(e => e.animate(frames, { fill: 'forwards', easing: 'ease-in-out', ...op }));
  const rot = d => ({ transform: `rotate(${d}deg)` });
  const pos = (x, y, s = 1) => ({ transform: `translate(${x}px, ${y}px) scale(${s})` });
  let terminado = false, jugando = false;

  // ───────── sonido ─────────
  const datosAudio = fetch('assets/audio/tribuna-gol.m4a').then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
  let ctx = null, master = null, tribuna = null;
  function prepararAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      ctx.resume?.();
      master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
      tribuna = new Promise(res => datosAudio.then(ab => {
        if (!ab) return res(null);
        ctx.decodeAudioData(ab, buf => {
          // la grabación pasa por un filtro: cerrado suena a murmullo lejano, abierto es el grito de gol
          const src = ctx.createBufferSource(), filtro = ctx.createBiquadFilter(), gan = ctx.createGain();
          src.buffer = buf; filtro.type = 'lowpass'; filtro.frequency.value = 420; gan.gain.value = 0;
          src.connect(filtro); filtro.connect(gan); gan.connect(master);
          res({ src, filtro, gan });
        }, () => res(null));
      }));
    } catch { ctx = null; }
  }
  const ahora = () => ctx.currentTime;
  async function murmullo() {
    const t = await tribuna; if (!t || terminado) return;
    t.src.start(); t.gan.gain.setValueAtTime(0, ahora()); t.gan.gain.linearRampToValueAtTime(.55, ahora() + 1.2);
  }
  async function gritoGol() {
    const t = await tribuna; if (!t) return;
    const n = ahora();
    t.filtro.frequency.cancelScheduledValues(n); t.filtro.frequency.setValueAtTime(t.filtro.frequency.value, n); t.filtro.frequency.exponentialRampToValueAtTime(16000, n + .18);
    t.gan.gain.cancelScheduledValues(n); t.gan.gain.setValueAtTime(t.gan.gain.value, n); t.gan.gain.linearRampToValueAtTime(1.05, n + .15);
  }
  function silbato() {
    if (!ctx) return;
    const n = ahora(), o = ctx.createOscillator(), lfo = ctx.createOscillator(), prof = ctx.createGain(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 3050; lfo.frequency.value = 32; prof.gain.value = 140;
    lfo.connect(prof); prof.connect(o.frequency); o.connect(g); g.connect(master);
    g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(.14, n + .02); g.gain.setValueAtTime(.14, n + .5); g.gain.linearRampToValueAtTime(0, n + .58);
    o.start(n); lfo.start(n); o.stop(n + .6); lfo.stop(n + .6);
  }
  function ruido(dur, freq, vol, tipo = 'bandpass') {
    if (!ctx) return;
    const n = ahora(), len = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; f.type = tipo; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(n);
  }
  function patada() {
    if (!ctx) return;
    const n = ahora(), o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, n); o.frequency.exponentialRampToValueAtTime(45, n + .13);
    g.gain.setValueAtTime(.9, n); g.gain.exponentialRampToValueAtTime(.001, n + .16);
    o.connect(g); g.connect(master); o.start(n); o.stop(n + .18);
    ruido(.04, 1800, .35);
  }
  const clunk = () => ruido(.08, 260, .5, 'lowpass');
  function apagarAudio(seg) {
    if (!ctx) return;
    const n = ahora();
    master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(master.gain.value, n); master.gain.linearRampToValueAtTime(0, n + seg);
    setTimeout(() => ctx.close?.(), seg * 1000 + 200);
  }

  // ───────── piezas de la escena ─────────
  // valla LED: el texto corre en bucle sin saltos (se mide un tramo de los 4 repetidos)
  const led = $('#in-led'), ledTxt = led?.querySelector('text');
  if (led && ledTxt && !reduce) {
    const tramo = () => { const w = ledTxt.getComputedTextLength() / 4; if (w) led.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-w}px)` }], { duration: w * 22, iterations: Infinity }); };
    document.fonts?.ready ? document.fonts.ready.then(tramo) : tramo();
  }
  // portero esperando: se mueve de lado a lado
  const balanceo = reduce ? [] : anim('#p-c', [{ transform: 'translate(-22px, 0)' }, { transform: 'translate(0, -6px)' }, { transform: 'translate(22px, 0)' }], { duration: 900, iterations: Infinity, direction: 'alternate', fill: 'none' });

  // flashes de cámaras en la tribuna
  const SVGNS = 'http://www.w3.org/2000/svg', capaFlash = $('#in-flashes');
  function flashes(n, desde, hasta) {
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', (Math.random() * 1000).toFixed(0)); c.setAttribute('cy', (96 + Math.random() * 280).toFixed(0));
      c.setAttribute('r', (1.6 + Math.random() * 2.6).toFixed(1)); c.setAttribute('class', 'in-flash');
      capaFlash.appendChild(c);
      c.animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 0 }], { duration: 220, delay: desde + Math.random() * (hasta - desde), fill: 'both' });
    }
  }

  // confeti con los colores de la marca
  const lienzo = $('#in-confeti');
  function confeti() {
    if (!lienzo || reduce) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = lienzo.clientWidth, H = lienzo.clientHeight, cx = lienzo.getContext('2d');
    lienzo.width = W * dpr; lienzo.height = H * dpr; cx.scale(dpr, dpr);
    const colores = ['#3FE0F0', '#2433E0', '#FFD54A', '#FF2E4D', '#FFFFFF', '#3B5BFF', '#8CF3FA'];
    const p = [];
    const lanzar = (x, y, ang, n) => { for (let i = 0; i < n; i++) { const a = ang + (Math.random() - .5) * 1.1, v = (7 + Math.random() * 10) * Math.min(1.2, H / 700); p.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - .5) * .35, w: 6 + Math.random() * 7, h: 4 + Math.random() * 5, c: colores[i % colores.length] }); } };
    lanzar(0, H, -1.05, 90); lanzar(W, H, -2.09, 90); lanzar(W / 2, H * .35, -1.57, 50);
    const t0 = performance.now();
    (function cuadro(t) {
      cx.clearRect(0, 0, W, H);
      for (const q of p) { q.vy += .32; q.vx *= .992; q.x += q.vx; q.y += q.vy; q.r += q.vr; cx.save(); cx.translate(q.x, q.y); cx.rotate(q.r); cx.fillStyle = q.c; cx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h * Math.abs(Math.cos(q.r * 1.7))); cx.restore(); }
      if (t - t0 < 4200 && !terminado) requestAnimationFrame(cuadro); else cx.clearRect(0, 0, W, H);
    })(t0);
  }

  // ───────── el cobrador ─────────
  const ZANCADA = 440;
  function correr(veces) {
    const op = { duration: ZANCADA, iterations: veces, easing: 'linear', fill: 'forwards' };
    return [
      ...anim('#k-muslo-r', [rot(-40), rot(38), rot(-40)], op), ...anim('#k-pierna-r', [rot(10), rot(20), rot(95), rot(60), rot(10)], op),
      ...anim('#k-muslo-l', [rot(38), rot(-40), rot(38)], op), ...anim('#k-pierna-l', [rot(95), rot(60), rot(10), rot(20), rot(95)], op),
      ...anim('#k-brazo-r', [rot(40), rot(-45), rot(40)], op), ...anim('#k-brazo-l', [rot(-45), rot(40), rot(-45)], op),
      ...anim('#k-cuerpo', [{ transform: 'translateY(0)' }, { transform: 'translateY(-7px)' }, { transform: 'translateY(0)' }], { ...op, duration: ZANCADA / 2, iterations: veces * 2 }),
    ];
  }
  const pose = (dur, p, easing = 'ease-out') => Object.entries(p).forEach(([id, deg]) => anim(id === 'tronco' ? '.k-tronco' : '#k-' + id, [rot(deg)], { duration: dur, easing }));

  // ───────── la jugada ─────────
  async function jugar() {
    if (jugando) return; jugando = true;
    intro.classList.add('juega');
    if (reduce) { await espera(300); return salir(1.2); }

    // 1. se encienden las luces, banco por banco
    const bancos = $$('.in-banco'), haces = $$('.in-haz');
    for (let i = 0; i < bancos.length; i++) { await espera(170); bancos[i].classList.add('on'); haces[i]?.classList.add('on'); clunk(); }
    intro.classList.add('luces');
    murmullo();
    flashes(10, 200, 1900);
    await espera(550);

    // 2. silbato y carrera
    silbato();
    await espera(380);
    const carrera = correr(3);
    anim('#k', [pos(330, 860, 1), pos(455, 668, .8)], { duration: ZANCADA * 3, easing: 'linear' });
    anim('#k-sombra', [pos(334, 862, 1), pos(459, 670, .8)], { duration: ZANCADA * 3, easing: 'linear' });
    await espera(ZANCADA * 3 - 60);
    carrera.forEach(a => { a.commitStyles?.(); a.cancel(); });

    // 3. apoyo, carga y remate
    pose(140, { 'muslo-l': -8, 'pierna-l': 6, 'muslo-r': 55, 'pierna-r': 100, 'brazo-l': -115, 'ante-l': -25, 'brazo-r': 70, 'ante-r': -40, tronco: -4 });
    anim('#k-cuerpo', [{ transform: 'translateY(0)' }], { duration: 140 });
    await espera(150);
    pose(130, { 'muslo-r': -70, 'pierna-r': -5 }, 'cubic-bezier(.5,0,.9,.6)');
    anim('#k', [pos(455, 668, .8), pos(470, 664, .8)], { duration: 260 });
    await espera(82);

    // 4. el balón sale al ángulo; el portero se lanza al otro lado
    patada();
    anim('#b', [pos(500, 660), { ...pos(566, 505, .68), offset: .5 }, pos(612, 398, .48)], { duration: 430, easing: 'cubic-bezier(.15,.55,.45,1)' });
    anim('#b-gira', [rot(0), rot(820)], { duration: 430, easing: 'linear' });
    anim('#b-sombra', [{ transform: 'translate(503px, 671px) scale(1)', opacity: .45 }, { transform: 'translate(608px, 466px) scale(.5)', opacity: .15 }], { duration: 430 });
    await espera(70);
    pose(160, { 'muslo-r': -95, 'pierna-r': -12 });
    balanceo.forEach(a => { a.commitStyles?.(); a.cancel(); });
    anim('#p', [{ transform: 'translate(0, 0) rotate(0deg)' }, { transform: 'translate(-120px, -70px) rotate(-55deg)', offset: .55 }, { transform: 'translate(-210px, -20px) rotate(-82deg)' }], { duration: 480, easing: 'cubic-bezier(.3,.6,.4,1)' });
    anim('#p-brazo-l', [rot(55), rot(170)], { duration: 260 });
    anim('#p-brazo-r', [rot(-55), rot(-170)], { duration: 260 });
    await espera(360);

    // 5. ¡GOL!
    gritoGol();
    anim('#in-red-anim', [{ transform: 'scale(1)' }, { transform: 'translate(10px, -8px) scale(1.07)' }, { transform: 'translate(-3px, 2px) scale(.98)' }, { transform: 'scale(1)' }], { duration: 650, easing: 'ease-out' });
    anim('#in-impacto', [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(11)', opacity: 0 }], { duration: 650, easing: 'ease-out' });
    anim('#b', [pos(612, 398, .48), pos(606, 455, .46)], { duration: 520, easing: 'cubic-bezier(.5,0,1,1)' });
    anim('#in-blanco', [{ opacity: 0 }, { opacity: .8, offset: .15 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' });
    intro.classList.add('tiembla'); setTimeout(() => intro.classList.remove('tiembla'), 500);
    flashes(70, 0, 3000);
    anim('#in-hinchas-a', [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }], { duration: 190, iterations: 18, direction: 'alternate' });
    anim('#in-hinchas-b', [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)' }], { duration: 170, iterations: 20, direction: 'alternate', delay: 90 });
    confeti();
    gol();

    // 6. celebración: corre, salta dos veces con los brazos arriba
    pose(200, { 'muslo-r': -10, 'pierna-r': 10, 'muslo-l': 12, 'pierna-l': 10, tronco: 6 });
    await espera(220);
    const fiesta = correr(2);
    anim('#k', [pos(470, 664, .8), pos(560, 640, .8)], { duration: ZANCADA * 2, easing: 'linear' });
    anim('#k-sombra', [pos(474, 666, .8), pos(564, 642, .8)], { duration: ZANCADA * 2, easing: 'linear' });
    await espera(ZANCADA * 2 - 40);
    fiesta.forEach(a => { a.commitStyles?.(); a.cancel(); });
    for (let i = 0; i < 2; i++) {
      pose(160, { 'brazo-r': -165, 'ante-r': -10, 'brazo-l': -150, 'ante-l': -15, 'muslo-r': -50, 'pierna-r': 110, 'muslo-l': -20, 'pierna-l': 80, tronco: -6 });
      anim('#k', [pos(560, 640, .8), { ...pos(560, 586, .8), easing: 'ease-in' }, pos(560, 640, .8)], { duration: 560, easing: 'ease-out' });
      await espera(300);
      pose(220, { 'muslo-r': -5, 'pierna-r': 8, 'muslo-l': 5, 'pierna-l': 8 });
      await espera(280);
    }

    // 7. los logos y se abre la página
    anim('#in-gol', [{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(.6)', opacity: 0 }], { duration: 380, easing: 'ease-in' });
    anim('#in-cierre', [{ transform: 'translate(-50%, -50%) scale(.7)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(1.04)', opacity: 1, offset: .7 }, { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }], { duration: 650, delay: 200, easing: 'cubic-bezier(.22,1,.36,1)' });
    await espera(1500);
    salir(2.6);
  }

  // texto ¡GOOOL! que se estira
  async function gol() {
    const el = $('#in-gol');
    anim(el, [{ transform: 'translate(-50%, -50%) scale(2.6) rotate(-10deg)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(.92) rotate(-4deg)', opacity: 1, offset: .6 }, { transform: 'translate(-50%, -50%) scale(1) rotate(-4deg)', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
    for (let n = 2; n <= 6; n++) { await espera(130); if (terminado) return; el.textContent = `¡G${'O'.repeat(n)}L!`; }
  }

  function salir(seg = 1) {
    if (terminado) return; terminado = true;
    try { sessionStorage.setItem('sp:intro', '1'); } catch { /* sin almacenamiento */ }
    apagarAudio(seg);
    intro.classList.add('sale');
    setTimeout(() => {
      intro.remove(); html.classList.remove('intro-on');
      document.dispatchEvent(new Event('sp:intro-fin'));
    }, 950);
  }

  $('#in-entrar')?.addEventListener('click', () => { prepararAudio(); jugar(); });
  $('#in-saltar')?.addEventListener('click', e => { e.preventDefault(); salir(.6); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !terminado) salir(.6); });
  setTimeout(() => $('#in-entrar')?.focus({ preventScroll: true }), 400);
})();
