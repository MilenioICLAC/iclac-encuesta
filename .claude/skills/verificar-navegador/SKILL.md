---
name: verificar-navegador
description: Cómo mirar y medir en un navegador de verdad (Playwright, ya instalado) cualquier cambio visible del visualizador ICLAC o de un laboratorio, antes de darlo por cerrado o de mandarle un enlace a Felipe. Se usa después de tocar componentes, CSS, escenas del recorrido, el explorador o un archivo de `laboratorio/`, y siempre que haya que afirmar que algo cabe, no se mueve, no se desborda o se alcanza.
---

# Verificar en el navegador

`typecheck`, `lint` y las pruebas no ven nada de lo visible. **Hay navegador en esta máquina**: antes
de decir que no, se busca. El 06-09-2026 se entregó sin mirar y los tres defectos que reportó el
cliente estaban en el primer render (un registro de decisiones interno).

## Arranque

- Servidor: `npm run dev` en segundo plano, puerto 5180. Comprobar con
  `curl -sI http://localhost:5180/ | head -1` antes de lanzar otro.
- Los scripts de medición van al scratchpad de la sesión, no al repositorio.
- Playwright global (1.62), sin ruta de navegador:

```js
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(execFileSync('npm', ['root', '-g']).toString().trim() + '/playwright')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
page.on('console', m => m.type() === 'error' && console.log('consola:', m.text()))
page.on('pageerror', e => console.log('error:', e.message))
await page.goto('http://localhost:5180/#/')
```

## Instrumentos que ya existen

- `node scripts/mirar_recorrido.mjs <ancho> [carpeta]`: abre la capa, la recorre y mide por cambio de
  frase el píxel de scroll, **el costo respecto del anterior** (tienen que salir iguales), escenas a la
  vista, ítems de leyenda y números rotulados. Deja capturas. **Apaga el imán** para no contaminar la
  geometría: el snap se verifica con un script propio y `mouse.wheel`.
- `node ~/.claude/bin/captura-web.mjs <url> --anchos 360,768,1512 [--completa]`: capturas por ancho y
  denuncia de desbordes medidos contra la caja de cada `<svg>` y el documento. Sirve para el explorador y
  los laboratorios.

## Anchos

| Ancho × alto | Por qué |
|---|---|
| 360 × 640 | teléfono chico y bajo; media query `max-height: 700px` |
| 375 × 667 | iPhone SE/8, alto útil corto |
| 390 × 844 | teléfono común, con `hasTouch` e `isMobile` (activa los textos táctiles) |
| 768 × 1024 | tablet |
| 899 y 901 | justo bajo y sobre el umbral de dos columnas (900) |
| 1512 × 945 | portátil |
| 1920 × 1080 | escritorio; se nota lo que se estira sin tope |

No hace falta correr los ocho para un cambio chico, pero **nunca uno solo**: lo que entra en uno se sale
del otro por veinte píxeles.

## Qué se mide, no se mira

- **Que quepa:** `getBoundingClientRect().bottom` del **último hijo** (suele ser el enlace o la nota)
  contra el alto de la capa, no el de la sección.
- **Que no se mueva:** el `top` del bloque de la figura y del titular tiene que dar el mismo número en
  todos los pasos de una escena.
- **Que no se desborde:** `scrollWidth > clientWidth` en el documento y en cada tarjeta.
- **Que sea legible:** tamaño de fuente calculado de números y rótulos, y contraste del texto sobre su
  relleno real.
- **Consola sin errores** ni advertencias de React.
- **Con movimiento reducido:** `page.emulateMedia({ reducedMotion: 'reduce' })`. La figura arranca
  completa, las frases no se superponen, sin pista ni imán.
- **Con teclado:** `PageDown` y flechas de punta a punta pasan por todos los pasos sin saltarse
  ninguno; `Tab` y `Shift+Tab` no escapan de la capa; `Escape` sale.
- **El imán con gestos de verdad:** `page.mouse.wheel(0, dy)` y esperar a que el scroll se asiente.
  `scrollTop = …` por código no dispara el snap igual que un gesto y contamina la medida.
- **Dos escenas seguidas, no una:** la superposición y el paso desparejo solo aparecen en la
  transición.

## Capturas

Se generan **y se abren** con Read. Una captura que nadie miró no verificó nada. Al reportar, se dan
medidas («la pregunta queda a 48 px del borde en 390×844»), no «se ve bien».

## Límites

- El emulador no reproduce la barra del navegador móvil (`svh`, colapso en Android) ni el `position:
  fixed` dentro de un marco. Eso se dice como no verificado, o se pide mirarlo en un teléfono.
- Si hay un agente Codex midiendo en paralelo y sus medidas contradicen una lectura del código, mandan
  sus medidas.
