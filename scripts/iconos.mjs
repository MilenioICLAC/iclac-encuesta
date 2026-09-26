// El ícono de la app es el junco de la barra de avance (`src/componentes/junco.ts`, la única copia
// del dibujo). Escribe en `public/` el SVG de la pestaña, los PNG que piden iOS y el manifiesto, y
// el manifiesto. Los PNG los rasteriza Chromium (Playwright global, como `mirar_recorrido.mjs`).
//
//   node scripts/iconos.mjs
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JUNCO } from '../src/componentes/junco.ts'

const PUBLICO = new URL('../public/', import.meta.url)
const NEGRO = '#111827' // gray-900, el mismo de la barra
const CLARO = '#F3F4F6' // gray-100, para la pestaña en tema oscuro

// Lo visible del junco (sin la caja vacía de arriba), medido sobre los trazados.
const VISIBLE = { x0: 1.2, x1: 39, y0: 1.8 - JUNCO.mastil / 2, y1: 26.8 }

/**
 * El junco centrado en un cuadrado de `lado`, con `ancho` de proa a popa. Los sables son cortes de
 * verdad (máscara), así el barco sirve sobre cualquier fondo.
 */
function junco ({ lado, ancho, color, fondo }) {
  const e = ancho / (VISIBLE.x1 - VISIBLE.x0)
  const tx = (lado - ancho) / 2 - VISIBLE.x0 * e
  const ty = (lado - (VISIBLE.y1 - VISIBLE.y0) * e) / 2 - VISIBLE.y0 * e
  const r = (n) => +n.toFixed(3)
  return [
    fondo ? `<rect width="${lado}" height="${lado}" fill="${fondo}"/>` : '',
    '<mask id="sables" maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="30">',
    '<rect width="40" height="30" fill="#fff"/>',
    `<path d="${JUNCO.sables}" stroke="#000" stroke-width="${JUNCO.sable}" fill="none" stroke-linecap="round"/>`,
    '</mask>',
    `<g transform="translate(${r(tx)} ${r(ty)}) scale(${r(e)})" fill="${color}">`,
    `<path d="${JUNCO.mastiles}" stroke="${color}" stroke-width="${JUNCO.mastil}" fill="none" stroke-linecap="round"/>`,
    `<path d="${JUNCO.velas}" mask="url(#sables)"/>`,
    `<path d="${JUNCO.casco}"/>`,
    '</g>',
  ].join('')
}

const svg = (lado, cuerpo, estilo = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}">${estilo}${cuerpo}</svg>\n`

// La pestaña: sin fondo, casi de borde a borde, y claro cuando el navegador está en tema oscuro.
writeFileSync(new URL('favicon.svg', PUBLICO), svg(
  40,
  junco({ lado: 40, ancho: 39, color: 'currentColor' }),
  `<style>svg{color:${NEGRO}}@media (prefers-color-scheme:dark){svg{color:${CLARO}}}</style>`,
))

// Los PNG: la pestaña de respaldo (sin fondo) y los de pantalla de inicio, sobre blanco (iOS rellena
// la transparencia con negro). El «maskable» deja el barco dentro del círculo seguro del 80 %.
const PNG = [
  { archivo: 'favicon-32.png', lado: 32, ancho: 31 },
  { archivo: 'apple-touch-icon.png', lado: 180, ancho: 132, fondo: '#fff' },
  { archivo: 'icon-192.png', lado: 192, ancho: 150, fondo: '#fff' },
  { archivo: 'icon-512.png', lado: 512, ancho: 400, fondo: '#fff' },
  { archivo: 'icon-maskable-512.png', lado: 512, ancho: 300, fondo: '#fff' },
]

const require = createRequire(import.meta.url)
const { chromium } = require(execFileSync('npm', ['root', '-g']).toString().trim() + '/playwright')
const navegador = await chromium.launch()
const pagina = await navegador.newPage()
for (const { archivo, lado, ancho, fondo } of PNG) {
  await pagina.setViewportSize({ width: lado, height: lado })
  await pagina.setContent(
    `<style>*{margin:0}svg{display:block;width:${lado}px;height:${lado}px}</style>` +
    svg(lado, junco({ lado, ancho, color: NEGRO, fondo })),
  )
  await pagina.screenshot({ path: new URL(archivo, PUBLICO).pathname, omitBackground: !fondo })
}
await navegador.close()

writeFileSync(new URL('manifest.webmanifest', PUBLICO), JSON.stringify({
  name: 'Encuesta de Percepciones sobre China en Chile',
  short_name: 'China en Chile',
  start_url: './',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#ffffff',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2) + '\n')

console.log('iconos:', ['favicon.svg', ...PNG.map((p) => p.archivo), 'manifest.webmanifest'].join(', '))
