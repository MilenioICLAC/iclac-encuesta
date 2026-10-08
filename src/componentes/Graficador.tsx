import { useMemo } from 'react'
import type { Encuesta, Pregunta } from '../nucleo/tipos'
import { corteDe } from '../nucleo/modulos'
import { corteEnFrase, enunciadoEn, formaDeFigura, modelo, textoExplorador as t, tituloEn, vistaPosible, type Modelo, type Vista } from '../nucleo/explorador'
import FiguraExplorador from './FiguraExplorador'
import { lista, numero, plural, traducido, useIdioma } from '../locale'

/**
 * El explorador: cualquier pregunta del instrumento, para consultar. Las historias afirman; esto no.
 *
 * **Qué pregunta se ofrece y cómo se muestra lo decide el catálogo** (`encuesta.preguntas`, armado
 * en `scripts/lib/preguntas_explorador.mjs` y validado contra los datos en cada ETL): título
 * legible, orden de las categorías, y en qué oleadas se hizo la misma pregunta. Acá no se infiere
 * nada del diccionario.
 *
 * Tres estados, una sola figura (`nucleo/explorador.ts`): una oleada; una oleada con corte; y
 * «Entre oleadas», que pone una fila por oleada **sin sumar ninguna** (Felipe, 22-09-2026). Entre
 * oleadas el corte no se aplica, y la barra de estado lo muestra apagado.
 *
 * Los controles, pregunta incluida, y el título del explorador viven en `BarraEstado`, pegada arriba.
 *
 * El estado vive en `App`, y la dirección lo refleja (`/explorar?p=p7&vista=serie`): así sobrevive
 * al cambio de vista y se puede mandar un enlace a una pregunta en un estado exacto.
 */

interface Props {
  encuesta: Encuesta
  pregunta: string
  vista: Vista
  ola: number
  onOla: (ola: number) => void
  corte: string | null
  soloIndependientes: boolean
}

export default function Graficador ({
  encuesta, pregunta: id, vista: pedida, ola, onOla, corte, soloIndependientes,
}: Props) {
  const p = encuesta.preguntas.find((x) => x.id === id) ?? encuesta.preguntas[0]
  const vista = vistaPosible(p, pedida)
  const estado = { vista, ola, corte, soloIndependientes }
  // El modelo trae los rótulos ya traducidos: el idioma va en las dependencias.
  const idioma = useIdioma()
  const m: Modelo = useMemo(() => modelo(encuesta, p, estado), [encuesta, p, vista, ola, corte, soloIndependientes, idioma]) // eslint-disable-line react-hooks/exhaustive-deps

  const noEnOla = vista === 'ola' && !p.olas.includes(ola)
  const corteFuera = vista === 'ola' && corte !== null && (p.sinCortes ?? []).includes(corte)
  const etiquetaCorte = corteDe(corte) ? corteEnFrase(traducido(corteDe(corte)!.etiqueta)) : ''
  const olasSerie = p.serie ? lista(p.serie.olas.map(String)) : ''

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-6">
      <article className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-display text-base font-semibold text-balance">{tituloEn(p, estado)}</h3>
        <p className="mt-1 max-w-3xl text-xs leading-snug text-gray-500">{t('nota.comillas', { texto: enunciadoEn(p, estado) })}</p>

        {vista === 'serie' && p.serie && (
          <p className="mt-2 text-xs text-gray-600">
            {t(formaDeFigura(m) === 'mancuerna' ? 'nota.unPunto' : 'nota.unaBarra', { olas: olasSerie })}
            {/* `p4`: Boric no existe en 2025 ni Jara antes. */}
            {m.forma === 'porcentajes' && m.bloques.some((b) => b.filas.some((f) => f.valor === null && f.base > 0)) && t('nota.categoriaNueva')}
            {p.abierta && t('nota.palabras', { n: p.abierta.palabras === 10 ? t('nota.diez') : numero(p.abierta.palabras) })}
            {corte && t('nota.corteSerie')}
          </p>
        )}
        {p.abierta && m.forma === 'porcentajes' && m.compara === 'grupos' && m.bloques.some((b) => b.filas.some((f) => f.valor === null && f.base > 0)) && (
          <p className="mt-2 text-xs text-gray-600">{t('nota.sinPunto', { minimo: numero(p.abierta.minimo) })}</p>
        )}
        {corteFuera && (
          <p className="mt-2 text-xs text-gray-600">{t('nota.corteFuera', { corte: etiquetaCorte })}</p>
        )}

        {noEnOla
          ? (
            <div className="mt-3 text-sm text-gray-600">
              <p>{t('vacia.noSeHizo', { ola })}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2">
                {t('vacia.seHizoEn')}
                {p.olas.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onOla(o)}
                    className="rounded-md border border-gray-300 px-2 py-0.5 tabular-nums text-brand-dark transition-transform duration-150 ease-out hover:bg-gray-50 active:scale-[0.97]"
                  >
                    {o}
                  </button>
                ))}
              </p>
            </div>
            )
          : <FiguraExplorador modelo={m} />}

        <Pie p={p} vista={vista} ola={ola} modelo={m} encuesta={encuesta} noEnOla={noEnOla} />
      </article>
    </section>
  )
}

