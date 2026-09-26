// El ícono de la app es el junco de la barra de avance, en verde oscuro (`src/componentes/junco.ts`,
// la única copia del dibujo). Escribe en `public/` el `.ico` de la pestaña, los PNG que piden iOS y
// el manifiesto, y el manifiesto. Los rasteriza Chromium (Playwright global, como
// `mirar_recorrido.mjs`).
//
//   node scripts/iconos.mjs
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JUNCO } from '../src/componentes/junco.ts'

const PUBLICO = new URL('../public/', import.meta.url)
const VERDE = '#00776E' // brand-dark, el verde oscuro de ICLAC (la barra sigue con el junco negro)

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

const svg = (lado, cuerpo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}">${cuerpo}</svg>\n`

/** Un `.ico` con cada tamaño guardado como PNG (Vista en adelante y todos los navegadores). */
function ico (imagenes) {
  const cabecera = Buffer.alloc(6 + 16 * imagenes.length)
  cabecera.writeUInt16LE(1, 2) // tipo: ícono
  cabecera.writeUInt16LE(imagenes.length, 4)
  let desde = cabecera.length
  imagenes.forEach(({ lado, png }, i) => {
    const o = 6 + 16 * i
    cabecera.writeUInt8(lado % 256, o) // ancho (0 = 256)
    cabecera.writeUInt8(lado % 256, o + 1) // alto
    cabecera.writeUInt16LE(1, o + 4) // planos
    cabecera.writeUInt16LE(32, o + 6) // bits por píxel
    cabecera.writeUInt32LE(png.length, o + 8)
    cabecera.writeUInt32LE(desde, o + 12)
    desde += png.length
  })
  return Buffer.concat([cabecera, ...imagenes.map((m) => m.png)])
}

const require = createRequire(import.meta.url)
const { chromium } = require(execFileSync('npm', ['root', '-g']).toString().trim() + '/playwright')
const navegador = await chromium.launch()
const pagina = await navegador.newPage()
async function png ({ lado, ancho, fondo }) {
  await pagina.setViewportSize({ width: lado, height: lado })
  await pagina.setContent(
    `<style>*{margin:0}svg{display:block;width:${lado}px;height:${lado}px}</style>` +
    svg(lado, junco({ lado, ancho, color: VERDE, fondo })),
  )
  return pagina.screenshot({ omitBackground: !fondo })
}

// La pestaña, como en mapa_FDI: un `.ico` de 16, 32 y 48 px, sin fondo, en un solo color con
// cualquier tema, y sin favicon SVG (Chrome y Firefox lo preferirían sobre el `.ico`).
const pestana = []
for (const lado of [16, 32, 48]) pestana.push({ lado, png: await png({ lado, ancho: lado - 1 }) })
writeFileSync(new URL('favicon.ico', PUBLICO), ico(pestana))

// Los de pantalla de inicio, sobre blanco (iOS rellena la transparencia con negro). El «maskable»
// deja el barco dentro del círculo seguro del 80 %.
const PNG = [
  { archivo: 'apple-touch-icon.png', lado: 180, ancho: 132, fondo: '#fff' },
  { archivo: 'icon-192.png', lado: 192, ancho: 150, fondo: '#fff' },
  { archivo: 'icon-512.png', lado: 512, ancho: 400, fondo: '#fff' },
  { archivo: 'icon-maskable-512.png', lado: 512, ancho: 300, fondo: '#fff' },
]
for (const p of PNG) writeFileSync(new URL(p.archivo, PUBLICO), await png(p))
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

console.log('iconos:', ['favicon.ico', ...PNG.map((p) => p.archivo), 'manifest.webmanifest'].join(', '))
