import { Navigate, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import BarrasDeEscena from '../componentes/BarrasDeEscena'
import Enfasis from '../componentes/Enfasis'
import { topeDeBarras } from '../nucleo/escala'
import { IDENTIDAD, NEUTRO, pasosDeOrden, tintaSobre } from '../nucleo/paleta'
import { decimal, numero, porcentaje } from '../locale'
import { distribucion } from '../nucleo/agregar'
import Puntos from '../componentes/Puntos'
import { AnioDelPaso, LeyendaDeOleadas } from './comun'
import { casosDe, filasDePalabras, serieDeMedida } from './lectura'

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
 */
export function HistoriaChinaCotidiana ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  const navegar = useNavigate()
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

  const tramo = (nombre: string) => contacto.tramos.find((t) => t.nombre === nombre) ?? null
  const conConocidos = tramo('Conoce')
  const sinConocidos = tramo('No conoce')
  const brechaContacto = contacto.brecha
  const contactoSeparado = Boolean(brechaContacto && brechaContacto.p < 0.05)

  // Dónde ocurre el contacto (`p16`, respuesta abierta contada por persona en el ETL). Las marcas
  // chinas (`p6a`) estuvieron en la nota de la escena 1 y Felipe las sacó el 22-09-2026: desviaban.
  const nubeContacto = encuesta.nubes.find((n) => n.id === 'p16')
  const nubeTrato = encuesta.nubes.find((n) => n.id === 'p17_texto')
  const mallContacto = serieDeMedida(encuesta, 'palabra-mall')
  const buena = serieDeMedida(encuesta, 'palabra-buena')
  const filasContacto = nubeContacto ? filasDePalabras(nubeContacto, { tope: 5, fuera: ['chino', 'china'] }) : []
  const topeContacto = Math.min(100, Math.ceil(Math.max(10, ...filasContacto.flatMap((f) => f.valores.map((v) => v ?? 0))) / 10) * 10)
  const mallQuieto = Boolean(mallContacto && mallContacto.consecutivas.every((c) => c.p >= 0.05) && (mallContacto.punta?.p ?? 0) >= 0.05)
  const unCuarto = Boolean(mallContacto && mallContacto.puntos.every((p) => p.valor >= 20 && p.valor < 30))
  const titularContacto = mallQuieto && unCuarto
    ? 'Cerca de un cuarto nombra el mall cuando se le pregunta dónde tiene contacto con personas chinas, las tres oleadas'
    : 'Dónde ocurre el contacto con personas chinas'
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
  const sabiaSepara = Boolean(sabia.brecha && sabia.brecha.p < 0.05)
  const tonoBuses = tonos[encuesta.olas.indexOf(sabia.ola)]

  // Los titulares se escriben una vez: la escena y el cierre leen el mismo.
  const titularCosas = mallCrece && restauranteParejo
    ? `Entre ${primeraOla} y ${ultimaOla} creció la proporción que vive cerca de un mall chino; la del restaurante quedó pareja`
    : 'Qué tan cerca queda China del barrio'
  const titularPersonas = contactoQuieto
    ? 'El contacto con personas de China no se movió'
    : 'A cuánta gente le queda cerca alguien de China'
  const titularBuses = noSabia && noSabia.porcentaje > 50
    ? 'Más de la mitad no sabía que los buses eléctricos de Santiago son de marcas chinas'
    : 'Quién sabía que los buses eléctricos de Santiago son de marcas chinas'
  const titularVisto = racismoBaja
    ? `Entre ${primeraOla} y ${ultimaOla} bajó la proporción que dice haber visto racismo contra personas chinas o asiáticas`
    : 'Quién dice haber visto racismo contra personas chinas o asiáticas'

  // La escala de cada escena se calcula con **todas** sus filas, las que todavía no entran
  // incluidas. En la escena 3 eso incluye los dos grupos del último paso: cambia de filas sin
  // cambiar de eje.
  const filasCosas = [...mall.puntos, ...restaurante.puntos]
  const topeCosas = topeDeBarras(filasCosas.map((p) => p.valor))
  const topePersonas = topeDeBarras(conoce.puntos.map((p) => p.valor))
  const topeVisto = topeDeBarras([
    ...racismo.puntos.map((p) => p.valor),
    ...contacto.tramos.map((t) => t.media ?? 0),
  ])

  // La única vez que la historia dice «ruido»: es donde el lector más espera un cambio.
  const cierreConoce = `La diferencia con ${primeraOla} ${contactoQuieto ? 'no se distingue del ruido' : 'sí se sostiene'}.`

  const barrasDeSerie = (
    serie: NonNullable<ReturnType<typeof serieDeMedida>>,
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

  const notaDeSerie = (serie: NonNullable<ReturnType<typeof serieDeMedida>>, cola: string) => (
    <p className="text-xs leading-snug text-gray-500">
      {serie.puntos.map((p, i) => (
        <span key={p.ola}>
          {i > 0 && (i === serie.puntos.length - 1 ? ' y ' : ', ')}
          {casosDe(p.valor, p.n)} de {numero(p.n)} en {p.ola}
        </span>
      ))}
      {cola}
    </p>
  )

  return (
    <CapaRecorrido
      abierta={abierta}
      alCerrar={() => { navegar('/') }}
      salida="Volver a las historias"
      metodo="metodo-china-cotidiana"
      titulo="China cotidiana"
    >
      {(raiz) => (
        <>
          <Portada raiz={raiz} titulo="¿Cuánta China hay en la vida diaria?">
            <img
              src={`${import.meta.env.BASE_URL}icons/iclac.webp`}
              alt="ICLAC"
              className="logo-portada h-12 w-auto object-contain"
            />
            <h2 className="pregunta-portada my-auto max-w-[22ch] text-balance font-display text-[34px] font-semibold leading-[1.12] text-gray-900">
              ¿Cuánta China hay en la vida diaria?
            </h2>
          </Portada>

          {/* Escena 1: las cosas que se tienen cerca. Dos series en el mismo eje; la segunda entra
              en el último paso, que es la comparación que la escena hace. */}
          <Escena
            indice={1}
            raiz={raiz}
            dosColumnas
            titulo={titularCosas}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={[
              <>En {primeraOla}, el <strong>{fmt(mall.puntos[0].valor)}</strong> decía vivir a menos de diez cuadras de un mall chino.</>,
              <>En {ultimaOla}, el <strong>{fmt(mall.puntos[mall.puntos.length - 1].valor)}</strong>: {decimal(Math.abs(mall.punta?.diferencia ?? 0))} puntos más.</>,
              <>
                El restaurante chino, en cambio, <strong>{restauranteParejo ? 'queda parejo' : 'también se mueve'}</strong>:{' '}
                {fmt(restaurante.puntos[0].valor)} en {primeraOla} y {fmt(restaurante.puntos[restaurante.puntos.length - 1].valor)} en {ultimaOla},
                {restauranteParejo ? ' prácticamente donde estaba.' : ` ${decimal(Math.abs(restaurante.punta?.diferencia ?? 0))} puntos de diferencia.`}
              </>,
            ]}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                max={topeCosas}
                formato={fmt}
                descripcion={`Vive a menos de diez cuadras de un mall chino y de un restaurante chino, por oleada. ${[...mall.puntos.map((p) => `Mall ${p.ola}: ${fmt(p.valor)}`), ...restaurante.puntos.map((p) => `Restaurante ${p.ola}: ${fmt(p.valor)}`)].join('. ')}.`}
                filas={[
                  ...barrasDeSerie(mall, 'Mall', (i) => reducido || activo > 0 || i === 0, reducido ? undefined : (activo === 0 ? 0 : activo === 1 ? mall.puntos.length - 1 : undefined)),
                  ...barrasDeSerie(restaurante, 'Restaurante', () => reducido || activo >= 2),
                ]}
              />
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                Sobre {mall.puntos.map((p, i) => `${i === 0 ? '' : i === mall.puntos.length - 1 ? ' y ' : ', '}${numero(p.n)}`).join('')} personas
                encuestadas. Es lo que cada persona dice tener cerca, no un dato de su dirección.
              </p>
            )}
          />

          <Respiro raiz={raiz} indice={-1} titulo="¿Y con personas?">
            ¿Y con <strong>personas</strong>?
          </Respiro>

          {/* Escena 2: las personas. Una sola serie, y lo que la escena afirma es que no se mueve. */}
          <Escena
            indice={2}
            raiz={raiz}
            dosColumnas
            titulo={titularPersonas}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={[
              <>En {primeraOla}, el <strong>{fmt(conoce.puntos[0].valor)}</strong> decía conocer personalmente a alguien de China o de ascendencia china.</>,
              // Con su signo de porcentaje (pedido de Felipe, 22-09-2026), y los dos años se dicen juntos solo
              // mientras redondeen igual: el día que dejen de hacerlo, la frase los separa sola.
              fmt(conoce.puntos[1].valor) === fmt(conoce.puntos[2].valor)
                ? <>En {conoce.puntos[1].ola} y en {ultimaOla} el <strong>{fmt(conoce.puntos[1].valor)}</strong>. {cierreConoce}</>
                : <>En {conoce.puntos[1].ola} el <strong>{fmt(conoce.puntos[1].valor)}</strong> y en {ultimaOla} el <strong>{fmt(conoce.puntos[2].valor)}</strong>. {cierreConoce}</>,
            ]}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                max={topePersonas}
                formato={fmt}
                descripcion={`Conoce personalmente a alguien de China o de ascendencia china, por oleada. ${conoce.puntos.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}.`}
                filas={barrasDeSerie(conoce, '', (i) => reducido || activo >= 1 || i === 0, reducido || activo !== 0 ? undefined : 0)}
              />
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                {conoce.puntos.map((p, i) => `${i === 0 ? '' : i === conoce.puntos.length - 1 ? ' y ' : ', '}${casosDe(p.valor, p.n)} de ${numero(p.n)}`).join('')} personas
                encuestadas.
              </p>
            )}
          />

          {nubeContacto && mallContacto && (
            <>
              <Respiro raiz={raiz} indice={-2} titulo="¿Y dónde es ese contacto?">
                ¿Y <strong>dónde</strong> es ese contacto?
              </Respiro>

              {/* Escena 3: dónde ocurre el contacto (`p16`, abierta). Las respuestas abiertas van
                  repartidas en las historias por decisión de Felipe (22-09-2026). Una fila por lugar
                  y un punto por oleada; lo que afirma es que el mall no se mueve. */}
              <Escena
                indice={3}
                raiz={raiz}
                dosColumnas
                titulo={titularContacto}
                cabecera={(activo) => (
                  <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
                )}
                frases={[
                  <>En {primeraOla}, el <strong>{fmt(mallContacto.puntos[0].valor)}</strong> nombraba el mall; también aparecían las compras y el restaurante.</>,
                  <>
                    En {mallContacto.puntos.at(-2)!.ola}, el <strong>{fmt(mallContacto.puntos.at(-2)!.valor)}</strong>; en {ultimaOla}, el <strong>{fmt(mallContacto.puntos.at(-1)!.valor)}</strong>.
                    {mallQuieto ? ' Tres oleadas en el mismo rango.' : ' Esta vez la cifra se mueve.'}
                  </>,
                ]}
                figura={(activo, reducido) => (
                  <div className="flex flex-col gap-2">
                    <p className="sr-only">{`Dónde tiene contacto con personas de China, en porcentaje de quienes contestaron, por oleada. ${filasContacto.map((f) => `${f.etiqueta}: ${f.valores.map((v) => (v === null ? 'sin dato' : fmt(v))).join(', ')}`).join('. ')}.`}</p>
                    <Puntos
                      series={encuesta.olas.map((ola, i) => ({ clave: String(ola), etiqueta: String(ola), color: tonos[i] }))}
                      filas={filasContacto}
                      escala={{ min: 0, max: topeContacto }}
                      formato={(v) => decimal(v, 1)}
                      formatoEje={(v) => decimal(v, 0)}
                      titulo={(fila, serie, valor) => `«${fila.etiqueta}» · ${serie.etiqueta}: ${fmt(valor)}`}
                      marcas={topeContacto / 10 + 1}
                      anchoEtiqueta="6rem"
                      compacto
                      altoFila={30}
                      radioCreciente
                      leyenda={false}
                      unidadEje="% que lo nombra"
                      rotular={activo === 0 ? 0 : encuesta.olas.length - 1}
                      visible={(_fila, ola) => reducido || activo >= 1 || ola === String(primeraOla)}
                    />
                    <LeyendaDeOleadas olas={encuesta.olas} tonos={tonos} />
                  </div>
                )}
                nota={(
                  <p className="text-xs leading-snug text-gray-500">
                    Respuesta abierta; se puede nombrar más de un lugar. Sin «chino», que repite la pregunta. Sobre{' '}
                    {encuesta.olas.map((o) => numero(nubeContacto.baseOla?.[String(o)] ?? 0)).join(', ')} personas.
                    {nubeTrato && buena && <> Desde {buena.puntos[0].ola} se pregunta cómo fue ese contacto: «buena» la escribe el {buena.puntos.map((p) => fmt(p.valor)).join(' y el ')}.</>}
                  </p>
                )}
              />
            </>
          )}

          <Respiro raiz={raiz} indice={-3} titulo="¿Y en la calle?">
            ¿Y en la <strong>calle</strong>?
          </Respiro>

          {/* Escena 4: los buses eléctricos, solo en la oleada que preguntó. Cambia de filas en el
              segundo paso (de si sabía la marca a cómo evalúa la electrificación) sin cambiar de eje. */}
          <Escena
            indice={nubeContacto && mallContacto ? 4 : 3}
            raiz={raiz}
            dosColumnas
            titulo={titularBuses}
            cabecera={() => <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={encuesta.olas.indexOf(sabia.ola)} />}
            frases={[
              <>En {sabia.ola}, el <strong>{fmt(noSabia?.porcentaje ?? 0)}</strong> no sabía que los buses eléctricos de Santiago son de marcas chinas.</>,
              <>Y el <strong>{fmt(venBien)}</strong> ve bien que el 30 % de la flota sea eléctrica.</>,
              sabiaSepara
                ? <>Quienes sabían la marca la ven aún mejor: <strong>{fmt(busSabia?.media ?? 0)}</strong> contra <strong>{fmt(busNoSabia?.media ?? 0)}</strong>.</>
                : <>Entre quienes sabían la marca y quienes no, queda <strong>parejo</strong>: {fmt(busSabia?.media ?? 0)} contra {fmt(busNoSabia?.media ?? 0)}.</>,
            ]}
            figura={(activo, reducido) => {
              // **Dos preguntas distintas, dos formas distintas** (pedido de Felipe, 21-09-2026: con
              // las mismas barras y los mismos rótulos, el cambio de pregunta no se veía). Primero una
              // sola barra partida al 100 %, porque «lo sabía» y «no lo sabía» son las dos mitades de
              // la misma gente; después barras de «ve bien», cada una con su grupo escrito entero. La
              // pregunta va escrita arriba de cada figura.
              const partes = [noSabia, siSabia].filter((x): x is NonNullable<typeof x> => Boolean(x))
              const barraPartida = (
                <figure className="m-0">
                  <p className="mb-2 text-sm font-semibold text-gray-800">¿Sabía que los buses eléctricos son de marcas chinas?</p>
                  <div className="flex h-[38px] w-full overflow-hidden rounded-sm" aria-hidden>
                    {partes.map((x) => {
                      const fondo = x.codigo === 2 ? tonoBuses : NEUTRO
                      return (
                        <div
                          key={x.codigo}
                          className="relative flex items-center px-2 text-[13px] font-semibold tabular-nums"
                          style={{ width: `${x.porcentaje}%`, backgroundColor: fondo, color: tintaSobre(fondo) }}
                          title={`${x.codigo === 2 ? 'No lo sabía' : 'Lo sabía'}: ${fmt(x.porcentaje)} (n = ${numero(marca.base)})`}
                        >
                          {x.codigo === 2 && !reducido && <Enfasis />}
                          <span className="whitespace-nowrap">{x.codigo === 2 ? 'No lo sabía' : 'Lo sabía'} · {fmt(x.porcentaje)}</span>
                        </div>
                      )
                    })}
                  </div>
                </figure>
              )
              const filasOpinion = [
                { clave: 'bien-todas', etiqueta: 'Todas las personas', valor: venBien, n: opinion.base, color: IDENTIDAD[0], encendida: true },
                ...[busSabia, busNoSabia]
                  .filter((t): t is NonNullable<typeof t> => Boolean(t))
                  .map((t) => ({
                    clave: `bien-${t.nombre}`,
                    etiqueta: t.nombre === 'Sabía' ? 'Quienes lo sabían' : 'Quienes no lo sabían',
                    valor: t.media ?? 0,
                    n: t.n,
                    color: IDENTIDAD[0],
                    encendida: reducido || activo >= 2,
                  })),
              ]
              const descripcion = `En ${sabia.ola}. Sabía que los buses son de marcas chinas: ${partes.map((x) => `${x.codigo === 2 ? 'no' : 'sí'} ${fmt(x.porcentaje)}`).join(', ')}. Ve bien la electrificación: ${filasOpinion.map((f) => `${f.etiqueta} ${fmt(f.valor)}`).join(', ')}.`
              const barrasOpinion = (
                <figure className="m-0">
                  <p className="mb-2 text-sm font-semibold text-gray-800">Ve bien que el 30 % de la flota sea eléctrica</p>
                  <BarrasDeEscena filas={filasOpinion} max={100} formato={fmt} descripcion={descripcion} />
                </figure>
              )
              if (reducido) return <div className="flex flex-col gap-5">{barraPartida}{barrasOpinion}</div>
              return activo === 0 ? <><p className="sr-only">{descripcion}</p>{barraPartida}</> : barrasOpinion
            }}
            nota={(activo, reducido) => {
              const deLaMarca = (
                <p className="text-xs leading-snug text-gray-500">
                  {numero(marca.base)} personas encuestadas en {sabia.ola}, la única oleada con estas preguntas.
                </p>
              )
              const deLaOpinion = (
                <p className="text-xs leading-snug text-gray-500">
                  «Ve bien» es muy positivo o positivo, sobre {numero(opinion.base)} personas: {numero(busSabia?.n ?? 0)} lo sabían y {numero(busNoSabia?.n ?? 0)} no. Es una
                  asociación: no dice que saber la marca cambie la opinión.
                </p>
              )
              if (reducido) return <div className="flex flex-col gap-2">{deLaMarca}{deLaOpinion}</div>
              return activo === 0 ? deLaMarca : deLaOpinion
            }}
          />

          <Respiro raiz={raiz} indice={-4} titulo="¿Y qué se ve?">
            ¿Y qué se <strong>ve</strong>?
          </Respiro>

          {/* Escena 4: la serie de lo que se ve y, en el último paso, quién lo ve. **Cambia de
              filas sin cambiar de eje**: el tope sale de los dos juegos de filas juntos. */}
          <Escena
            indice={nubeContacto && mallContacto ? 5 : 4}
            raiz={raiz}
            dosColumnas
            titulo={titularVisto}
            cabecera={(activo) => (
              // El año en grande es el del paso, así que en el paso que enciende dos oleadas no se
              // dibuja: poner una de las dos sería falso. El hueco queda para que la figura no salte.
              activo === 0
                ? <div className="h-[34px]" aria-hidden />
                : <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={encuesta.olas.length - 1} />
            )}
            frases={[
              <>
                En {primeraOla} lo reportó el <strong>{fmt(racismo.puntos[0].valor)}</strong> de las personas encuestadas;
                en {racismo.puntos[1].ola}, el <strong>{fmt(racismo.puntos[1].valor)}</strong>.
                {racismoParejoEntreAnios ? ' De un año al otro, la baja es demasiado chica para afirmarla.' : ' Cada año, la baja se sostiene.'}
              </>,
              <>
                En {ultimaOla}, el <strong>{fmt(racismo.puntos[2].valor)}</strong>: {decimal(Math.abs(racismo.punta?.diferencia ?? 0))} puntos
                menos que en {primeraOla}. {racismoBaja ? 'Sumada, la baja sí se sostiene.' : 'Ni sumada se sostiene.'}
              </>,
              <>
                {contactoSeparado
                  ? <>Quienes conocen personalmente a alguien de China <strong>lo reportan más</strong>: {fmt(conConocidos?.media ?? 0)} contra {fmt(sinConocidos?.media ?? 0)} en {contacto.ola}.</>
                  : <>Entre quienes conocen y no conocen a alguien de China <strong>queda parejo</strong>: {fmt(conConocidos?.media ?? 0)} contra {fmt(sinConocidos?.media ?? 0)} en {contacto.ola}.</>}
              </>,
            ]}
            figura={(activo, reducido) => {
              const serie = barrasDeSerie(
                racismo, '',
                (i) => reducido || i <= (activo === 0 ? 1 : 2),
                reducido || activo !== 1 ? undefined : 2,
              )
              const grupos = [sinConocidos, conConocidos]
                .filter((t): t is NonNullable<typeof t> => Boolean(t))
                .map((t) => ({
                  clave: `contacto-${t.nombre}`,
                  etiqueta: t.nombre,
                  valor: t.media ?? 0,
                  n: t.n,
                  // Los dos grupos no son una secuencia: un solo color, y la fila rotula.
                  color: IDENTIDAD[0],
                  encendida: true,
                }))
              const descripcion = `Dice haber visto racismo contra personas chinas o asiáticas. Por oleada: ${racismo.puntos.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}. En ${contacto.ola}, según si conoce a alguien de China: ${grupos.map((g) => `${g.etiqueta}: ${fmt(g.valor)}`).join('. ')}.`
              // Con movimiento reducido la escena muestra las dos figuras: la mitad del texto habla
              // de la que no estaría.
              if (reducido) {
                return (
                  <div className="flex flex-col gap-3">
                    <BarrasDeEscena filas={serie} max={topeVisto} formato={fmt} descripcion={descripcion} />
                    <BarrasDeEscena filas={grupos} max={topeVisto} formato={fmt} descripcion="" />
                  </div>
                )
              }
              return (
                <BarrasDeEscena
                  filas={activo >= 2 ? grupos : serie}
                  max={topeVisto}
                  formato={fmt}
                  descripcion={descripcion}
                />
              )
            }}
            // El pie sigue al paso: la escena cambia de figura en el último y el pie que describe
            // la serie no describe los dos grupos.
            // Con movimiento reducido van las dos figuras, así que van los dos pies.
            nota={(activo, reducido) => {
              const deLaSerie = notaDeSerie(racismo, `: baja la proporción, no el número de personas. ${racismo.advertencia} Y que menos personas lo reporten no dice si hay menos racismo o si el tema se nota menos.`)
              const delContacto = (
                <p className="text-xs leading-snug text-gray-500">
                  {casosDe(sinConocidos?.media ?? 0, sinConocidos?.n ?? 0)} de {numero(sinConocidos?.n ?? 0)} y{' '}
                  {casosDe(conConocidos?.media ?? 0, conConocidos?.n ?? 0)} de {numero(conConocidos?.n ?? 0)} personas
                  encuestadas en {contacto.ola}. Es una asociación en la encuesta: no dice si el contacto cambia lo que
                  se ve o lo que se reconoce como racista, ni descarta otras diferencias entre los dos grupos.
                </p>
              )
              if (reducido) return <div className="flex flex-col gap-2">{deLaSerie}{delContacto}</div>
              return activo >= 2 ? delContacto : deLaSerie
            }}
          />

          <Cierre
            raiz={raiz}
            titulo="China cotidiana"
            frases={[
              { escena: 1, texto: titularCosas },
              { escena: 2, texto: titularPersonas },
              // El contacto (escena 3) no entra: es descriptivo, y con cinco titulares el cierre no
              // cabe en 360×640 (medido el 22-09-2026).
              { escena: nubeContacto && mallContacto ? 4 : 3, texto: titularBuses },
              { escena: nubeContacto && mallContacto ? 5 : 4, texto: titularVisto },
            ]}
          />
        </>
      )}
    </CapaRecorrido>
  )
}

