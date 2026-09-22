import { Navigate, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import Puntos from '../componentes/Puntos'
import MapaRegiones from '../componentes/MapaRegiones'
import { distribucion } from '../nucleo/agregar'
import { EXPOSICION, NEUTRO, SEMANTICOS, pasosDeOrden, tintaSobre } from '../nucleo/paleta'
import { decimal, numero, porcentaje } from '../locale'
import { AnioDelPaso, LeyendaDeOleadas } from './comun'
import { serieDeMedida } from './lectura'

/**
 * La historia «Donde uno vive»: China en la economía de la región y la comuna.
 *
 * Bloque 3 de la guía de contexto de ICLAC. **Es descriptiva** (decisión de Felipe, 22-09-2026):
 * su hipótesis central, que a más exposición de la región menos riesgo se percibe, no se sostiene
 * en ninguna oleada (`riesgo-estrato`), y la caída de «proveedor» no pasa la corrección del bloque.
 * Lo que sí se sostiene, y se dice: el riesgo total no se mueve (`riesgo-comuna`), la exposición no
 * lo ordena, y «proveedor» es la respuesta más frecuente en las tres oleadas contra cada una de las
 * otras (`p8-proveedor-sobre-*`).
 *
 * **Nada suma oleadas.** Juntar las tres para tener más casos por estrato mezclaría tres muestras,
 * con 2025 pesando el doble, y dibujaría una pendiente que ninguna oleada tiene.
 *
 * **Reordenada el 22-09-2026** con Codex, por el comentario de Felipe: el riesgo va primero (qué se
 * intenta explicar), después el mapa real (cómo se agruparon las regiones, un solo paso) y al final
 * la comparación. El estrato del diseño muestral se dice «nivel de exposición económica a China» y
 * se define una vez; la palabra «estrato» no aparece en pantalla.
 */

const ESTRATOS = ['Muy alto', 'Alto', 'Medio', 'Bajo'] as const
/** Cómo se dice cada nivel en la historia: «exposición» es femenino, y el dato viene en masculino. */
const NIVEL: Record<string, string> = { 'Muy alto': 'Muy alta', Alto: 'Alta', Medio: 'Media', Bajo: 'Baja' }
const colorEstrato = (e: string) => EXPOSICION[3 - ESTRATOS.indexOf(e as typeof ESTRATOS[number])]

export function HistoriaTerritorio ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  const navegar = useNavigate()
  const riesgo = serieDeMedida(encuesta, 'riesgo-comuna')
  const desacuerdo = serieDeMedida(encuesta, 'riesgo-desacuerdo')
  const indiferente = serieDeMedida(encuesta, 'riesgo-indiferente')
  const netoRiesgo = encuesta.contrastes?.brechas.find((b) => b.id === 'riesgo-desacuerdo-sobre-acuerdo')
  const proveedor = serieDeMedida(encuesta, 'p8-proveedor')
  const p7 = encuesta.variables.find((v) => v.nombre === 'p7')
  const p8 = encuesta.variables.find((v) => v.nombre === 'p8')
  const p2 = encuesta.variables.find((v) => v.nombre === 'p2')
  const estrato = encuesta.contrastes?.grupos.find((g) => g.id === 'riesgo-estrato')
  const brechas = encuesta.contrastes?.brechas ?? []

  const tonos = pasosDeOrden(encuesta.olas.length)
  const fmt = (v: number) => porcentaje(v, 1)

  if (!riesgo || !desacuerdo || !indiferente || !netoRiesgo || !proveedor || !p7 || !p8 || !p2 || !estrato) return <Navigate to="/" replace />

  const primeraOla = encuesta.olas[0]
  const ultimaOla = encuesta.olas[encuesta.olas.length - 1]
  const deOla = (ola: number) => encuesta.casos.filter((c) => Number(c.ola) === ola)
  const parejo = (s: NonNullable<typeof riesgo>) => s.consecutivas.every((c) => c.p >= 0.05) && (s.punta?.p ?? 0) >= 0.05
  /** Holm sobre una familia `{ clave: p }`, igual que en `scripts/contrastes.test.mjs`. */
  const holm = (familia: Record<string, number>) => {
    const orden = Object.entries(familia).sort((a, b) => a[1] - b[1])
    let previo = 0
    return Object.fromEntries(orden.map(([k, p], i) => {
      previo = Math.max(previo, Math.min(1, p * (orden.length - i)))
      return [k, previo]
    }))
  }

  // ---------------------------------------------------------------- Escena 1: el mapa del diseño
  const regiones = [...encuesta.regiones].sort((a, b) => a.orden - b.orden).map((r) => {
    const caso = encuesta.casos.find((c) => Number(c.region) === r.codigo)
    return { ...r, estrato: caso ? String(caso.region_impacto) : '' }
  }).filter((r) => r.estrato)
  const regionesDe = (e: string) => regiones.filter((r) => r.estrato === e).map((r) => r.etiqueta)
  const lista = (xs: string[]) => xs.join(', ').replace(/, ([^,]*)$/, ' y $1')
  const porEstrato = ESTRATOS.map((e) => ({ e, n: deOla(ultimaOla).filter((c) => c.region_impacto === e).length }))

  // ------------------------------------------------- Escena 1: la pregunta entera, no un solo lado
  // **Las tres partes, no la caja de arriba.** `p7` pregunta acuerdo o desacuerdo, y contar solo a
  // quienes están de acuerdo deja fuera al 70 % (Felipe, 22-09-2026). Cada parte tiene su contraste,
  // y cuál lado pesa más se compara dentro de la persona, que es una sola respuesta.
  const PARTES = [
    { clave: 'desacuerdo', etiqueta: 'En desacuerdo', serie: desacuerdo, color: SEMANTICOS.Mucha },
    { clave: 'indiferente', etiqueta: 'Indiferente', serie: indiferente, color: NEUTRO },
    { clave: 'acuerdo', etiqueta: 'De acuerdo', serie: riesgo, color: SEMANTICOS.Ninguna },
  ]
  const partesQuietas = PARTES.every((x) => parejo(x.serie!))
  const holmNeto = holm(Object.fromEntries(netoRiesgo.porOla.map((o) => [String(o.ola), o.p])))
  const masDesacuerdo = netoRiesgo.porOla.every((o) => o.diferencia > 0) && Object.values(holmNeto).every((p) => p < 0.05)
  const titularRiesgo = masDesacuerdo
    ? 'Hay más desacuerdo que acuerdo con que el acercamiento con China haya traído más riesgos que oportunidades'
    : 'Qué contestan sobre si el acercamiento con China trajo más riesgos que oportunidades'
  // **Una barra por año, en tres partes** (Felipe, 22-09-2026: las cinco categorías confundían).
  // Cada lado es la suma de sus dos respuestas, que es lo que se contrasta; la nota lo declara.
  const repartoP7 = encuesta.olas.map((ola) => {
    const d = distribucion(deOla(ola), p7)
    const pct = (codigos: number[]) => d.segmentos.filter((x) => codigos.includes(x.codigo)).reduce((t, x) => t + x.porcentaje, 0)
    return { ola, base: d.base, desacuerdo: pct([1, 2]), indiferente: pct([3]), acuerdo: pct([4, 5]) }
  })
  type Reparto = typeof repartoP7[number]
  const TRES: { clave: string, etiqueta: string, color: string, valor: (r: Reparto) => number }[] = [
    { clave: 'desacuerdo', etiqueta: 'En desacuerdo', color: SEMANTICOS.Mucha, valor: (r) => r.desacuerdo },
    { clave: 'indiferente', etiqueta: 'Indiferente', color: NEUTRO, valor: (r) => r.indiferente },
    { clave: 'acuerdo', etiqueta: 'De acuerdo', color: SEMANTICOS.Ninguna, valor: (r) => r.acuerdo },
  ]
  const netoMedio = Math.round(netoRiesgo.porOla.reduce((t, o) => t + o.diferencia, 0) / netoRiesgo.porOla.length)
  const enOla = (serie: NonNullable<typeof riesgo>, ola: number) => serie.puntos.find((p) => p.ola === ola)?.valor ?? 0

  // ------------------------------------------- Escena 3: el mismo neto, según el nivel de exposición
  const neto = encuesta.contrastes?.grupos.find((g) => g.id === 'riesgo-neto-exposicion') ?? estrato
  const olasEstrato = neto.porOla.filter((o) => o.brecha)
  const holmEstrato = holm(Object.fromEntries(olasEstrato.map((o) => [String(o.ola), o.brecha!.p])))
  const noOrdena = Object.values(holmEstrato).every((p) => p >= 0.05)
  const titularEstrato = noOrdena
    ? 'La exposición económica de la región a China no ordena las respuestas'
    : 'Las respuestas, según la exposición económica de la región a China'
  const tramo = (ola: number, e: string) => neto.porOla.find((o) => o.ola === ola)?.tramos.find((t) => t.nombre === e)
  const valorTramo = (ola: number, e: string) => tramo(ola, e)?.media ?? null
  const filasEstrato = ESTRATOS.map((e) => ({ clave: e, etiqueta: NIVEL[e], color: colorEstrato(e), valores: olasEstrato.map((o) => valorTramo(o.ola, e)) }))
  const seriesEstrato = olasEstrato.map((o) => ({ clave: String(o.ola), etiqueta: String(o.ola), color: tonos[encuesta.olas.indexOf(o.ola)] }))
  const enesEstrato = olasEstrato.flatMap((o) => o.tramos.map((t) => t.n))
  const [o1, o2, o3] = olasEstrato.map((o) => o.ola)
  const masBajo = (ola: number) => ESTRATOS.map((e) => ({ e, v: valorTramo(ola, e) ?? Infinity })).sort((a, b) => a.v - b.v)[0]
  const masAlto = (ola: number) => ESTRATOS.map((e) => ({ e, v: valorTramo(ola, e) ?? -Infinity })).sort((a, b) => b.v - a.v)[0]
  // Eje con el cero adentro: el neto puede ser negativo (en 2024 el nivel bajo queda en −1,4).
  const pisoNeto = Math.min(0, Math.floor(Math.min(...olasEstrato.flatMap((o) => o.tramos.map((t) => t.media ?? 0))) / 5) * 5)
  const techoNeto = Math.ceil(Math.max(...olasEstrato.flatMap((o) => o.tramos.map((t) => t.media ?? 0))) / 5) * 5


  // ---------------------------------------------------------------- Escena 4: el rol en la comuna
  const ROLES = [[3, 'Proveedor'], [1, 'Inversor'], [2, 'Comprador'], [4, 'Competidor']] as const
  const repartos = encuesta.olas.map((ola) => ({ ola, r: distribucion(deOla(ola), p8) }))
  const pctRol = (ola: number, codigo: number) => repartos.find((x) => x.ola === ola)?.r.segmentos.find((s) => s.codigo === codigo)?.porcentaje ?? null
  const filasRol = ROLES.map(([codigo, nombre]) => ({ clave: String(codigo), etiqueta: nombre, valores: encuesta.olas.map((ola) => pctRol(ola, codigo)) }))
  const seriesRol = encuesta.olas.map((ola, i) => ({ clave: String(ola), etiqueta: String(ola), color: tonos[i] }))
  // «La más frecuente» se afirma contra cada una de las otras tres en cada oleada (nueve pruebas).
  const ventajas = brechas.filter((b) => b.id.startsWith('p8-proveedor-sobre-')).flatMap((b) => b.porOla)
  const holmVentajas = holm(Object.fromEntries(ventajas.map((v, i) => [String(i), v.p])))
  const proveedorPrimero = ventajas.length === 9 && ventajas.every((v) => v.diferencia > 0) && Object.values(holmVentajas).every((p) => p < 0.05)
  // La caída de proveedor, corregida con su familia del bloque (el estrato de 2023, proveedor e inversor).
  const inversor = serieDeMedida(encuesta, 'p8-inversor')
  const holmBloque = holm({
    estrato: estrato.porOla.find((o) => o.ola === primeraOla)?.brecha?.p ?? 1,
    proveedor: proveedor.punta?.p ?? 1,
    inversor: inversor?.punta?.p ?? 1,
  })
  const caidaFirme = (proveedor.punta?.diferencia ?? 0) < 0 && holmBloque.proveedor < 0.05
  const titularRol = proveedorPrimero
    ? 'Para su comuna, China es ante todo un proveedor, en las tres oleadas'
    : 'Qué es China para la comuna'
  const topeRol = Math.min(100, Math.ceil(Math.max(...filasRol.flatMap((f) => f.valores.map((v) => v ?? 0))) / 20) * 20)
  const proveedorSector = distribucion(deOla(ultimaOla), p2).segmentos.find((s) => s.codigo === 3)?.porcentaje ?? null
  const segundo = (ola: number) => ROLES.slice(1).map(([c, n]) => ({ n, v: pctRol(ola, c) ?? 0 })).sort((a, b) => b.v - a.v)[0]

  return (
    <CapaRecorrido
      abierta={abierta}
      alCerrar={() => { navegar('/') }}
      salida="Volver a las historias"
      metodo="metodo-territorio"
      titulo="Donde uno vive"
    >
      {(raiz) => (
        <>
          <Portada raiz={raiz} titulo="¿Pesa China distinto según dónde se vive?">
            <img
              src={`${import.meta.env.BASE_URL}icons/iclac.webp`}
              alt="ICLAC"
              className="logo-portada h-12 w-auto object-contain"
            />
            <h2 className="pregunta-portada my-auto max-w-[22ch] text-balance font-display text-[34px] font-semibold leading-[1.12] text-gray-900">
              ¿Pesa China distinto según dónde se vive?
            </h2>
          </Portada>

          {/* Escena 1: las tres partes de la pregunta, una tanda de barras por oleada. Va primero para
              que el lector sepa qué se intenta explicar antes del mapa (Felipe y Codex, 22-09-2026). */}
          <Escena
            indice={1}
            raiz={raiz}
            dosColumnas
            titulo={titularRiesgo}
            frases={[
              <>
                En {primeraOla}, el <strong>{fmt(enOla(desacuerdo, primeraOla))}</strong> estaba en desacuerdo con que el acercamiento
                con China trajera más riesgos que oportunidades; el <strong>{fmt(enOla(riesgo, primeraOla))}</strong>, de acuerdo.
              </>,
              <>
                {partesQuietas
                  ? <>En {encuesta.olas.at(-2)} y en {ultimaOla} el reparto es casi el mismo: <strong>ninguna de las tres partes se mueve</strong>.</>
                  : <>En {encuesta.olas.at(-2)} y en {ultimaOla} el reparto cambia.</>}
              </>,
              <>
                {masDesacuerdo
                  ? <>En cada oleada, el desacuerdo supera al acuerdo por <strong>unos {netoMedio} puntos</strong>, y la diferencia se sostiene.</>
                  : <>Entre los dos lados no hay una diferencia que se pueda afirmar.</>}
              </>,
            ]}
            figura={(activo, reducido) => (
              <div className="riesgo-partes flex flex-col gap-2.5">
                <p className="sr-only">{`Respuestas a si el acercamiento con China generó más riesgos que oportunidades, por oleada. ${repartoP7.map((r) => `${r.ola}: ${TRES.map((x) => `${x.etiqueta} ${fmt(x.valor(r))}`).join(', ')}`).join('. ')}.`}</p>
                {repartoP7.map((r, i) => (
                  <div
                    key={r.ola}
                    aria-hidden
                    className="flex flex-col gap-1 transition-opacity duration-500"
                    style={{ opacity: reducido || activo > 0 || i === 0 ? 1 : 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-9 shrink-0 text-xs tabular-nums text-gray-700">{r.ola}</span>
                      <div className="flex h-[30px] grow gap-[2px] overflow-hidden rounded-sm">
                        {TRES.map((x) => (
                          <div
                            key={x.clave}
                            className="flex items-center justify-center text-[12px] font-semibold tabular-nums"
                            style={{ width: `${x.valor(r)}%`, background: x.color, color: tintaSobre(x.color) }}
                            title={`${r.ola} · ${x.etiqueta}: ${fmt(x.valor(r))} (n = ${numero(r.base)})`}
                          >
                            {fmt(x.valor(r))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <ul aria-hidden className="ml-11 flex flex-wrap gap-x-3 gap-y-1">
                  {TRES.map((x) => (
                    <li key={x.clave} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: x.color }} />
                      {x.etiqueta}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                {riesgo.puntos.map((p, i) => `${i === 0 ? '' : i === riesgo.puntos.length - 1 ? ' y ' : ', '}${numero(p.n)}`).join('')} personas
                encuestadas. «Desacuerdo» suma muy en desacuerdo y en desacuerdo; «acuerdo», de acuerdo y muy de acuerdo. Pide
                pensar en la propia comuna, aunque la frase hable de Chile.
              </p>
            )}
          />

          <Respiro raiz={raiz} indice={-1} titulo="¿Influye cuánto pesa China en la economía de la región?">
            ¿Influye cuánto pesa China en la <strong>economía de la región</strong>?
          </Respiro>

          {/* Escena 2: cómo se agruparon las regiones, con el mapa real (simplemaps; pedido de Felipe,
              22-09-2026). Un solo paso: explica la comparación que viene, no es un resultado. El
              término se define una vez acá, «exposición económica a China», y no se dice «estrato». */}
          <Escena
            indice={2}
            raiz={raiz}
            dosColumnas
            titulo="La encuesta compara regiones con distinto vínculo económico con China"
            frases={[
              <>Las regiones se agruparon en <strong>cuatro niveles de exposición económica a China</strong>, según cuánto pesa China en su economía, sobre todo por lo que le exportan.</>,
            ]}
            figura={() => (
              <div className="flex items-center gap-4">
                <MapaRegiones
                  relleno={(codigo) => colorEstrato(regiones.find((r) => r.codigo === codigo)?.estrato ?? '')}
                  descripcion={`Mapa de Chile por nivel de exposición económica a China. ${ESTRATOS.map((e) => `${NIVEL[e]}: ${lista(regionesDe(e))}`).join('. ')}.`}
                />
                <ul aria-hidden className="flex flex-col gap-2.5">
                  {ESTRATOS.map((e) => (
                    <li key={e} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: colorEstrato(e) }} />
                      <span className="text-[12px] leading-snug text-gray-700">
                        <span className="font-semibold text-gray-900">{NIVEL[e]}</span>
                        <br />
                        {lista(regionesDe(e))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                El nivel es de la región; la pregunta del riesgo habla de la comuna o ciudad de cada persona. Personas por nivel
                en {ultimaOla}: {porEstrato.map((x) => `${NIVEL[x.e].toLowerCase()} ${numero(x.n)}`).join(', ')}. Mapa: simplemaps.com.
              </p>
            )}
          />

          <Respiro raiz={raiz} indice={-2} titulo="¿Cambia el riesgo según esa exposición?">
            ¿Cambia el riesgo según esa <strong>exposición</strong>?
          </Respiro>

          {/* Escena 3: el riesgo por nivel de exposición, una oleada por paso y **nunca sumadas**. El eje sale de
              las tres juntas, así que no cambia al encenderse cada una. */}
          <Escena
            indice={3}
            raiz={raiz}
            dosColumnas
            titulo={titularEstrato}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={Math.min(activo, olasEstrato.length - 1)} />
            )}
            frases={[
              <>
                En {o1}, el desacuerdo ganaba por <strong>{decimal(valorTramo(o1, 'Muy alto') ?? 0, 1)} puntos</strong> en las regiones más expuestas
                y por <strong>{decimal(valorTramo(o1, 'Bajo') ?? 0, 1)}</strong> en las menos expuestas, pero la diferencia no alcanza para afirmarla.
              </>,
              masAlto(o2).e === 'Muy alto'
                ? <>En {o2}, las más expuestas siguen arriba, con <strong>{decimal(masAlto(o2).v, 1)}</strong>.</>
                : <>En {o2} el orden se desarma: arriba queda el nivel de exposición {NIVEL[masAlto(o2).e].toLowerCase()}, con <strong>{decimal(masAlto(o2).v, 1)}</strong>.</>,
              <>En {o3}, los cuatro niveles quedan <strong>entre {decimal(masBajo(o3).v, 1)} y {decimal(masAlto(o3).v, 1)} puntos</strong>.</>,
            ]}
            figura={(activo, reducido) => (
              <div className="flex flex-col gap-2">
                <p className="sr-only">{`Desacuerdo menos acuerdo con que el acercamiento con China trajo más riesgos que oportunidades, en puntos, según la exposición económica de su región. ${olasEstrato.map((o) => `${o.ola}: ${o.tramos.map((t) => `${NIVEL[t.nombre] ?? t.nombre} ${t.media === null ? 'sin casos' : decimal(t.media, 1)}`).join(', ')}`).join('. ')}.`}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Exposición económica a China</p>
                <Puntos
                  series={seriesEstrato}
                  filas={filasEstrato}
                  escala={{ min: pisoNeto, max: techoNeto }}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => `${fila.etiqueta} · ${serie.etiqueta}: ${decimal(valor, 1)} puntos`}
                  marcas={(techoNeto - pisoNeto) / 5 + 1}
                  anchoEtiqueta="4.5rem"
                  compacto
                  altoFila={27}
                  radioCreciente
                  leyenda={false}
                  unidadEje="puntos: desacuerdo − acuerdo"
                  rotular={Math.min(activo, seriesEstrato.length - 1)}
                  visible={(_fila, ola) => reducido || olasEstrato.findIndex((o) => String(o.ola) === ola) <= activo}
                />
                <LeyendaDeOleadas olas={olasEstrato.map((o) => o.ola)} tonos={seriesEstrato.map((s) => s.color)} />
              </div>
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                Entre {numero(Math.min(...enesEstrato))} y {numero(Math.max(...enesEstrato))} personas por nivel y oleada. Positivo es más
                desacuerdo que acuerdo. Se comparan las puntas, oleada por oleada: las oleadas no se suman.
              </p>
            )}
          />

          <Respiro raiz={raiz} indice={-3} titulo="¿Y qué es China para la comuna?">
            ¿Y qué <strong>es</strong> China para la comuna?
          </Respiro>

          {/* Escena 4: el rol de China en la comuna (`p8`), elección única. Una fila por rol y un
              punto por oleada, como los sectores de «Inversión y Estado». */}
          <Escena
            indice={4}
            raiz={raiz}
            dosColumnas
            titulo={titularRol}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={[
              <>
                En {primeraOla}, el <strong>{fmt(pctRol(primeraOla, 3) ?? 0)}</strong> veía a China como un proveedor importante para su comuna.
                Le seguía {segundo(primeraOla).n.toLowerCase()}, con {fmt(segundo(primeraOla).v)}.
              </>,
              // La baja de proveedor no pasa la corrección del bloque, así que la frase no la narra como
              // caída (Codex, 22-09-2026): da las cifras y lo que sí se sostiene.
              <>
                En {encuesta.olas.at(-2)}, el <strong>{fmt(pctRol(encuesta.olas.at(-2)!, 3) ?? 0)}</strong>; en {ultimaOla}, el <strong>{fmt(pctRol(ultimaOla, 3) ?? 0)}</strong>.
                {proveedorPrimero ? ' En las tres oleadas supera a inversor, comprador y competidor.' : caidaFirme ? ' Baja, y la baja se sostiene.' : ''}
              </>,
            ]}
            figura={(activo, reducido) => (
              <div className="flex flex-col gap-2">
                <p className="sr-only">{`Qué es China para su comuna, por oleada. ${encuesta.olas.map((ola) => `${ola}: ${ROLES.map(([c, n]) => `${n} ${fmt(pctRol(ola, c) ?? 0)}`).join(', ')}`).join('. ')}.`}</p>
                <Puntos
                  series={seriesRol}
                  filas={filasRol}
                  escala={{ min: 0, max: topeRol }}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => `${fila.etiqueta} · ${serie.etiqueta}: ${fmt(valor)}`}
                  marcas={topeRol / 20 + 1}
                  anchoEtiqueta="5.5rem"
                  compacto
                  altoFila={34}
                  radioCreciente
                  leyenda={false}
                  unidadEje="% de las personas"
                  rotular={activo === 0 ? 0 : seriesRol.length - 1}
                  visible={(_fila, ola) => reducido || activo >= 1 || ola === String(primeraOla)}
                />
                <LeyendaDeOleadas olas={encuesta.olas} tonos={tonos} />
              </div>
            )}
            nota={(
              <p className="text-xs leading-snug text-gray-500">
                Una respuesta por persona: {repartos.map((x) => `${numero(x.r.base)} en ${x.ola}`).join(', ')}.
                {proveedorSector !== null && <> Pensando en su propia área de trabajo, el {fmt(proveedorSector)} la ve como proveedor ({ultimaOla}).</>}
              </p>
            )}
          />

          <Cierre
            raiz={raiz}
            titulo="Donde uno vive"
            frases={[
              { escena: 1, texto: titularRiesgo },
              { escena: 3, texto: titularEstrato },
              { escena: 4, texto: titularRol },
            ]}
          />
        </>
      )}
    </CapaRecorrido>
  )
}
