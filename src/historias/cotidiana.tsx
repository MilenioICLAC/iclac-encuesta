import type { CSSProperties, ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import BarrasDeEscena from '../componentes/BarrasDeEscena'
import Enfasis from '../componentes/Enfasis'
import { topeDeBarras } from '../nucleo/escala'
import { IDENTIDAD, NEUTRO, pasosDeOrden, tintaSobre } from '../nucleo/paleta'
import { decimal, numero, porcentaje, useIdioma } from '../locale'
import { distribucion } from '../nucleo/agregar'
import Puntos from '../componentes/Puntos'
import { AnioDelPaso, LeyendaDeOleadas } from './comun'
import { filasDePalabras, serieDeMedida } from './lectura'
import { FICHA, TEXTOS } from './textos/cotidiana'

/**
 * La historia «China cotidiana»: qué tan cerca queda China en la vida diaria.
 *
 * Cubre el bloque `cotidiana` del cuestionario, que es de ICLAC y no nuestro: las cosas que se
 * tienen cerca (`p12`, `p13`), las personas que se conocen (`p14`) y lo que se ve (`p18`). El
 * racismo reportado es la escena final y no una historia aparte; separarlo era un corte nuestro.
 *
 * **La composición salió del laboratorio** (`laboratorio/china-cotidiana.html`, JSON del
 * 21-09-2026): sin bajada, con la nota al pie de la figura, escala ajustada a lo que cada escena
 * compara y el año del paso en grande. La escena del racismo junta 2023 y 2024 en un solo paso,
 * porque de un año al siguiente la baja es demasiado chica para afirmarla, y dos pasos para decir
 * eso son uno de más. La escena de los buses (solo 2025) llegó después, con la misma forma.
 *
 * Cada frase que afirma algo está condicionada a su contraste: si una oleada nueva deja al mall
 * sin crecer o al contacto moviéndose, el titular cae a uno descriptivo en vez de quedar publicado
 * diciendo lo contrario de su propia figura.
 *
 * **El componente calcula y compone; no escribe texto.** Toda la prosa, en los tres idiomas, está en
 * `textos/cotidiana.tsx`, que recibe las cifras y las banderas en `Valores`.
 */
export function HistoriaChinaCotidiana ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  const navegar = useNavigate()
  const idioma = useIdioma()
  const mall = serieDeMedida(encuesta, 'mall-cerca')
  const restaurante = serieDeMedida(encuesta, 'restaurante-cerca')
  const conoce = serieDeMedida(encuesta, 'conoce-china')
  const racismo = serieDeMedida(encuesta, 'racismo-visto')
  const contacto = encuesta.contrastes?.grupos.find((g) => g.id === 'racismo-contacto')?.porOla.at(-1) ?? null
  const sabia = encuesta.contrastes?.grupos.find((g) => g.id === 'buses-sabia')?.porOla.find((x) => x.brecha) ?? null
  const variable = (nombre: string) => encuesta.variables.find((v) => v.nombre === nombre)
  const p18e = variable('p18e')
  const p18d = variable('p18d')

  // Las oleadas son una secuencia: rampa de claro a oscuro, más oscuro es más nuevo.
  const tonos = pasosDeOrden(encuesta.olas.length)
  const fmt = (v: number) => porcentaje(v, 1)

  if (!mall || !restaurante || !conoce || !racismo || !contacto || !sabia || !p18e || !p18d) {
    // Sin contrastes no hay historia: es el caso del artefacto viejo, y una escena con las barras
    // sin sus pruebas afirmaría lo que no puede sostener.
    return <Navigate to="/" replace />
  }

  const primeraOla = mall.puntos[0].ola
  const ultimaOla = mall.puntos[mall.puntos.length - 1].ola

  // Qué sostiene cada titular. Un contraste que deja de pasar se lleva su afirmación, no la figura.
  const mallCrece = Boolean(mall.punta && mall.punta.p < 0.05 && mall.punta.diferencia > 0)
  const restauranteParejo = Boolean(restaurante.punta && restaurante.punta.p >= 0.05)
  const contactoQuieto = conoce.consecutivas.every((c) => c.p >= 0.05) && (conoce.punta?.p ?? 0) >= 0.05
  const racismoBaja = Boolean(racismo.punta && racismo.punta.p < 0.05 && racismo.punta.diferencia < 0)
  const racismoParejoEntreAnios = racismo.consecutivas.every((c) => c.p >= 0.05)

  // Los tramos se buscan por su clave en español, que es la del ETL; el rótulo lo pone el texto.
  const tramo = (nombre: string) => contacto.tramos.find((t) => t.nombre === nombre) ?? null
  const conConocidos = tramo('Conoce')
  const sinConocidos = tramo('No conoce')
  const contactoSeparado = Boolean(contacto.brecha && contacto.brecha.p < 0.05)

  // Dónde ocurre el contacto (`p16`, respuesta abierta contada por persona en el ETL). Las marcas
  // chinas (`p6a`) estuvieron en la nota de la escena 1 y Felipe las sacó el 22-09-2026: desviaban.
  const nubeContacto = encuesta.nubes.find((n) => n.id === 'p16')
  const nubeTrato = encuesta.nubes.find((n) => n.id === 'p17_texto')
  const mallContacto = serieDeMedida(encuesta, 'palabra-mall')
  const buena = serieDeMedida(encuesta, 'palabra-buena')
  const filasContacto = nubeContacto ? filasDePalabras(nubeContacto, { tope: 5, fuera: ['chino', 'china'] }) : []
  const topeContacto = Math.min(100, Math.ceil(Math.max(10, ...filasContacto.flatMap((f) => f.valores.map((v) => v ?? 0))) / 10) * 10)
  const hayLugar = Boolean(nubeContacto && mallContacto)

  // Los buses: solo en la oleada en que se preguntó, que es la del contraste.
  const casosBuses = encuesta.casos.filter((c) => Number(c.ola) === sabia.ola)
  const marca = distribucion(casosBuses, p18e)
  const opinion = distribucion(casosBuses, p18d)
  const noSabia = marca.segmentos.find((x) => x.codigo === 2) ?? null
  const siSabia = marca.segmentos.find((x) => x.codigo === 1) ?? null
  const venBien = opinion.segmentos.filter((x) => [1, 2].includes(x.codigo)).reduce((t, x) => t + x.porcentaje, 0)
  const tramoBus = (nombre: string) => sabia.tramos.find((t) => t.nombre === nombre) ?? null
  const busSabia = tramoBus('Sabía')
  const busNoSabia = tramoBus('No sabía')
  const tonoBuses = tonos[encuesta.olas.indexOf(sabia.ola)]
  const deTramo = (t: { media: number | null, n: number } | null) => (t ? { media: t.media ?? 0, n: t.n } : null)

  // Toda la prosa sale del módulo de textos; los titulares se escriben una vez y los leen la
  // escena y el cierre.
  const t = TEXTOS[idioma]({
    primeraOla,
    ultimaOla,
    mall: mall.puntos,
    restaurante: restaurante.puntos,
    mallDiferencia: Math.abs(mall.punta?.diferencia ?? 0),
    restauranteDiferencia: Math.abs(restaurante.punta?.diferencia ?? 0),
    mallCrece,
    restauranteParejo,
    conoce: conoce.puntos,
    contactoQuieto,
    // Con su signo de porcentaje (pedido de Felipe, 22-09-2026), y los dos años se dicen juntos solo
    // mientras redondeen igual: el día que dejen de hacerlo, la frase los separa sola.
    conoceIgualAlFinal: fmt(conoce.puntos[1].valor) === fmt(conoce.puntos[2].valor),
    lugar: hayLugar && mallContacto && nubeContacto
      ? {
          mall: mallContacto.puntos,
          mallQuieto: mallContacto.consecutivas.every((c) => c.p >= 0.05) && (mallContacto.punta?.p ?? 0) >= 0.05,
          unCuarto: mallContacto.puntos.every((p) => p.valor >= 20 && p.valor < 30),
          filas: filasContacto,
          bases: encuesta.olas.map((o) => nubeContacto.baseOla?.[String(o)] ?? 0),
          buena: nubeTrato && buena ? buena.puntos : null,
        }
      : null,
    buses: {
      ola: sabia.ola,
      noSabia: noSabia?.porcentaje ?? null,
      siSabia: siSabia?.porcentaje ?? null,
      venBien,
      baseMarca: marca.base,
      baseOpinion: opinion.base,
      sabian: deTramo(busSabia),
      noSabian: deTramo(busNoSabia),
      separa: Boolean(sabia.brecha && sabia.brecha.p < 0.05),
    },
    racismo: racismo.puntos,
    racismoDiferencia: Math.abs(racismo.punta?.diferencia ?? 0),
    racismoBaja,
    racismoParejoEntreAnios,
    advertenciaRacismo: racismo.advertencia,
    contacto: { ola: contacto.ola, conoce: deTramo(conConocidos), noConoce: deTramo(sinConocidos), separado: contactoSeparado },
  })
  const ficha = FICHA[idioma]

  // La escala de cada escena se calcula con **todas** sus filas, las que todavía no entran
  // incluidas. En la escena 3 eso incluye los dos grupos del último paso: cambia de filas sin
  // cambiar de eje.
  const filasCosas = [...mall.puntos, ...restaurante.puntos]
  const topeCosas = topeDeBarras(filasCosas.map((p) => p.valor))
  const topePersonas = topeDeBarras(conoce.puntos.map((p) => p.valor))
  const topeVisto = topeDeBarras([
    ...racismo.puntos.map((p) => p.valor),
    ...contacto.tramos.map((x) => x.media ?? 0),
  ])

  // La clave de cada barra no depende del idioma; el rótulo sí.
  const barrasDeSerie = (
    serie: NonNullable<ReturnType<typeof serieDeMedida>>,
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

  const nota = (contenido: ReactNode) => <p className="text-xs leading-snug text-gray-500">{contenido}</p>

  return (
    <CapaRecorrido
      abierta={abierta}
      alCerrar={() => { navegar('/') }}
      salida={t.salida}
      metodo="metodo-china-cotidiana"
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

          {/* Escena 1: las cosas que se tienen cerca. Dos series en el mismo eje; la segunda entra
              en el último paso, que es la comparación que la escena hace. */}
          <Escena
            indice={1}
            raiz={raiz}
            dosColumnas
            titulo={t.titularCosas}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={t.frasesCosas}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                max={topeCosas}
                formato={fmt}
                descripcion={t.descripcionCosas}
                filas={[
                  ...barrasDeSerie(mall, 'mall', t.barraMall, (i) => reducido || activo > 0 || i === 0, reducido ? undefined : (activo === 0 ? 0 : activo === 1 ? mall.puntos.length - 1 : undefined)),
                  ...barrasDeSerie(restaurante, 'restaurante', t.barraRestaurante, () => reducido || activo >= 2),
                ]}
              />
            )}
            nota={nota(t.notaCosas)}
          />

          <Respiro raiz={raiz} indice={-1} titulo={t.respiroPersonas.titulo}>
            {t.respiroPersonas.cuerpo}
          </Respiro>

          {/* Escena 2: las personas. Una sola serie, y lo que la escena afirma es que no se mueve. */}
          <Escena
            indice={2}
            raiz={raiz}
            dosColumnas
            titulo={t.titularPersonas}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={t.frasesPersonas}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                max={topePersonas}
                formato={fmt}
                descripcion={t.descripcionPersonas}
                filas={barrasDeSerie(conoce, 'conoce', '', (i) => reducido || activo >= 1 || i === 0, reducido || activo !== 0 ? undefined : 0)}
              />
            )}
            nota={nota(t.notaPersonas)}
          />

          {hayLugar && (
            <>
              <Respiro raiz={raiz} indice={-2} titulo={t.respiroLugar.titulo}>
                {t.respiroLugar.cuerpo}
              </Respiro>

              {/* Escena 3: dónde ocurre el contacto (`p16`, abierta). Las respuestas abiertas van
                  repartidas en las historias por decisión de Felipe (22-09-2026). Una fila por lugar
                  y un punto por oleada; lo que afirma es que el mall no se mueve. */}
              <Escena
                indice={3}
                raiz={raiz}
                dosColumnas
                titulo={t.titularLugar}
                cabecera={(activo) => (
                  <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
                )}
                frases={t.frasesLugar}
                figura={(activo, reducido) => (
                  // En columnas (desde 900 px) `index.css` fija la columna de nombres en 9,5rem para
                  // todas las escenas; acá cada idioma pone la suya, porque fuera del español la
                  // palabra va traducida y con la original al lado («restaurant (restaurante)»).
                  <div
                    className="flex flex-col gap-2 min-[900px]:[--ancho-etiqueta-ancho:var(--ancho-palabra-escritorio)]"
                    style={{ '--ancho-palabra-escritorio': t.anchoPalabra.escritorio } as CSSProperties}
                  >
                    <p className="sr-only">{t.descripcionLugar}</p>
                    <Puntos
                      series={encuesta.olas.map((ola, i) => ({ clave: String(ola), etiqueta: String(ola), color: tonos[i] }))}
                      filas={filasContacto}
                      escala={{ min: 0, max: topeContacto }}
                      formato={(v) => decimal(v, 1)}
                      formatoEje={(v) => decimal(v, 0)}
                      titulo={(fila, serie, valor) => t.tituloPunto(fila.etiqueta, serie.etiqueta, fmt(valor))}
                      marcas={topeContacto / 10 + 1}
                      anchoEtiqueta={t.anchoPalabra.telefono}
                      compacto
                      altoFila={30}
                      radioCreciente
                      leyenda={false}
                      unidadEje={t.unidadLugar}
                      rotular={activo === 0 ? 0 : encuesta.olas.length - 1}
                      visible={(_fila, ola) => reducido || activo >= 1 || ola === String(primeraOla)}
                    />
                    <LeyendaDeOleadas olas={encuesta.olas} tonos={tonos} />
                  </div>
                )}
                nota={nota(t.notaLugar)}
              />
            </>
          )}

          <Respiro raiz={raiz} indice={-3} titulo={t.respiroCalle.titulo}>
            {t.respiroCalle.cuerpo}
          </Respiro>

          {/* Escena 4: los buses eléctricos, solo en la oleada que preguntó. Cambia de filas en el
              segundo paso (de si sabía la marca a cómo evalúa la electrificación) sin cambiar de eje. */}
          <Escena
            indice={hayLugar ? 4 : 3}
            raiz={raiz}
            dosColumnas
            titulo={t.titularBuses}
            cabecera={() => <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={encuesta.olas.indexOf(sabia.ola)} />}
            frases={t.frasesBuses}
            figura={(activo, reducido) => {
              // **Dos preguntas distintas, dos formas distintas** (pedido de Felipe, 21-09-2026: con
              // las mismas barras y los mismos rótulos, el cambio de pregunta no se veía). Primero una
              // sola barra partida al 100 %, porque «lo sabía» y «no lo sabía» son las dos mitades de
              // la misma gente; después barras de «ve bien», cada una con su grupo escrito entero. La
              // pregunta va escrita arriba de cada figura.
              const partes = [noSabia, siSabia].filter((x): x is NonNullable<typeof x> => Boolean(x))
              const barraPartida = (
                <figure className="m-0">
                  <p className="mb-2 text-sm font-semibold text-gray-800">{t.preguntaMarca}</p>
                  <div className="flex h-[38px] w-full overflow-hidden rounded-sm" aria-hidden>
                    {partes.map((x) => {
                      const fondo = x.codigo === 2 ? tonoBuses : NEUTRO
                      const rotulo = x.codigo === 2 ? t.noLoSabia : t.loSabia
                      return (
                        <div
                          key={x.codigo}
                          className="relative flex items-center px-2 text-[13px] font-semibold tabular-nums"
                          style={{ width: `${x.porcentaje}%`, backgroundColor: fondo, color: tintaSobre(fondo) }}
                          title={`${rotulo}: ${fmt(x.porcentaje)} (n = ${numero(marca.base)})`}
                        >
                          {x.codigo === 2 && !reducido && <Enfasis />}
                          <span className="whitespace-nowrap">{rotulo} · {fmt(x.porcentaje)}</span>
                        </div>
                      )
                    })}
                  </div>
                </figure>
              )
              const filasOpinion = [
                { clave: 'bien-todas', etiqueta: t.todas, valor: venBien, n: opinion.base, color: IDENTIDAD[0], encendida: true },
                ...[busSabia, busNoSabia]
                  .filter((x): x is NonNullable<typeof x> => Boolean(x))
                  .map((x) => ({
                    clave: `bien-${x.nombre}`,
                    etiqueta: x === busSabia ? t.quienesSabian : t.quienesNoSabian,
                    valor: x.media ?? 0,
                    n: x.n,
                    color: IDENTIDAD[0],
                    encendida: reducido || activo >= 2,
                  })),
              ]
              const barrasOpinion = (
                <figure className="m-0">
                  <p className="mb-2 text-sm font-semibold text-gray-800">{t.preguntaOpinion}</p>
                  <BarrasDeEscena filas={filasOpinion} max={100} formato={fmt} descripcion={t.descripcionBuses} />
                </figure>
              )
              if (reducido) return <div className="flex flex-col gap-5">{barraPartida}{barrasOpinion}</div>
              return activo === 0 ? <><p className="sr-only">{t.descripcionBuses}</p>{barraPartida}</> : barrasOpinion
            }}
            nota={(activo, reducido) => {
              const deLaMarca = nota(t.notaMarca)
              const deLaOpinion = nota(t.notaOpinion)
              if (reducido) return <div className="flex flex-col gap-2">{deLaMarca}{deLaOpinion}</div>
              return activo === 0 ? deLaMarca : deLaOpinion
            }}
          />

          <Respiro raiz={raiz} indice={-4} titulo={t.respiroVisto.titulo}>
            {t.respiroVisto.cuerpo}
          </Respiro>

          {/* Escena 5: la serie de lo que se ve y, en el último paso, quién lo ve. **Cambia de
              filas sin cambiar de eje**: el tope sale de los dos juegos de filas juntos. */}
          <Escena
            indice={hayLugar ? 5 : 4}
            raiz={raiz}
            dosColumnas
            titulo={t.titularVisto}
            cabecera={(activo) => (
              // El año en grande es el del paso, así que en el paso que enciende dos oleadas no se
              // dibuja: poner una de las dos sería falso. El hueco queda para que la figura no salte.
              activo === 0
                ? <div className="h-[34px]" aria-hidden />
                : <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={encuesta.olas.length - 1} />
            )}
            frases={t.frasesVisto}
            figura={(activo, reducido) => {
              const serie = barrasDeSerie(
                racismo, 'racismo', '',
                (i) => reducido || i <= (activo === 0 ? 1 : 2),
                reducido || activo !== 1 ? undefined : 2,
              )
              const grupos = [sinConocidos, conConocidos]
                .filter((x): x is NonNullable<typeof x> => Boolean(x))
                .map((x) => ({
                  clave: `contacto-${x.nombre}`,
                  etiqueta: x === conConocidos ? t.grupoConoce : t.grupoNoConoce,
                  valor: x.media ?? 0,
                  n: x.n,
                  // Los dos grupos no son una secuencia: un solo color, y la fila rotula.
                  color: IDENTIDAD[0],
                  encendida: true,
                }))
              // Con movimiento reducido la escena muestra las dos figuras: la mitad del texto habla
              // de la que no estaría.
              if (reducido) {
                return (
                  <div className="flex flex-col gap-3">
                    <BarrasDeEscena filas={serie} max={topeVisto} formato={fmt} descripcion={t.descripcionVisto} />
                    <BarrasDeEscena filas={grupos} max={topeVisto} formato={fmt} descripcion="" />
                  </div>
                )
              }
              return (
                <BarrasDeEscena
                  filas={activo >= 2 ? grupos : serie}
                  max={topeVisto}
                  formato={fmt}
                  descripcion={t.descripcionVisto}
                />
              )
            }}
            // El pie sigue al paso: la escena cambia de figura en el último y el pie que describe
            // la serie no describe los dos grupos.
            // Con movimiento reducido van las dos figuras, así que van los dos pies.
            nota={(activo, reducido) => {
              const deLaSerie = nota(t.notaSerieVisto)
              const delContacto = nota(t.notaContacto)
              if (reducido) return <div className="flex flex-col gap-2">{deLaSerie}{delContacto}</div>
              return activo >= 2 ? delContacto : deLaSerie
            }}
          />

          <Cierre
            raiz={raiz}
            titulo={ficha.nombre}
            frases={[
              { escena: 1, texto: t.titularCosas },
              { escena: 2, texto: t.titularPersonas },
              // El contacto (escena 3) no entra: es descriptivo, y con cinco titulares el cierre no
              // cabe en 360×640 (medido el 22-09-2026).
              { escena: hayLugar ? 4 : 3, texto: t.titularBuses },
              { escena: hayLugar ? 5 : 4, texto: t.titularVisto },
            ]}
          />
        </>
      )}
    </CapaRecorrido>
  )
}
