#!/usr/bin/env node
// Publica el laboratorio del recorrido como página suelta, para abrirlo en el teléfono sin el
// marco del artefacto: `node scripts/laboratorio.mjs && npm run dev`.
//
// **Existe por una diferencia que costó encontrar.** El archivo del laboratorio se escribe para
// el artefacto, y el artefacto lo envuelve en su propio `<head>`, que trae el `meta viewport`.
// Servido tal cual desde `public/`, ese `meta` no está: el navegador del teléfono cae a su
// viewport de 980 px, dibuja la página como si fuera de escritorio y todo se sale por la derecha.
// Medido con emulación de móvil el 07-09-2026: 980 px de ancho suelto contra 360 dentro del marco.
//
// El envoltorio va acá y no dentro del archivo del laboratorio porque el artefacto rechaza
// `<head>` propio: son dos destinos con dos envoltorios, y una sola fuente.

import { readFileSync, writeFileSync } from 'node:fs'
const fuente = process.argv[2]
const salida = process.argv[3] ?? 'public/laboratorio.html'

if (!fuente) {
  console.error('Uso: node scripts/laboratorio.mjs <archivo del laboratorio> [salida]\n' +
    'La fuente es el HTML que se publica como artefacto; acá solo se le pone el <head> que el\n' +
    'artefacto pone por su cuenta y que, servido suelto, falta.')
  process.exit(1)
}

const cuerpo = readFileSync(fuente, 'utf8')
const titulo = cuerpo.match(/<title>([^<]*)<\/title>/)?.[1] ?? 'Laboratorio'

writeFileSync(salida, `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
</head>
<body>
${cuerpo}
</body>
</html>
`, 'utf8')

console.log(`Laboratorio servible en ${salida} (fuente: ${fuente})`)
