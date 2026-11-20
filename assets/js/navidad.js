// Temporada de Navidad: nieve suave sobre la página y esferas colgando en las portadas de Torneo, Tienda y Guía.
// Solo corre si <html> tiene la clase "navidad" (la pone el <head> de cada página según la fecha). No toca datos.
'use strict';
(() => {
  if (!document.documentElement.classList.contains('navidad')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ───────── esferas: roja, balón, dorada y verde (la roja solo en PC) ─────────
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <radialGradient id="nv-rojo" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#FF7A88"/><stop offset=".5" stop-color="#D3172F"/><stop offset="1" stop-color="#6E0819"/></radialGradient>
    <radialGradient id="nv-oro" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#FFF1C4"/><stop offset=".5" stop-color="#F2C14E"/><stop offset="1" stop-color="#9C6A18"/></radialGradient>
    <radialGradient id="nv-verde" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#6FE3A0"/><stop offset=".5" stop-color="#1E8A50"/><stop offset="1" stop-color="#0A3B22"/></radialGradient>
    <radialGradient id="nv-balon" cx=".38" cy=".32" r=".78"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".65" stop-color="#E9EDF5"/><stop offset="1" stop-color="#9AA4BA"/></radialGradient>
    <linearGradient id="nv-tapa" x1="0" x2="1"><stop offset="0" stop-color="#9C6A18"/><stop offset=".45" stop-color="#FFE3A1"/><stop offset="1" stop-color="#C8922A"/></linearGradient>
    <clipPath id="nv-bola"><circle cx="20" cy="28" r="18"/></clipPath></defs></svg>`;
  const tapa = '<circle cx="20" cy="3.2" r="2.4" fill="none" stroke="#F2C14E" stroke-width="1.4"/><rect x="15" y="5" width="10" height="6" rx="1.6" fill="url(#nv-tapa)"/>';
  const brillo = '<ellipse cx="13" cy="21" rx="3.6" ry="6" fill="#fff" opacity=".32" transform="rotate(32 13 21)"/>';
  const ESFERA = {
    rojo: `<circle cx="20" cy="28" r="18" fill="url(#nv-rojo)"/><path d="M2.6 25.5Q20 32 37.4 25.5" fill="none" stroke="#F2C14E" stroke-width="1.8" opacity=".9"/><path d="M3.2 31.5Q20 38 36.8 31.5" fill="none" stroke="#F2C14E" stroke-width="1.2" opacity=".7"/>${brillo}`,
    oro: `<circle cx="20" cy="28" r="18" fill="url(#nv-oro)"/><path d="M20 19.5l2.1 6.3h6.6l-5.3 3.9 2 6.3-5.4-3.9-5.4 3.9 2-6.3-5.3-3.9h6.6z" fill="#fff" opacity=".55"/>${brillo}`,
    verde: `<circle cx="20" cy="28" r="18" fill="url(#nv-verde)"/><g fill="#F2C14E"><circle cx="8" cy="27" r="1.6"/><circle cx="14" cy="29.4" r="1.6"/><circle cx="20" cy="30" r="1.6"/><circle cx="26" cy="29.4" r="1.6"/><circle cx="32" cy="27" r="1.6"/></g>${brillo}`,
    balon: `<circle cx="20" cy="28" r="18" fill="url(#nv-balon)"/><g clip-path="url(#nv-bola)" fill="#1B1F2E"><polygon points="20.00,22.40 25.33,26.27 23.29,32.53 16.71,32.53 14.67,26.27"/><polygon points="20.00,17.80 14.67,13.93 16.71,7.67 23.29,7.67 25.33,13.93"/><polygon points="29.70,24.85 31.74,18.59 38.32,18.59 40.35,24.85 35.03,28.72"/><polygon points="26.00,36.25 32.58,36.25 34.61,42.51 29.29,46.38 23.96,42.51"/><polygon points="14.00,36.25 16.04,42.51 10.71,46.38 5.39,42.51 7.42,36.25"/><polygon points="10.30,24.85 4.97,28.72 -0.35,24.85 1.68,18.59 8.26,18.59"/></g><path d="M20 22.4V17.8M25.33 26.27l4.37-1.42M23.29 32.53l2.71 3.72M16.71 32.53 14 36.25M14.67 26.27 10.3 24.85" stroke="#1B1F2E" stroke-width="1.1"/><circle cx="20" cy="28" r="18" fill="none" stroke="#C8102E" stroke-width="1.2" opacity=".5"/>${brillo}`,
  };
  // x = posición, l = largo del hilo, s = ancho; todas terminan arriba del texto de la portada
  const COLGADAS = [
    { tipo: 'rojo', x: '66%', l: 22, s: 40, t: 5.4, d: -1.2, pc: true },
    { tipo: 'balon', x: '75%', l: 40, s: 50, t: 6.2, d: -3 },
    { tipo: 'oro', x: '84%', l: 12, s: 36, t: 4.8, d: -2.1 },
    { tipo: 'verde', x: '92%', l: 30, s: 42, t: 5.8, d: -.4 },
  ];
  document.querySelectorAll('.page-hero').forEach(h => {
    h.insertAdjacentHTML('afterbegin', `<div class="nv-esferas" aria-hidden="true">${DEFS}${COLGADAS.map(e =>
      `<span class="nv-esfera${e.pc ? ' solo-pc' : ''}" style="--x:${e.x};--l:${e.l}px;--s:${e.s}px;--t:${e.t}s;--d:${e.d}s"><svg viewBox="0 0 40 46">${tapa}${ESFERA[e.tipo]}</svg></span>`).join('')}</div>`);
  });

  // ───────── las luces se esconden cuando una barra pegada (filtros, secciones del torneo, galería) queda justo bajo la cabecera ─────────
  let tic = false;
  const revisar = () => {
    tic = false;
    const nb = document.getElementById('nav')?.getBoundingClientRect().bottom || 0;
    document.body.classList.toggle('nv-pegado', [...document.querySelectorAll('.toolbar, .subnav, .pd-gal')].some(el => { const r = el.getBoundingClientRect(); return r.height && r.top <= nb + 20 && r.bottom > nb; }));
  };
  addEventListener('scroll', () => { if (!tic) { tic = true; requestAnimationFrame(revisar); } }, { passive: true });
  revisar();

  // ───────── nieve: copos suaves que caen despacio (no se puede tocar ni tapa botones) ─────────
  if (reduce) return;
  const lienzo = document.createElement('canvas');
  lienzo.className = 'nv-nieve';
  lienzo.setAttribute('aria-hidden', 'true');
  document.body.appendChild(lienzo);
  const cx = lienzo.getContext('2d');
  // un copo difuminado que se reutiliza (más barato que dibujar degradados en cada cuadro)
  const copo = document.createElement('canvas');
  copo.width = copo.height = 32;
  const g = copo.getContext('2d'), rg = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.45, 'rgba(255,255,255,.85)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 32, 32);

  let W = 0, H = 0, copos = [];
  const nuevo = arriba => {
    const grande = Math.random() < .14, r = grande ? 2.6 + Math.random() * 1.8 : .9 + Math.random() * 1.5;
    return { x: Math.random() * W, y: arriba ? -12 : Math.random() * H, r, v: 16 + r * 8 + Math.random() * 14, a: grande ? .3 + Math.random() * .25 : .45 + Math.random() * .45, f: Math.random() * 6.28, w: .5 + Math.random(), amp: 8 + Math.random() * 22 };
  };
  function medir() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(55, Math.max(18, W * H / 26000)));
    while (copos.length < n) copos.push(nuevo(false));
    copos.length = n;
  }
  let antes = 0, corriendo = false;
  function cuadro(t) {
    if (!corriendo) return;
    const dt = Math.min(.05, (t - (antes || t)) / 1000); antes = t;
    cx.clearRect(0, 0, W, H);
    for (const p of copos) {
      p.y += p.v * dt; p.f += p.w * dt;
      if (p.y - p.r * 2 > H) Object.assign(p, nuevo(true));
      const x = p.x + Math.sin(p.f) * p.amp, d = p.r * 4;
      cx.globalAlpha = p.a;
      cx.drawImage(copo, x - d / 2, p.y - d / 2, d, d);
    }
    requestAnimationFrame(cuadro);
  }
  const arrancar = () => { if (corriendo || document.hidden) return; corriendo = true; antes = 0; requestAnimationFrame(cuadro); };
  medir(); arrancar();
  addEventListener('resize', medir);
  document.addEventListener('visibilitychange', () => { if (document.hidden) corriendo = false; else arrancar(); });
})();
