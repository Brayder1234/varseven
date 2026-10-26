// Apertura del inicio: entrada de marca con el logo de Seven Pro League (sin sonido, arranca sola).
// Línea de luz → fondo vivo → escudo con aberración de color, onda y brillo → nombre letra a letra
// → la barra llega a 100 cuando la página terminó de cargar → el fondo se parte en diagonal y aparece la página.
'use strict';
(() => {
  const intro = document.getElementById('intro');
  const html = document.documentElement;
  if (!intro) return;
  if (html.classList.contains('intro-visto')) { intro.remove(); return; }
  const $ = s => intro.querySelector(s);
  // si el diseño de la entrada no llegó (caché vieja del celular, red lenta), no se muestra nada roto: se salta
  const p = $('.in-puerta');
  if (!p || getComputedStyle(p).position !== 'absolute') { intro.remove(); html.classList.remove('intro-on'); return; }
  window.SPintro = true;
  const $$ = s => [...intro.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const E = 'cubic-bezier(.16, 1, .3, 1)';
  const anim = (el, frames, op) => (typeof el === 'string' ? $$(el) : [el]).filter(Boolean).map(e => e.animate(frames, { fill: 'forwards', easing: E, ...op }));
  let terminado = false;
  const t0 = performance.now();

  // nombre letra a letra ("League" en degradado)
  const nombre = $('.in-letras');
  if (nombre) {
    const txt = nombre.textContent.trim();
    nombre.textContent = '';
    txt.split(' ').forEach((pal, w) => {
      [...pal].forEach(ch => { const l = document.createElement('span'); l.className = 'l' + (w === 2 ? ' g' : ''); l.innerHTML = `<span>${ch}</span>`; nombre.appendChild(l); });
      if (w < 2) { const sp = document.createElement('span'); sp.className = 'l'; sp.innerHTML = '<span>&nbsp;</span>'; nombre.appendChild(sp); }
    });
  }

  // ───────── partículas de luz ─────────
  const lienzo = $('#in-polvo');
  const polvo = [];
  let cx = null, W = 0, H = 0;
  function medir() {
    if (!lienzo) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = lienzo.clientWidth; H = lienzo.clientHeight;
    lienzo.width = W * dpr; lienzo.height = H * dpr;
    cx = lienzo.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const centro = () => { const r = $('.in-logo')?.getBoundingClientRect(); return r ? [r.left + r.width / 2, r.top + r.height / 2] : [W / 2, H / 2]; };
  function sembrar(n, rafaga) {
    const [x0, y0] = centro();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rafaga ? 2.5 + Math.random() * 6 : .15 + Math.random() * .45;
      const d = rafaga ? 30 + Math.random() * 40 : 40 + Math.random() * Math.max(W, H) * .45;
      polvo.push({ x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (rafaga ? 0 : .25), r: .6 + Math.random() * (rafaga ? 2.2 : 1.6), a: 0, max: .35 + Math.random() * .6, f: rafaga ? .955 : 1, c: Math.random() < .7 ? '140,243,250' : '255,255,255' });
    }
  }
  function dibujar() {
    if (!cx || terminado) return;
    cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    for (const p of polvo) {
      p.vx *= p.f; p.vy *= p.f; p.x += p.vx; p.y += p.vy; p.a = Math.min(p.max, p.a + .03);
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283);
      cx.fillStyle = `rgba(${p.c},${p.a})`; cx.shadowBlur = 8; cx.shadowColor = `rgba(${p.c},.9)`; cx.fill();
    }
    requestAnimationFrame(dibujar);
  }

  // ───────── barra de carga: avanza sola hasta 92 y llega a 100 cuando la página terminó de cargar ─────────
  const barra = $('#in-barra'), num = $('#in-num');
  let avance = 0, objetivo = 0;
  function contar() {
    avance += (objetivo - avance) * .12;
    if (objetivo - avance < .3) avance = objetivo;
    if (barra) barra.style.transform = `scaleX(${avance / 100})`;
    if (num) num.textContent = String(Math.round(avance)).padStart(3, '0');
    if (!terminado) requestAnimationFrame(contar);
  }
  const cargada = document.readyState === 'complete' ? Promise.resolve() : new Promise(r => addEventListener('load', r, { once: true }));
  const listo = Promise.race([cargada, espera(5200)]);

  async function correr() {
    const img = $('.in-logo img');
    await Promise.race([img?.decode?.().catch(() => {}), espera(1200)]);
    if (terminado) return;
    if (reduce) {
      intro.classList.add('in-vivo', 'in-logo-on');
      img.style.opacity = 1; $('.in-sub').style.opacity = 1;
      $$('.in-nombre .l > span').forEach(s => { s.style.transform = 'none'; });
      await espera(1100);
      return salir();
    }
    medir(); dibujar(); contar();
    const reloj = setInterval(() => { objetivo = Math.max(objetivo, Math.min(92, (performance.now() - t0) / 26)); if (terminado) clearInterval(reloj); }, 60);

    // 1. línea de luz
    anim('.in-linea', [{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1 }], { duration: 560 });
    await espera(380);
    // 2. se enciende el fondo
    intro.classList.add('in-vivo');
    sembrar(46, false);
    await espera(140);
    anim('.in-linea', [{ transform: 'scaleX(1)', opacity: 1 }, { transform: 'scaleX(1.35) scaleY(.4)', opacity: 0 }], { duration: 600 });
    // 3. el escudo entra desenfocado con los colores separados y se junta
    anim(img, [{ opacity: 0, transform: 'scale(1.2)', filter: 'blur(14px) drop-shadow(0 18px 36px rgba(0,0,0,.55))' }, { opacity: 1, offset: .4 }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0) drop-shadow(0 18px 36px rgba(0,0,0,.55))' }], { duration: 1050 });
    // borde de colores separados que tiembla un instante (efecto de transmisión) y se junta
    const glitch = (dx, dy) => [{ opacity: 0, transform: `translate(${dx}px, ${dy}px)` }, { opacity: .8, transform: `translate(${dx}px, ${dy}px)`, offset: .12 }, { opacity: .65, transform: `translate(${-dx * .45}px, ${-dy}px)`, offset: .28 }, { opacity: .55, transform: `translate(${dx * .6}px, 0)`, offset: .44 }, { opacity: .35, transform: `translate(${-dx * .25}px, ${dy * .5}px)`, offset: .62 }, { opacity: .15, transform: `translate(${dx * .1}px, 0)`, offset: .8 }, { opacity: 0, transform: 'none' }];
    anim('.in-croma-c', glitch(-12, 3), { duration: 760, delay: 260, easing: 'linear' });
    anim('.in-croma-r', glitch(12, -3), { duration: 760, delay: 260, easing: 'linear' });
    await espera(260);
    intro.classList.add('in-logo-on');
    anim('.in-onda', [{ transform: 'translate(-50%, -50%) scale(.45)', opacity: .95 }, { transform: 'translate(-50%, -50%) scale(2.4)', opacity: 0 }], { duration: 1200, easing: 'cubic-bezier(.2,.7,.3,1)' });
    sembrar(38, true);
    // 4. nombre letra a letra
    await espera(300);
    $$('.in-nombre .l > span').forEach((s, i) => anim(s, [{ transform: 'translateY(112%) skewY(8deg)' }, { transform: 'translateY(0) skewY(0)' }], { duration: 700, delay: i * 30 }));
    // 5. brillo sobre el escudo
    await espera(260);
    anim('.in-brillo', [{ opacity: 1, backgroundPosition: '150% 0' }, { opacity: 1, backgroundPosition: '-50% 0', offset: .85 }, { opacity: 0, backgroundPosition: '-50% 0' }], { duration: 1000, easing: 'cubic-bezier(.45,0,.2,1)' });
    // 6. línea de VAR
    await espera(320);
    anim('.in-sub', [{ opacity: 0, letterSpacing: '.7em', transform: 'translateY(8px)' }, { opacity: 1, letterSpacing: '.32em', transform: 'none' }], { duration: 900 });

    // 7. espera a que la página esté lista (mínimo 2,6 s en total) y abre
    await Promise.all([listo, espera(Math.max(0, 2600 - (performance.now() - t0)))]);
    objetivo = 100;
    anim('.in-logo', [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }], { duration: 500 });
    await espera(420);
    salir();
  }

  function salir() {
    if (intro.classList.contains('in-sale')) return;
    terminado = true;
    try { sessionStorage.setItem('sp:intro', '1'); } catch { /* sin almacenamiento */ }
    intro.classList.add('in-sale');
    anim('.in-costura', [{ opacity: 0 }, { opacity: 1, offset: .35 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' });
    setTimeout(() => intro.classList.add('in-abre'), reduce ? 0 : 200);
    setTimeout(() => {
      intro.remove(); html.classList.remove('intro-on');
      document.dispatchEvent(new Event('sp:intro-fin'));
    }, reduce ? 700 : 1300);
  }

  $('#in-saltar')?.addEventListener('click', salir);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') salir(); });
  addEventListener('resize', () => { if (!terminado) medir(); });
  correr();
})();
