import { Navigate, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import BarrasDeEscena from '../componentes/BarrasDeEscena'
import Puntos from '../componentes/Puntos'
import { multirespuesta } from '../nucleo/agregar'
import { topeDeBarras } from '../nucleo/escala'
import { pasosDeOrden } from '../nucleo/paleta'
import { decimal, numero, porcentaje } from '../locale'
import { AnioDelPaso, LeyendaDeOleadas } from './comun'
import { casosDe, serieDeMedida } from './lectura'

/**
 * La historia «Inversión y Estado»: si el Estado debería poder frenar una inversión extranjera, y
 * dónde.
 *
 * Bloque 4 de la guía de contexto de ICLAC. (El riesgo que se ve en China, que fue su primera
 * escena, pasó a «Donde uno vive» el 22-09-2026.) Sus dos afirmaciones se sostienen (registro en
 * `la documentación interna`): la mayoría que quiere poder limitar
 * (`p19`) no se mueve en las tres oleadas, y los sectores más marcados (`p20`, solo 2023 y 2024)
 * son cobre, litio y distribución eléctrica. El tercer puesto contra el cuarto es lo único que esa
 * frase arriesga, y tiene su contraste (`electrica-sobre-banca`).
 *
 * **Ninguna de las dos preguntas nombra a China**: hablan de empresas extranjeras. La nota lo dice,
 * porque en una encuesta sobre China el lector lo supone.
 */
export function HistoriaInversion ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  const navegar = useNavigate()
  const limitar = serieDeMedida(encuesta, 'limitar-inversiones')
  const podio = encuesta.contrastes?.brechas.find((b) => b.id === 'electrica-sobre-banca')?.porOla ?? []
  const grupo = encuesta.multiples.find((m) => m.id === 'p20')

  const tonos = pasosDeOrden(encuesta.olas.length)
  const fmt = (v: number) => porcentaje(v, 1)

  // Las oleadas en que se preguntó por sectores, leídas de los datos y no escritas a mano.
  const olasSectores = encuesta.olas.filter((ola) => grupo?.opciones.some((o) => o.olas.includes(ola)))
  if (!limitar || !grupo || olasSectores.length < 2) return <Navigate to="/" replace />

  // «Otro» no es un sector: se deja fuera de la figura y la nota lo dice.
  const sectores = olasSectores.map((ola) => {
    const r = multirespuesta(encuesta.casos.filter((c) => Number(c.ola) === ola), grupo, ola)
    return { ola, base: r.base, menciones: r.menciones.filter((m) => m.columna !== 'p20_98') }
  })
  const [primeraS, ultimaS] = [sectores[0], sectores[sectores.length - 1]]
  const orden = (s: typeof primeraS) => s.menciones.map((m) => m.columna).join()
  const mismoOrden = orden(primeraS) === orden(ultimaS)
  const nombre = (columna: string) => {
    const o = grupo.opciones.find((x) => x.columna === columna)?.opcion ?? columna
    // Las opciones vienen como «del cobre», «de distribución eléctrica»: la fila lleva el sustantivo.
    // «5G/telecomunicaciones» no cabe en la columna de nombres de un teléfono.
    const limpio = o.replace(/^(del|de la|de)\s+/, '').replace('5G/telecomunicaciones', '5G y telecom.')
    return limpio.charAt(0).toUpperCase() + limpio.slice(1)
  }
  const tres = primeraS.menciones.slice(0, 3)
  const podioFirme = podio.length === olasSectores.length && podio.every((b) => b.p < 0.05 && b.diferencia > 0)
    && orden({ ...primeraS, menciones: primeraS.menciones.slice(0, 3) }) === orden({ ...ultimaS, menciones: ultimaS.menciones.slice(0, 3) })

  const parejo = (s: NonNullable<typeof limitar>) => s.consecutivas.every((c) => c.p >= 0.05) && (s.punta?.p ?? 0) >= 0.05

  const primeraOla = limitar.puntos[0].ola
  const ultimaOla = limitar.puntos[limitar.puntos.length - 1].ola
  const quieto = parejo(limitar)
  // «Tres de cada cuatro» solo mientras las tres oleadas redondeen a eso.
  const tresDeCuatro = limitar.puntos.every((p) => p.valor >= 70 && p.valor < 80)

  const titularLimitar = quieto && tresDeCuatro
    ? 'En todas las oleadas, tres de cada cuatro personas quieren que el Estado pueda frenar una inversión extranjera'
    : 'Cuántos quieren que el Estado pueda frenar una inversión extranjera'
  const titularSectores = podioFirme
    ? `Donde más se quiere poder frenarla: ${tres.map((m) => nombre(m.columna).toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' y $1')}`
    : 'En qué sectores se quiere poder frenarla'

  const topeLimitar = topeDeBarras(limitar.puntos.map((p) => p.valor))
  // Eje de 0 a un múltiplo de 20, con marcas cada 20: con el tope de las barras (75) y tres marcas
  // el eje decía 0, 38 y 75.
  const topeSectores = Math.min(100, Math.ceil(Math.max(...sectores.flatMap((s) => s.menciones.map((m) => m.porcentaje))) / 20) * 20)

  // Los sectores como el termómetro: una fila por sector y un punto por oleada, en el mismo eje,
  // ordenados por la última. Pedido de Felipe (21-09-2026): las dos oleadas a la vista a la vez.
  const filasSectores = ultimaS.menciones.map((m) => ({
    clave: m.columna,
    etiqueta: nombre(m.columna),
    valores: sectores.map((x) => x.menciones.find((y) => y.columna === m.columna)?.porcentaje ?? null),
  }))
  const seriesSectores = sectores.map((x) => ({
    clave: String(x.ola),
    etiqueta: String(x.ola),
    color: tonos[encuesta.olas.indexOf(x.ola)],
  }))
  const olasConSectores = sectores.map((x) => x.ola)
  const tonosSectores = sectores.map((x) => tonos[encuesta.olas.indexOf(x.ola)])
  const describirSectores = (s: typeof primeraS) => `${s.ola}: ${s.menciones.map((m) => `${nombre(m.columna)} ${fmt(m.porcentaje)}`).join(', ')}`

  return (
    <CapaRecorrido
      abierta={abierta}
      alCerrar={() => { navegar('/') }}
      salida="Volver a las historias"
      metodo="metodo-inversion"
      titulo="Inversión y Estado"
    >
      {(raiz) => (
        <>
          <Portada raiz={raiz} titulo="¿Dónde poner límites a la inversión?">
            <img
              src={`${import.meta.env.BASE_URL}icons/iclac.webp`}
              alt="ICLAC"
              className="logo-portada h-12 w-auto object-contain"
            />
            <h2 className="pregunta-portada my-auto max-w-[22ch] text-balance font-display text-[34px] font-semibold leading-[1.12] text-gray-900">
              ¿Dónde poner límites a la inversión?
            </h2>
          </Portada>

          {/* Escena 1: la mayoría que quiere poder limitar. Lo que afirma es que no se mueve. */}
          <Escena
            indice={1}
            raiz={raiz}
            dosColumnas
            titulo={titularLimitar}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={[
              <>En {primeraOla}, el <strong>{fmt(limitar.puntos[0].valor)}</strong> prefería que el Estado pudiera bloquear inversiones que le quiten control sobre sectores estratégicos.</>,
              <>
                En {limitar.puntos.at(-2)!.ola}, el <strong>{fmt(limitar.puntos.at(-2)!.valor)}</strong>; en {ultimaOla}, el <strong>{fmt(limitar.puntos.at(-1)!.valor)}</strong>.
                {quieto ? ' La misma mayoría, tres años seguidos.' : ' Esta vez la cifra sí se mueve.'}
              </>,
            ]}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                max={topeLimitar}
                formato={fmt}
                descripcion={`Prefiere que el Estado pueda limitar inversiones en sectores estratégicos, por oleada. ${limitar.puntos.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}.`}
                filas={limitar.puntos.map((p, i) => ({
                  clave: String(p.ola),
                  etiqueta: String(p.ola),
                  valor: p.valor,
                  n: p.n,
                  color: tonos[i],
                  encendida: reducido || activo > 0 || i === 0,
                  marca: !reducido && activo === 0 && i === 0,
                }))}
              />
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                {limitar.puntos.map((p, i) => `${i === 0 ? '' : i === limitar.puntos.length - 1 ? ' y ' : ', '}${casosDe(p.valor, p.n)} de ${numero(p.n)}`).join('')} personas
                encuestadas. La pregunta habla de empresas extranjeras, no de China. {limitar.advertencia}
              </p>
            )}
          />

          <Respiro raiz={raiz} indice={-1} titulo="¿Y en qué sectores?">
            ¿Y en qué <strong>sectores</strong>?
          </Respiro>

          {/* Escena 2: los sectores de `p20`, una oleada por paso. **Cambia de oleada sin cambiar de
              eje**: el tope sale de las dos juntas. */}
          <Escena
            indice={2}
            raiz={raiz}
            dosColumnas
            titulo={titularSectores}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={encuesta.olas.indexOf(activo === 0 ? primeraS.ola : ultimaS.ola)} />
            )}
            frases={[
              <>
                En {primeraS.ola}, de quienes querían poder limitar, el <strong>{fmt(tres[0].porcentaje)}</strong> marcó {nombre(tres[0].columna).toLowerCase()},
                el <strong>{fmt(tres[1].porcentaje)}</strong> {nombre(tres[1].columna).toLowerCase()} y
                el <strong>{fmt(tres[2].porcentaje)}</strong> {nombre(tres[2].columna).toLowerCase()}.
              </>,
              mismoOrden
                ? <>En {ultimaS.ola} cambian las cifras, pero no el orden: <strong>los siete sectores quedan igual</strong>, de punta a punta.</>
                : <>En {ultimaS.ola}: {nombre(ultimaS.menciones[0].columna).toLowerCase()} {fmt(ultimaS.menciones[0].porcentaje)}, {nombre(ultimaS.menciones[1].columna).toLowerCase()} {fmt(ultimaS.menciones[1].porcentaje)}.</>,
            ]}
            figura={(activo, reducido) => (
              <div className="flex flex-col gap-2">
                <p className="sr-only">{`Sectores donde es más importante limitar la inversión extranjera, entre quienes quieren poder limitarla. ${sectores.map(describirSectores).join('. ')}.`}</p>
                <Puntos
                  series={seriesSectores}
                  filas={filasSectores}
                  escala={{ min: 0, max: topeSectores }}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => `${fila.etiqueta} · ${serie.etiqueta}: ${fmt(valor)}`}
                  marcas={topeSectores / 20 + 1}
                  anchoEtiqueta="8.5rem"
                  compacto
                  altoFila={28}
                  radioCreciente
                  leyenda={false}
                  unidadEje="% que lo marca"
                  rotular={seriesSectores.length - 1}
                  visible={(_fila, ola) => reducido || activo >= 1 || ola === String(primeraS.ola)}
                />
                <LeyendaDeOleadas olas={olasConSectores} tonos={tonosSectores} />
              </div>
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                Solo quienes quieren poder limitar ({sectores.map((x) => `${numero(x.base)} en ${x.ola}`).join(' y ')}). Cada
                persona marca varios sectores: suman más de 100. Sin «otro». No se preguntó en {ultimaOla}.
              </p>
            )}
          />

          <Cierre
            raiz={raiz}
            titulo="Inversión y Estado"
            frases={[
              { escena: 1, texto: titularLimitar },
              { escena: 2, texto: titularSectores },
            ]}
          />
        </>
      )}
    </CapaRecorrido>
  )
}

