import { Navigate, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import BarrasDeEscena from '../componentes/BarrasDeEscena'
import { distribucion } from '../nucleo/agregar'
import { topeDeBarras } from '../nucleo/escala'
import { pasosDeOrden } from '../nucleo/paleta'
import { porcentaje, useIdioma } from '../locale'
import { AnioDelPaso } from './comun'
import { serieDeMedida } from './lectura'
import { FICHA, TEXTOS } from './textos/vacuna'

/**
 * La historia «La vacuna»: qué quedó de Sinovac en la memoria y en la opinión.
 *
 * Bloque 6 de la guía de contexto de ICLAC. Lo que se sostiene (registro en
 * `la documentación interna`):
 *
 * - quien dice haberla recibido es la misma proporción en las tres oleadas (`sinovac-recibio`);
 * - en 2025 la encuesta agrega «No recuerdo» y lo marca cerca de uno de cada seis: un nivel, sin
 *   comparación, porque la opción no existía antes;
 * - **la buena opinión cae entre quienes la recibieron**, y toda la caída está entre 2023 y 2024
 *   (`sinovac-buena`). Esto no está en la guía, que da `p11` por serie limpia: en 2023 solo la
 *   contestaba quien había recibido Sinovac, y sin fijar esa base la caída parecía el doble;
 * - quienes hubiesen preferido Pfizer o Moderna, con la misma base, no se mueven (`prefiere-pfizer`).
 *
 * **El componente calcula y compone; no escribe texto.** Toda la prosa, en los tres idiomas, está en
 * `textos/vacuna.tsx`, que recibe las cifras y las banderas en `Valores`.
 */

/** El código de «No recuerdo» en `p9`, la opción que 2025 agregó. */
const NO_RECUERDO = 4

export function HistoriaVacuna ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  const navegar = useNavigate()
  const idioma = useIdioma()
  const recibio = serieDeMedida(encuesta, 'sinovac-recibio')
  const buena = serieDeMedida(encuesta, 'sinovac-buena')
  const pfizer = serieDeMedida(encuesta, 'prefiere-pfizer')
  const p9 = encuesta.variables.find((v) => v.nombre === 'p9')

  const tonos = pasosDeOrden(encuesta.olas.length)
  const fmt = (v: number) => porcentaje(v, 1)

  if (!recibio || !buena || !pfizer || !p9) return <Navigate to="/" replace />

  const primeraOla = recibio.puntos[0].ola
  const ultimaOla = recibio.puntos[recibio.puntos.length - 1].ola
  const parejo = (s: NonNullable<typeof recibio>) => s.consecutivas.every((c) => c.p >= 0.05) && (s.punta?.p ?? 0) >= 0.05

  // La respuesta de la última oleada, con «No recuerdo» incluido: es la cifra que la serie deja fuera.
  // Por código (4 en `p9`), no por la etiqueta.
  const reparto = distribucion(encuesta.casos.filter((c) => Number(c.ola) === ultimaOla), p9)
  const noRecuerda = reparto.segmentos.find((s) => s.codigo === NO_RECUERDO) ?? null

  const buenaCae = Boolean(buena.punta && buena.punta.p < 0.05 && buena.punta.diferencia < 0)
  const [primerTramo, segundoTramo] = buena.consecutivas
  const t = TEXTOS[idioma]({
    primeraOla,
    ultimaOla,
    recibio: recibio.puntos,
    buena: buena.puntos,
    pfizer: pfizer.puntos,
    primerTramo: primerTramo ?? null,
    noRecuerda: noRecuerda ? { porcentaje: noRecuerda.porcentaje, n: noRecuerda.n, base: reparto.base } : null,
    recuerdoQuieto: parejo(recibio),
    tresDeCuatro: recibio.puntos.every((p) => p.valor >= 70 && p.valor < 80),
    buenaCae,
    todoEnElPrimerAnio: buenaCae && Boolean(primerTramo && primerTramo.p < 0.05 && segundoTramo && segundoTramo.p >= 0.05),
    pfizerQuieto: parejo(pfizer),
    rangoPfizer: [Math.floor(Math.min(...pfizer.puntos.map((p) => p.valor))), Math.ceil(Math.max(...pfizer.puntos.map((p) => p.valor)))],
  })
  const ficha = FICHA[idioma]

  const topeRecuerdo = topeDeBarras(recibio.puntos.map((p) => p.valor))
  const topeOpinion = topeDeBarras([...buena.puntos, ...pfizer.puntos].map((p) => p.valor))

  // La clave de cada barra no depende del idioma; el rótulo sí.
  const barrasDeSerie = (
    serie: NonNullable<typeof recibio>,
    clave: string,
    prefijo: string,
    encendida: (i: number) => boolean,
    marca?: number,
  ) => serie.puntos.map((p, i) => ({
    clave: `${clave}-${p.ola}`,
    etiqueta: prefijo ? `${prefijo} ${p.ola}` : String(p.ola),
    valor: p.valor,
    n: p.n,
    color: tonos[i],
    encendida: encendida(i),
    marca: marca === i,
  }))

  return (
    <CapaRecorrido
      abierta={abierta}
      alCerrar={() => { navegar('/') }}
      salida={t.salida}
      metodo="metodo-vacuna"
      titulo={ficha.nombre}
    >
      {(raiz) => (
        <>
          <Portada raiz={raiz} titulo={ficha.pregunta}>
            <img
              src={`${import.meta.env.BASE_URL}icons/iclac.webp`}
              alt="ICLAC"
              className="logo-portada h-12 w-auto object-contain"
            />
            <h2 className="pregunta-portada my-auto max-w-[22ch] text-balance font-display text-[34px] font-semibold leading-[1.12] text-gray-900">
              {ficha.pregunta}
            </h2>
          </Portada>

          {/* Escena 1: el recuerdo. La opción nueva de la última oleada («No recuerdo») va en la
              nota y no en la figura: decisión de Felipe, 21-09-2026. */}
          <Escena
            indice={1}
            raiz={raiz}
            dosColumnas
            titulo={t.titularRecuerdo}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={t.frasesRecuerdo}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                filas={barrasDeSerie(recibio, 'recibio', '', (i) => reducido || activo > 0 || i === 0, !reducido && activo === 0 ? 0 : undefined)}
                max={topeRecuerdo}
                formato={fmt}
                descripcion={t.descripcionRecuerdo}
                rotulo={t.rotuloRecuerdo}
                unidadEje={t.ejeRecuerdo}
              />
            )}
            nota={<p className="text-xs leading-snug text-gray-500">{t.notaRecuerdo}</p>}
          />

          <Respiro raiz={raiz} indice={-1} titulo={t.respiro.titulo}>
            {t.respiro.cuerpo}
          </Respiro>

          {/* Escena 2: la opinión de quienes la recibieron, y en el último paso la preferencia por
              otra vacuna, con la misma base y el mismo eje. */}
          <Escena
            indice={2}
            raiz={raiz}
            dosColumnas
            titulo={t.titularOpinion}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={Math.min(activo, encuesta.olas.length - 1)} />
            )}
            frases={t.frasesOpinion}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                max={topeOpinion}
                formato={fmt}
                descripcion={t.descripcionOpinion}
                rotulo={t.rotuloOpinion}
                unidadEje={t.ejeOpinion}
                filas={[
                  ...barrasDeSerie(buena, 'buena', t.barraBuena, (i) => reducido || i <= activo, !reducido && activo <= 2 ? activo : undefined),
                  ...barrasDeSerie(pfizer, 'pfizer', t.barraPfizer, () => reducido || activo >= 3),
                ]}
              />
            )}
            nota={<p className="text-xs leading-snug text-gray-500">{t.notaOpinion}</p>}
          />

          <Cierre
            raiz={raiz}
            titulo={ficha.nombre}
            frases={[
              { escena: 1, texto: t.titularRecuerdo },
              { escena: 2, texto: t.titularOpinion },
            ]}
          />
        </>
      )}
    </CapaRecorrido>
  )
}
