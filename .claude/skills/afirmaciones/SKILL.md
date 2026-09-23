---
name: afirmaciones
description: Reglas para que una frase, titular, pie o cifra del visualizador ICLAC afirme solo lo que los datos sostienen, con contrastes entre oleadas (permutación, bootstrap, estandarizada), cortes de escalas ordinales, preguntas de elección única, particiones que suman 100 y regresiones. Se usa al escribir o cambiar un texto con un número o una comparación, al tocar `scripts/lib/contraste.mjs`, `scripts/lib/contrastes.mjs` o sus pruebas, y al responder si una diferencia es real.
---

# Afirmaciones: qué puede decir el visualizador

Las reglas que no caducan. Qué frase publicada estaba mal y cómo se midió cada una: un registro de decisiones interno, en
`la documentación interna`.

## Lo que no se negocia

- **El recorrido solo afirma lo que pasa el contraste.** `scripts/contrastes.test.mjs` falla si una
  frase se queda sin sustento con una oleada nueva. Una afirmación nueva lleva su medida en
  `scripts/lib/contrastes.mjs` y su prueba. **Una prueba que consulta el agregado no sostiene una
  afirmación sobre sus partes.**
- **Nada de esto es margen de error.** La muestra es un panel en línea por cuotas, sin ponderadores
  (hecho 2 de `CLAUDE.md`). Los contrastes comparan oleadas entre sí; no estiman a Chile. Se escribe
  «las personas encuestadas», nunca «los chilenos».
- **Las cifras se calculan, no se transcriben.** Un número escrito a mano envejece con la oleada
  siguiente. Y un número que aparece en la frase y en la figura se redondea igual en las dos.
- **Una diferencia se afirma si pasa tres cosas:** p nominal bajo 0,05, el intervalo sin cruzar el
  cero y, si la prueba es de una familia, Holm bajo 0,05 en cada familia (`firme` en
  `src/nucleo/prueba.ts`; Felipe, 23-09-2026). Si no, se dice «parejos»: no se elige ganador por el
  signo del promedio, y si la figura muestra promedios distintos, la nota dice de dónde sale. Las
  historias y «Sobre los datos» leen el mismo criterio y no pueden contradecirse.
- **Holm vive en el ETL, no en la historia.** Las familias están en `FAMILIAS`
  (`scripts/lib/contrastes.mjs`) y cada prueba trae `holm: [{ familia, p }]`; se lee con `corregido`,
  que devuelve `NaN` si falta y así no deja afirmar nada. Una familia nueva se declara ahí y en
  `DECLARADAS` de `scripts/contrastes.test.mjs`, antes de mirar la cifra; si se fijó después, va
  `exploratoria: true`.
- **Una cifra que el lector no puede calibrar es relleno.** «Ninguno se distingue del ruido» en vez
  de «ninguno se movió más de 1,0 puntos».

## Cómo se contrasta una diferencia entre oleadas

La maquinaria está en `scripts/lib/contraste.mjs` y las comparaciones publicadas en
`scripts/lib/contrastes.mjs` (`MEDIDAS`, `BRECHAS`, `GRUPOS`, `REGRESIONES`, `TRANSVERSAL`, `FAMILIAS`). El ETL
las deja en `public/data/encuesta.json`, bajo `contrastes`. Cada diferencia viaja con tres cosas:

1. **El `p` de una permutación** de 10.000 rondas: se baraja la etiqueta de año. Solo supone que el
   año es intercambiable entre estas respuestas. **No se usa t de Student:** supone muestras
   aleatorias del país y se lee como margen de error.
2. **Un intervalo bootstrap** al 95 %, por percentiles.
3. **La misma diferencia con la composición de edad y sexo fija** (`estandarizada`), que separa «la
   gente piensa distinto» de «contestó otra gente».

Y cuatro detalles de implementación:

- **Donde la misma persona contesta por los dos lados, la resta va dentro del caso** y el contraste
  es de signo (`permutacionPareada`): termómetro China menos Estados Unidos, `p24`/`p25` y `p26`.
- **El `p` se publica como `(extremos + 1) / (rondas + 1)`.** El piso es 0,0001; nunca «p = 0».
- **El generador es `mulberry32` con `Math.imul`**, con semilla fija. El congruencial clásico pasa de
  2^53 en JavaScript y deja de ser uniforme.
- **No es un panel.** Las oleadas son tres reclutamientos distintos del mismo panel en línea, y 159
  panelistas aparecen en más de una (`olas_panelista`): no se sigue a nadie de una oleada a otra.

## Escalas ordinales: el corte cambia la conclusión

Con `p24`/`p25`, confianza en China y en Estados Unidos:

