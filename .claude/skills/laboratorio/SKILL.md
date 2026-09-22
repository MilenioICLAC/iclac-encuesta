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

| Fuente | Script | Estado |
|---|---|---|
| `laboratorio/recorrido.html` | `npm run lab` | escenas del recorrido; sin revisar desde el 08-09 |
| `laboratorio/cierre-recorrido.html` | `npm run lab:cierre` | cerrado, falta podar |
| `laboratorio/portada-recorrido.html` | `npm run lab:portada` | cerrado, falta podar |
