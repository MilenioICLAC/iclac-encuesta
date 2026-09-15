#!/usr/bin/env node
// Copia un laboratorio de `laboratorio/` a `public/` con su `<head>`, para servirlo con
// `npm run dev`: `node scripts/laboratorio.mjs laboratorio/<tema>.html public/laboratorio-<tema>.html`.
// El método está en la skill `laboratorio`.
//
// **El `<head>` va acá porque sin `meta viewport` el teléfono dibuja a 980 px** y todo se sale por
// la derecha (medido el 07-09-2026). La fuente no lo trae porque nació para publicarse como
// artefacto, que pone su propio `<head>`; ya no se publica así, pero la fuente sigue sin él.

import { readFileSync, writeFileSync } from 'node:fs'
const fuente = process.argv[2]
const salida = process.argv[3] ?? 'public/laboratorio.html'

if (!fuente) {
  console.error('Uso: node scripts/laboratorio.mjs <archivo del laboratorio> [salida]\n' +
    'La fuente es un HTML de laboratorio/ sin <head>; acá se le pone para servirlo desde public/.')
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
