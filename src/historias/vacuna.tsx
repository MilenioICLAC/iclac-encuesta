import { Navigate, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import BarrasDeEscena from '../componentes/BarrasDeEscena'
import { distribucion } from '../nucleo/agregar'
import { topeDeBarras } from '../nucleo/escala'
import { pasosDeOrden } from '../nucleo/paleta'
import { decimal, numero, porcentaje } from '../locale'
import { AnioDelPaso } from './comun'
import { casosDe, serieDeMedida } from './lectura'

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
 */
export function HistoriaVacuna ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  const navegar = useNavigate()
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
  const reparto = distribucion(encuesta.casos.filter((c) => Number(c.ola) === ultimaOla), p9)
  const noRecuerda = reparto.segmentos.find((s) => /no recuerdo/i.test(s.etiqueta)) ?? null

  const recuerdoQuieto = parejo(recibio)
  const tresDeCuatro = recibio.puntos.every((p) => p.valor >= 70 && p.valor < 80)
  const buenaCae = Boolean(buena.punta && buena.punta.p < 0.05 && buena.punta.diferencia < 0)
  const [primerTramo, segundoTramo] = buena.consecutivas
  const todoEnElPrimerAnio = buenaCae && Boolean(primerTramo && primerTramo.p < 0.05 && segundoTramo && segundoTramo.p >= 0.05)
  const pfizerQuieto = parejo(pfizer)
  const rangoPfizer = [Math.floor(Math.min(...pfizer.puntos.map((p) => p.valor))), Math.ceil(Math.max(...pfizer.puntos.map((p) => p.valor)))]

  const titularRecuerdo = recuerdoQuieto && tresDeCuatro
    ? `Entre quienes recuerdan, tres de cada cuatro dicen haber recibido Sinovac, igual que en ${primeraOla}`
    : 'Cuántos dicen haber recibido Sinovac'
  const titularOpinion = todoEnElPrimerAnio
    ? `Entre quienes la recibieron, la buena opinión de Sinovac cae en ${primerTramo.hasta} y ahí se queda`
    : buenaCae
      ? 'Entre quienes la recibieron, la buena opinión de Sinovac cae'
      : 'Qué opinan de Sinovac quienes la recibieron'

  const topeRecuerdo = topeDeBarras(recibio.puntos.map((p) => p.valor))
  const topeOpinion = topeDeBarras([...buena.puntos, ...pfizer.puntos].map((p) => p.valor))

  const barrasDeSerie = (
    serie: NonNullable<typeof recibio>,
    prefijo: string,
    encendida: (i: number) => boolean,
    marca?: number,
  ) => serie.puntos.map((p, i) => ({
    clave: `${prefijo}-${p.ola}`,
    etiqueta: prefijo ? `${prefijo} ${p.ola}` : String(p.ola),
    valor: p.valor,
    n: p.n,
    color: tonos[i],
    encendida: encendida(i),
    marca: marca === i,
  }))

  const enes = (serie: NonNullable<typeof recibio>) => serie.puntos
    .map((p, i) => `${i === 0 ? '' : i === serie.puntos.length - 1 ? ' y ' : ', '}${numero(p.n)}`).join('')

  return (
    <CapaRecorrido
      abierta={abierta}
      alCerrar={() => { navegar('/') }}
      salida="Volver a las historias"
      metodo="metodo-vacuna"
      titulo="La vacuna"
    >
      {(raiz) => (
        <>
          <Portada raiz={raiz} titulo="¿Qué queda de la vacuna china?">
            <img
              src={`${import.meta.env.BASE_URL}icons/iclac.webp`}
              alt="ICLAC"
              className="logo-portada h-12 w-auto object-contain"
            />
            <h2 className="pregunta-portada my-auto max-w-[22ch] text-balance font-display text-[34px] font-semibold leading-[1.12] text-gray-900">
              ¿Qué queda de la vacuna china?
            </h2>
          </Portada>

          {/* Escena 1: el recuerdo. La opción nueva de la última oleada («No recuerdo») va en la
              nota y no en la figura: decisión de Felipe, 21-09-2026. */}
          <Escena
            indice={1}
            raiz={raiz}
            dosColumnas
            titulo={titularRecuerdo}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={[
              <>En {primeraOla}, el <strong>{fmt(recibio.puntos[0].valor)}</strong> decía haber recibido al menos una dosis de Sinovac.</>,
              <>
                En {recibio.puntos.at(-2)!.ola}, el <strong>{fmt(recibio.puntos.at(-2)!.valor)}</strong>; en {ultimaOla}, el <strong>{fmt(recibio.puntos.at(-1)!.valor)}</strong>.
                {recuerdoQuieto ? ' Tres oleadas y la cifra no se mueve.' : ' Esta vez la cifra se mueve.'}
              </>,
            ]}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                filas={barrasDeSerie(recibio, '', (i) => reducido || activo > 0 || i === 0, !reducido && activo === 0 ? 0 : undefined)}
                max={topeRecuerdo}
                formato={fmt}
                descripcion={`Dice haber recibido al menos una dosis de Sinovac, entre quienes recuerdan, por oleada: ${recibio.puntos.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}.`}
              />
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                {recibio.puntos.map((p, i) => `${i === 0 ? '' : i === recibio.puntos.length - 1 ? ' y ' : ', '}${casosDe(p.valor, p.n)} de ${numero(p.n)}`).join('')} personas
                encuestadas.{noRecuerda && <> En {ultimaOla} se agregó la opción «No recuerdo»: la marcó el {fmt(noRecuerda.porcentaje)} ({numero(noRecuerda.n)} de {numero(reparto.base)}), y esas personas
                quedan fuera de la cifra. Como la opción es nueva, no se puede saber cuánto de eso es olvido.</>}
              </p>
            )}
          />

          <Respiro raiz={raiz} indice={-1} titulo="¿Y qué opinión dejó?">
            ¿Y qué <strong>opinión</strong> dejó?
          </Respiro>

          {/* Escena 2: la opinión de quienes la recibieron, y en el último paso la preferencia por
              otra vacuna, con la misma base y el mismo eje. */}
          <Escena
            indice={2}
            raiz={raiz}
            dosColumnas
            titulo={titularOpinion}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={Math.min(activo, encuesta.olas.length - 1)} />
            )}
            frases={[
              <>En {primeraOla}, el <strong>{fmt(buena.puntos[0].valor)}</strong> de quienes recibieron Sinovac tenía buena o muy buena opinión de ella.</>,
              <>
                En {primerTramo?.hasta}, el <strong>{fmt(primerTramo?.b ?? 0)}</strong>:{' '}
                {decimal(Math.abs(primerTramo?.diferencia ?? 0))} puntos {(primerTramo?.diferencia ?? 0) < 0 ? 'menos' : 'más'} en un año.
              </>,
              <>
                En {ultimaOla}, el <strong>{fmt(buena.puntos.at(-1)!.valor)}</strong>.
                {todoEnElPrimerAnio ? ' La caída entera ocurrió en el primer año.' : ''}
              </>,
              <>
                Quienes hubiesen preferido Pfizer o Moderna, en cambio,{' '}
                {pfizerQuieto
                  ? <>se quedan <strong>entre {rangoPfizer[0]} y {rangoPfizer[1]} %</strong> las tres oleadas.</>
                  : <>se mueven: {pfizer.puntos.map((p) => fmt(p.valor)).join(', ')}.</>}
              </>,
            ]}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                max={topeOpinion}
                formato={fmt}
                descripcion={`Entre quienes recibieron Sinovac. Buena o muy buena opinión de la vacuna: ${buena.puntos.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}. Hubiese preferido Pfizer o Moderna: ${pfizer.puntos.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}.`}
                filas={[
                  ...barrasDeSerie(buena, 'Buena opinión', (i) => reducido || i <= activo, !reducido && activo <= 2 ? activo : undefined),
                  ...barrasDeSerie(pfizer, 'Prefería Pfizer', () => reducido || activo >= 3),
                ]}
              />
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                Solo quienes dicen haber recibido Sinovac: {enes(buena)} personas encuestadas. En {primeraOla} estas preguntas se
                hacían solo a ellas, así que las otras oleadas se cuentan igual para poder comparar.
              </p>
            )}
          />

          <Cierre
            raiz={raiz}
            titulo="La vacuna"
            frases={[
              { escena: 1, texto: titularRecuerdo },
              { escena: 2, texto: titularOpinion },
            ]}
          />
        </>
      )}
    </CapaRecorrido>
  )
}