| | China 2023 → 2025 | EE. UU. 2023 → 2025 | ¿China arriba? |
|---|---|---|---|
| Solo «mucha» | 10,8 → 22,7 | 13,3 → 17,1 | recién en 2025 |
| «Mucha» + «algo» | 53,0 → 71,8 | 47,9 → 50,7 | ya en 2023 |

- **Mejor que elegir un corte es no elegir:** las cuatro categorías a los dos lados de un cero común
  (`src/componentes/Divergente.tsx`), con los colores amarrados a la etiqueta en `SEMANTICOS`.
- **Si la figura resume, declara el corte en el pie**, y si la conclusión cambia con el corte, lo
  dice.
- **Cuando una escena usa más de un recorte, cada número nombra el suyo.**
- **La comparación más firme es dentro del caso, en escalones** (`ESCALON` en
  `src/nucleo/confianza.ts`). Hay que recodificar antes de restar: 1 es «Mucha», 3 es «Poca» y 99 es
  «Ninguna».
- **Con «mucha o algo», la confianza en China nunca cruza a la de Estados Unidos:** ya iba arriba en
  2023, así que «las tres preguntas se dan vuelta» es falso.

## Elección única: la ventaja va dentro de la persona

Quien marca «China» no está marcando «Estados Unidos», y restar dos proporciones tira esa
dependencia. Va +100, −100 o 0 por persona, con prueba de signo (`ventaja-china-p26` en `BRECHAS`):

| Oleada | Ventaja de China | IC 95 % | p |
|---|---|---|---|
| 2023 | −6,63 | [−10,24; −3,01] | 0,0007 |
| 2024 | −7,19 | [−10,93; −3,44] | 0,0003 |
| 2025 | +4,40 | [+1,39; +7,33] | 0,0032 |

## Particiones que suman 100

- **Lo que gana una categoría lo pierden las otras por definición.** «La ventaja de China se la saca
  al empate» es aritmética, no un hallazgo; y como no es panel, tampoco se sabe quién se movió.
- **Se dice de qué tramo sale el cambio.** En `p24`/`p25` las tres partes se mueven entre 2024 y
  2025, pero en la serie completa Estados Unidos no (−3,24, p = 0,102).

## Ya se midió y no se sostiene: no volver a proponerlo

- **«La mayoría no alineada se erosiona, y lo que pierde se va a China»** (`p26`). El no alineamiento
  pierde 5,0 puntos y China gana 8,0. Ninguna de sus dos categorías (`distancia-ambos`,
  `relacionarse-ambos`) se mueve sola en ninguna de sus seis comparaciones, y el agregado cae en la
  serie completa (−5,0, p = 0,02) pero en ningún tramo consecutivo.
- **«El alza de China la lleva tal grupo».** Quién la lleva cambia con el corte del termómetro. Lo
  robusto a los cuatro cortes probados: quienes tienen mejor opinión de Estados Unidos no se movieron
  (todos con p > 0,66), y dos tercios del alza se sostienen con la composición fija.
- **El gradiente ideológico de 2023 (`C17`).** Por tramos ninguna oleada se distingue del ruido.
  Sobre la escala entera, la pendiente de 2023 (−1,42, p = 0,015) la sostiene el punto 10, con
  treinta personas: sin él queda en −0,29 (p = 0,68). Lo publicable es que la posición política no
  ordena la opinión sobre China.
- **Las tres preguntas que comparan a China con Estados Unidos no son tres testigos.** Termómetro,
  confianza y `p26` coinciden de signo entre el 85 % y el 94 % por persona: dicen que el hallazgo es
  consistente, no lo multiplican por tres.

## Regresión y apalancamiento

`h = 1/n + (x − x̄)² / Σ(x − x̄)²`, y sobre la pendiente pesa `n·(x − x̄)² / Σ(x − x̄)²`. **La
fragilidad es incertidumbre por peso:** pocos casos en el borde son un problema, en el centro no.
Los intervalos van por bootstrap, porque el termómetro no es normal (el 18 % responde 100). Contar
en el recorrido que se retira un punto solo vale si **el retiro da vuelta la conclusión**.

## Ponderadores: medidos y descartados

Rastrillar por región deja un efecto de diseño de 1,6, baja la muestra efectiva de 2025 de 1.227 a
775, mueve los niveles 1,5 puntos o menos y **no cambia ninguna afirmación**. Ponderar corrige el
nivel, no la tendencia, y tampoco habilita margen de error. Si ICLAC lo pide igual: región × sexo ×
edad, como columna de la descarga y con el n efectivo a la vista.

## Contrastar contra las fuentes del cliente

- **Una cifra suelta no discrimina:** hace falta la distribución completa.
- **Una sola fuente tampoco:** antes de cerrar, se pregunta qué otra cosa del cliente responde lo
  mismo (hecho 6 de `CLAUDE.md`).
- **Se verifica contra los datos, nunca contra el libro de códigos.**
