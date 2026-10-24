// Equivalencias de talla (la numeración COL/EUR/USA coincide con la de los proveedores de la tienda)
'use strict';
SP.TALLAS = [
  { cm: 23.8, col: 36, eur: 38, us: 6, uk: 5 },
  { cm: 24.5, col: 37, eur: 39, us: 6.5, uk: 6 },
  { cm: 25.1, col: 38, eur: 40, us: 7, uk: 6.5 },
  { cm: 25.9, col: 39, eur: 41, us: 8, uk: 7 },
  { cm: 26.5, col: 40, eur: 42, us: 8.5, uk: 7.5 },
  { cm: 27.3, col: 41, eur: 43, us: 9.5, uk: 8.5 },
  { cm: 27.9, col: 42, eur: 44, us: 10, uk: 9 },
  { cm: 28.6, col: 43, eur: 45, us: 11, uk: 10 },
  { cm: 29.4, col: 44, eur: 46, us: 12, uk: 11 },
];
// largo del pie → talla recomendada (con pie ancho se sube media talla, es decir, la siguiente)
SP.tallaPara = (cm, ancho = false) => {
  const i = SP.TALLAS.findIndex(t => t.cm >= cm - 0.15);
  const k = Math.min(SP.TALLAS.length - 1, (i < 0 ? SP.TALLAS.length - 1 : i) + (ancho ? 1 : 0));
  return SP.TALLAS[k];
};
