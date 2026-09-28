import type { Idioma, Traducible } from '../../locale'

/**
 * La forma de los módulos de textos de las historias (`src/historias/textos/<id>.tsx`).
 *
 * Cada módulo exporta dos cosas, **con los tres idiomas como claves de primer nivel**:
 *
 * - `FICHA: Record<Idioma, FichaHistoria>`, lo que el menú, el cierre de la historia anterior y
 *   «Sobre los datos» dicen de ella sin calcular nada;
 * - `TEXTOS: Record<Idioma, (v: Valores) => Contenido>`, toda la prosa de la historia. `Valores` son
 *   las cifras y las banderas estadísticas que calcula el componente, una sola vez; `Contenido`, cada
 *   titular, frase, nota y descripción que la historia muestra. El componente calcula y compone; no
 *   escribe una palabra.
 *
 * `Record<Idioma, …>` exige los tres: si falta uno, `typecheck` falla. **Cada idioma empieza en una
 * línea `  es: `, `  en: ` o `  cn: `, con dos espacios**: así lo lee `scripts/historias.test.mjs`,
 * que vigila el vocabulario de cada idioma por separado.
 *
 * Las frases eligen su texto según las pruebas (`afirmaciones`): la condición va en `Valores`, y cada
 * idioma escribe las mismas ramas. Una traducción no afirma más que el español.
 */
export interface FichaHistoria {
  nombre: string
  pregunta: string
  /** Lo que la tarjeta del menú promete. Sin cifras: envejecería con la oleada siguiente. */
  hallazgo: string
}

/** La ficha de un módulo de textos, campo por campo, como la lee el registro (`indice.tsx`). */
export function fichaDe (f: Record<Idioma, FichaHistoria>): Record<keyof FichaHistoria, Traducible> {
  const campo = (k: keyof FichaHistoria): Traducible => ({ es: f.es[k], en: f.en[k], cn: f.cn[k] })
  return { nombre: campo('nombre'), pregunta: campo('pregunta'), hallazgo: campo('hallazgo') }
}
