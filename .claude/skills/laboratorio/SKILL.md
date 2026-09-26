---
name: laboratorio
description: Método para decidir la composición de algo visible del visualizador ICLAC (una escena, la portada, el cierre o una figura del explorador) antes de tocar el código, con un laboratorio HTML servido desde el servidor de desarrollo y el JSON que exporta. Se usa cuando Felipe pide opciones o «un laboratorio», cuando pide «hazme preguntas para pulir» sobre algo visual, y cuando pega un JSON con `"laboratorio": ...`.
---

# Laboratorio: la composición se decide mirando

Felipe decide composición mirándola, no leyendo un diff, y su respuesta llega como JSON exportado
desde el laboratorio. **En el recorrido es obligatorio** (portada, escenas, respiros, cierre); en el
explorador, para cualquier cambio de forma de una figura. Por qué existe y qué costó cada regla:
un registro de decisiones interno, en `la documentación interna`.

## Flujo

1. **Preguntas cortas** para fijar lo que ya se sabe. Lo decidido queda fijo en el laboratorio; lo
   abierto se vuelve parámetro.
2. **Se escribe el laboratorio, se verifica** (skill `verificar-navegador`) y se manda el enlace.
   **No se toca la app antes de recibir el JSON.**
3. **Llega el JSON y se aplica verbatim:** parámetro por parámetro y los textos copiados del JSON,
   no de memoria. La `nota` es un requerimiento más; si es ambigua, se decide lo razonable y se dice
   qué se decidió.
4. **Se verifica en la app**, en los mismos anchos, y se reporta con medidas.
5. **Al cerrar la decisión se poda:** queda solo lo que siga abierto, o se borra. Un panel que
   ofrece cambiar lo ya decidido termina mostrando composiciones que la app no tiene.

## Archivos

- **Fuente versionada:** `laboratorio/<tema>.html`, sin `<!doctype>`, `<html>` ni `<head>`: empieza
  con `<title>` y `<style>`. `scripts/laboratorio.mjs` le pone el `<head>` con el `meta viewport`
  (sin él, el teléfono dibuja a 980 px).
- **Script:** en `package.json`,
  `"lab:<tema>": "node scripts/laboratorio.mjs laboratorio/<tema>.html public/laboratorio-<tema>.html"`,
  y la salida en `.gitignore`: es herramienta, no producto.
- **Enlace:** `http://localhost:5180/laboratorio-<tema>.html` (la máquina Linux, por
  la red local; el servidor es `npm run dev`). El del recorrido, por ser el primero, es `laboratorio.html`.
- **No se publica como artefacto.** Un artefacto es de la cuenta que lo publica, y Felipe trabaja
  desde dos.
- **Plantilla:** `laboratorio/portada-recorrido.html` es el más reciente y trae todo lo de abajo.

## Lo que tiene que tener

- **Datos y textos reales.** Nada inventado: si una pieza no está hecha, un recuadro punteado que lo
  diga. Las cifras se leen de la app o de `public/data/encuesta.json`.
- **Fiel al código.** Colores, medidas y tipografía copiados de `src/index.css`,
  `src/componentes/CapaRecorrido.tsx`, `src/nucleo/paleta.ts` y el componente que corresponda.
  Raleway en 400 y 600, los mismos pesos que carga la app.
- **Presets con nombre:** «Propuesta» y «Como está la app», para ver la diferencia de un clic.
- **Parámetros guardados** en `localStorage` bajo una clave versionada (`lab-<tema>-v1`), **leídos
  por identificador y nunca por posición**, con `try/catch`.
- **Textos editables** con contador de caracteres, marcado pasados los 130.
- **Selector de ancho** con 360×640, 390×844, 768, 1512 y «Todo». «Todo» usa el alto entero de la
  ventana (`window.innerHeight`), igual que la capa `fixed inset-0`.
- **El umbral de escritorio va con container query** (`container-type: inline-size` en el visor):
  el visor no es la ventana, y una media query mentiría justo en el umbral. En la app sí va media
  query (`min-width: 900px`).
- **Medidas a la vista** en la barra del visor: lo que la decisión necesite (alto del bloque,
  espacio disponible, distancia al borde).
- **Exportación JSON** con `laboratorio`, `fecha`, `combinacion`, `parametros`, `textos`, `medida` y
  `nota`. Se copia al portapapeles y, si falla, queda el texto seleccionable.
- **Rótulos que dicen lo que hacen.** Un parámetro que en el estado actual no hace nada se saca del
  panel.
- **Movimiento reducido simulable** con un control, si la pieza se mueve.

## Lo que ya falló