function Pie ({ p, vista, ola, modelo: m, encuesta, noEnOla }: { p: Pregunta, vista: Vista, ola: number, modelo: Modelo, encuesta: Encuesta, noEnOla: boolean }) {
  const aviso = p.advertencia ? encuesta.contrastes?.medidas.find((x) => x.id === p.advertencia)?.advertencia : undefined
  const advertencia = aviso ? traducido(aviso) : undefined
  const deLaPoblacion = (vista === 'ola' ? p.poblacionPorOla?.[ola] : undefined) ?? p.poblacion
  const poblacion = deLaPoblacion ? traducido(deLaPoblacion) : undefined
  const base = !noEnOla && vista === 'ola' ? baseDe(m) : null

  const olasSerie = p.serie ? lista(p.serie.olas.map(String)) : ''
  // Si la oleada que se mira no entra en la comparación (`p4` en 2025), se dice, con la razón.
  const fueraDeLaSerie = Boolean(p.serie) && vista === 'ola' && !p.serie!.olas.includes(ola)
  const comparacion = p.serie
    ? fueraDeLaSerie ? t('pie.fueraDeSerie', { olas: olasSerie, ola }) : t('pie.seCompara', { olas: olasSerie })
    : p.olas.length === 1
      ? t('pie.soloEn', { ola: p.olas[0] })
      : p.sinSerie ? traducido(p.sinSerie) : t('pie.noSeCompara')

  const notas = [
    poblacion,
    (vista === 'serie' || fueraDeLaSerie) && p.serie?.nota ? traducido(p.serie.nota) : undefined,
    p.nota ? traducido(p.nota) : undefined,
    advertencia,
  ].filter((x): x is string => Boolean(x))

  return (
    <footer className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
      <p className="flex flex-wrap gap-x-2 gap-y-1">
        {base !== null && <span className="tabular-nums">{t(plural(base, { one: 'pie.respuestasEnUno', other: 'pie.respuestasEn' }), { n: numero(base), ola })}</span>}
        <span className={p.serie ? undefined : 'text-amber-700'}>{comparacion}</span>
      </p>
      {notas.map((n) => <p key={n} className="mt-1 max-w-3xl leading-snug">{n}</p>)}
    </footer>
  )
}

/** Respuestas efectivas de la figura de una oleada: sin corte es la de la única fila; con corte, la suma de los grupos. */
function baseDe (m: Modelo): number | null {
  if (m.forma === 'vacia') return null
  if (m.forma === 'medias') return m.filas.reduce((s, f) => s + f.base, 0)
  return m.bloques[0]?.filas.reduce((s, f) => s + f.base, 0) ?? null
}