- **El visor en 390 dentro de una ventana ancha no es una ventana de 390.** Se verifica también con
  la ventana real del navegador en 390.
- **Un navegador limpio no ve el defecto del almacenamiento.** Se prueba con el almacenamiento
  sucio, guardado por una versión anterior.
- **Cuando el código cambia, el laboratorio se pone al día**; si no, la comparación deja de serlo.
- **Cuando algo «se mueve solo», no se devuelve una causa sin medirla.**

## Inventario (15-09-2026)

Los de las frases y la pausa (22-09-2026) se cerraron y se borraron. Su técnica sirve de plantilla:
la app real dentro de un `iframe` del mismo servidor, y cada opción aplicada sobre su DOM o como CSS
inyectado. Las figuras, los textos y los anchos son los de verdad, sin copiar nada. El de la barra del
explorador (24-09-2026) la usó así: ocultó los controles de la app y leyó de ellos, ocultos, los
títulos por oleada y el N.

Cuando lo que se decide es una figura con datos que la app todavía no tiene, sirve la otra técnica
(laboratorio `abiertas`, 24-09-2026, cerrado y borrado; un registro de decisiones interno): un `laboratorio/<tema>.tsx` que
importa el componente real de `src/` (Vite transforma cualquier `.tsx` bajo la raíz) y le arma el
modelo con conteos agregados que genera un script aparte. La página necesita el preámbulo de
`@vitejs/plugin-react` a mano (`/@react-refresh` y `__vite_plugin_react_preamble_installed__`), y el
visor es la misma página con `?visor` dentro de un `iframe`, para que las media queries de la figura
vean el ancho simulado y no el de la ventana. El `.tsx` no entra en `npm run typecheck`: se
comprueba con un `tsconfig` temporal que lo incluya.

| Fuente | Script | Estado |
|---|---|---|
| `laboratorio/recorrido.html` | `npm run lab` | escenas del recorrido; sin revisar desde el 08-09 |
| `laboratorio/cierre-recorrido.html` | `npm run lab:cierre` | cerrado, falta podar |
| `laboratorio/portada-recorrido.html` | `npm run lab:portada` | cerrado, falta podar |
| `laboratorio/scroll-escritorio.html` | `npm run lab:scroll` | decidido y aplicado (25-09-2026): B (texto que corre, paso 0,4, frase al 80 %) y flechas; falta podar |
| `laboratorio/barra-barco.html` | `npm run lab:barco` | decidido y aplicado (25-09-2026) en `BarraDeAvance.tsx`: ola baja, tinta de 6 px en hebras, barco de 20 px; falta podar |
| `laboratorio/pausa-corta.html` | `npm run lab:pausa` | decidido y aplicado (25-09-2026): pausa quieta un paso, la escena siguiente sube 0,4, frase de la pausa que corre en escritorio, cortes de 4 px; falta podar |
| `laboratorio/sinan.html` | `npm run lab:sinan` | decidido y aplicado (25-09-2026) en `Sinan.tsx`: «Cuchara que baja» (Claude) en la portada, la misma sin círculo a 26 px en los botones (nota de Felipe; el tamaño lo eligió Claude, sin JSON), «Mango tendido» (Codex) en «→» y «↑» del cierre, no en las tarjetas del menú; falta podar. Variantes de Codex (gpt-6-astra) entre `CODEX:INICIO` y `CODEX:FIN`, iframe con la app |
| `laboratorio/cuchara-viaje.html` | `npm run lab:viaje` | decidido y aplicado (25-09-2026) en `Transicion.tsx` y `TarjetaHistoria.tsx`: cuchara de la portada a 28 px flotando juntas, bajo el título con brújula, pausa 150, división 450, escalón 60, curva marcada; falta podar. Tiene dos defectos propios que no están en la app (Codex): la cámara lenta no se restaura al terminar y Escape deja la capa hasta el tiempo límite. Informe de Codex con propuestas de diseño no aplicadas (curva que no cruce el título, tiempos más cortos, flotar solo al pasar) en el tmp de la sesión 3c624c56 |
| `laboratorio/tarjeta-cierre.html` | `npm run lab:tarjeta` | decidido (25-09-2026) sin JSON: Felipe pidió fusionar con la «Propuesta» (rótulo, nombre, 448 px); falta podar. Aplica la composición con estilos sobre la app real y sobre la copia de la transición (un registro de decisiones interno) |
| `laboratorio/la-encuesta.html` | `npm run lab:la-encuesta` | cerrado, falta podar: JSON aplicado el 24-09-2026 en `FichaTecnica.tsx` (la pestaña es «Ficha técnica»); se hizo sin iframe porque la pestaña no existía |
