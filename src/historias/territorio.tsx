import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Encuesta } from '../nucleo/tipos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import Puntos from '../componentes/Puntos'
import MapaRegiones from '../componentes/MapaRegiones'
import { distribucion } from '../nucleo/agregar'
import { corregido } from '../nucleo/prueba'
import { CONFIANZA, EXPOSICION, NEUTRO, pasosDeOrden, tintaSobre } from '../nucleo/paleta'
import { ESTRATOS, estrato } from '../nucleo/modulos'
import { decimal, lista, porcentaje, traducido, useIdioma } from '../locale'
import { AnioDelPaso, LeyendaDeOleadas } from './comun'
import { serieDeMedida } from './lectura'
import { FICHA, TEXTOS } from './textos/territorio'

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
 *
 * **El componente calcula y compone; no escribe texto.** Toda la prosa, en los tres idiomas, está en
 * `textos/territorio.tsx`, que recibe las cifras y las banderas en `Valores`.
 */

/** Las claves de los estratos (`region_impacto`), de mayor a menor exposición. El mapa vive en `modulos.ts`. */
const CLAVES: string[] = ESTRATOS.map(([clave]) => clave)
/** Cómo se dice cada nivel en la historia: «exposición» es femenino, y el dato viene en masculino. */
const nivel = (e: string) => { const r = estrato(e); return r ? traducido(r.nivel) : e }
const colorEstrato = (e: string) => EXPOSICION[3 - CLAVES.indexOf(e)]
/** Los roles de `p8` en el orden de la figura: proveedor primero. */
const ROLES = [3, 1, 2, 4] as const

export function HistoriaTerritorio ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  const navegar = useNavigate()
  const idioma = useIdioma()
  const { t: tc } = useTranslation('comun')
  const riesgo = serieDeMedida(encuesta, 'riesgo-comuna')
  const desacuerdo = serieDeMedida(encuesta, 'riesgo-desacuerdo')
  const indiferente = serieDeMedida(encuesta, 'riesgo-indiferente')
  const netoRiesgo = encuesta.contrastes?.brechas.find((b) => b.id === 'riesgo-desacuerdo-sobre-acuerdo')
  const proveedor = serieDeMedida(encuesta, 'p8-proveedor')
  const p7 = encuesta.variables.find((v) => v.nombre === 'p7')
  const p8 = encuesta.variables.find((v) => v.nombre === 'p8')
  const p2 = encuesta.variables.find((v) => v.nombre === 'p2')
  const estratoRiesgo = encuesta.contrastes?.grupos.find((g) => g.id === 'riesgo-estrato')
  const brechas = encuesta.contrastes?.brechas ?? []

  const tonos = pasosDeOrden(encuesta.olas.length)
  const fmt = (v: number) => porcentaje(v, 1)

  if (!riesgo || !desacuerdo || !indiferente || !netoRiesgo || !proveedor || !p7 || !p8 || !p2 || !estratoRiesgo) return <Navigate to="/" replace />

  const primeraOla = encuesta.olas[0]
  const penultimaOla = encuesta.olas[encuesta.olas.length - 2]
  const ultimaOla = encuesta.olas[encuesta.olas.length - 1]
  const deOla = (ola: number) => encuesta.casos.filter((c) => Number(c.ola) === ola)
  const parejo = (s: NonNullable<typeof riesgo>) => s.consecutivas.every((c) => c.p >= 0.05) && (s.punta?.p ?? 0) >= 0.05

  // ---------------------------------------------------------------- Escena 2: el mapa del diseño
  // El nombre visible de cada región sale de `comun:regiones` (el JSON de datos lo trae solo en español).
  const regiones = [...encuesta.regiones].sort((a, b) => a.orden - b.orden).map((r) => {
    const caso = encuesta.casos.find((c) => Number(c.region) === r.codigo)
    const nombre = tc(`regiones.${r.codigo}`, { defaultValue: r.etiqueta })
    return { ...r, nombre, estrato: caso ? String(caso.region_impacto) : '' }
  }).filter((r) => r.estrato)
  const regionesDe = (e: string) => regiones.filter((r) => r.estrato === e).map((r) => r.nombre)

  // ------------------------------------------------- Escena 1: la pregunta entera, no un solo lado
  // **Las tres partes, no la caja de arriba.** `p7` pregunta acuerdo o desacuerdo, y contar solo a
  // quienes están de acuerdo deja fuera al 70 % (Felipe, 22-09-2026). Cada parte tiene su contraste,
  // y cuál lado pesa más se compara dentro de la persona, que es una sola respuesta.
  const partesQuietas = [desacuerdo, indiferente, riesgo].every(parejo)
  // Holm viene del ETL, por familia (`FAMILIAS` en `scripts/lib/contrastes.mjs`): un dato, un lugar.
  const masDesacuerdo = netoRiesgo.porOla.every((o) => o.diferencia > 0 && corregido(o, 'neto-por-oleada') < 0.05)
  // **Una barra por año, en tres partes** (Felipe, 22-09-2026: las cinco categorías confundían).
  // Cada lado es la suma de sus dos respuestas, que es lo que se contrasta; la nota lo declara.
  const repartoP7 = encuesta.olas.map((ola) => {
    const d = distribucion(deOla(ola), p7)
    const pct = (codigos: number[]) => d.segmentos.filter((x) => codigos.includes(x.codigo)).reduce((t, x) => t + x.porcentaje, 0)
    return { ola, base: d.base, desacuerdo: pct([1, 2]), indiferente: pct([3]), acuerdo: pct([4, 5]) }
  })
  type Reparto = typeof repartoP7[number]
  const netoMedio = Math.round(netoRiesgo.porOla.reduce((t, o) => t + o.diferencia, 0) / netoRiesgo.porOla.length)
  const enOla = (serie: NonNullable<typeof riesgo>, ola: number) => serie.puntos.find((p) => p.ola === ola)?.valor ?? 0

  // ------------------------------------------- Escena 3: el mismo neto, según el nivel de exposición
  const neto = encuesta.contrastes?.grupos.find((g) => g.id === 'riesgo-neto-exposicion') ?? estratoRiesgo
  const olasEstrato = neto.porOla.filter((o) => o.brecha)
  const familiaNeto = neto.id === 'riesgo-neto-exposicion' ? 'neto-por-nivel' : 'estrato-por-oleada'
  const noOrdena = olasEstrato.every((o) => corregido(o.brecha, familiaNeto) >= 0.05)
  const tramo = (ola: number, e: string) => neto.porOla.find((o) => o.ola === ola)?.tramos.find((t) => t.nombre === e)
  const valorTramo = (ola: number, e: string) => tramo(ola, e)?.media ?? null
  const filasEstrato = CLAVES.map((e) => ({ clave: e, etiqueta: nivel(e), color: colorEstrato(e), valores: olasEstrato.map((o) => valorTramo(o.ola, e)) }))
  const seriesEstrato = olasEstrato.map((o) => ({ clave: String(o.ola), etiqueta: String(o.ola), color: tonos[encuesta.olas.indexOf(o.ola)] }))
  const enesEstrato = olasEstrato.flatMap((o) => o.tramos.map((t) => t.n))
  const [o1, o2, o3] = olasEstrato.map((o) => o.ola)
  const masBajo = (ola: number) => CLAVES.map((e) => ({ e, v: valorTramo(ola, e) ?? Infinity })).sort((a, b) => a.v - b.v)[0]
  const masAlto = (ola: number) => CLAVES.map((e) => ({ e, v: valorTramo(ola, e) ?? -Infinity })).sort((a, b) => b.v - a.v)[0]
  // Eje con el cero adentro: el neto puede ser negativo (en 2024 el nivel bajo queda en −1,4).
  const pisoNeto = Math.min(0, Math.floor(Math.min(...olasEstrato.flatMap((o) => o.tramos.map((t) => t.media ?? 0))) / 5) * 5)
  const techoNeto = Math.ceil(Math.max(...olasEstrato.flatMap((o) => o.tramos.map((t) => t.media ?? 0))) / 5) * 5

  // ---------------------------------------------------------------- Escena 4: el rol en la comuna
  const repartos = encuesta.olas.map((ola) => ({ ola, r: distribucion(deOla(ola), p8) }))
  const pctRol = (ola: number, codigo: number) => repartos.find((x) => x.ola === ola)?.r.segmentos.find((s) => s.codigo === codigo)?.porcentaje ?? null
  const seriesRol = encuesta.olas.map((ola, i) => ({ clave: String(ola), etiqueta: String(ola), color: tonos[i] }))
  // «La más frecuente» se afirma contra cada una de las otras tres en cada oleada (nueve pruebas).
  const ventajas = brechas.filter((b) => b.id.startsWith('p8-proveedor-sobre-')).flatMap((b) => b.porOla)
  const proveedorPrimero = ventajas.length === 9 && ventajas.every((v) => v.diferencia > 0 && corregido(v, 'proveedor-primero') < 0.05)
  // La caída de proveedor, corregida con su familia del bloque (el estrato de 2023, proveedor e inversor).
  const caidaFirme = (proveedor.punta?.diferencia ?? 0) < 0 && corregido(proveedor.punta, 'guia-bloque-3') < 0.05
  const proveedorSector = distribucion(deOla(ultimaOla), p2).segmentos.find((s) => s.codigo === 3)?.porcentaje ?? null
  const segundo = ROLES.slice(1).map((rol) => ({ rol, valor: pctRol(primeraOla, rol) ?? 0 })).sort((a, b) => b.valor - a.valor)[0]
  const topeRol = Math.min(100, Math.ceil(Math.max(...ROLES.flatMap((c) => encuesta.olas.map((ola) => pctRol(ola, c) ?? 0))) / 20) * 20)

  const t = TEXTOS[idioma]({
    primeraOla,
    penultimaOla,
    ultimaOla,
    desacuerdo1: enOla(desacuerdo, primeraOla),
    acuerdo1: enOla(riesgo, primeraOla),
    partesQuietas,
    masDesacuerdo,
    netoMedio,
    repartoP7,
    enesRiesgo: riesgo.puntos.map((p) => p.n),
    regionesPorNivel: CLAVES.map((e) => ({ nivel: nivel(e), regiones: regionesDe(e) })),
    porNivel: CLAVES.map((e) => ({ nivel: nivel(e), n: deOla(ultimaOla).filter((c) => c.region_impacto === e).length })),
    noOrdena,
    o1,
    o2,
    o3,
    muyAlto1: valorTramo(o1, 'Muy alto') ?? 0,
    bajo1: valorTramo(o1, 'Bajo') ?? 0,
    arriba2: { esMuyAlto: masAlto(o2).e === 'Muy alto', nivel: nivel(masAlto(o2).e), valor: masAlto(o2).v },
    rango3: [masBajo(o3).v, masAlto(o3).v],
    tramos: olasEstrato.map((o) => ({ ola: o.ola, tramos: o.tramos.map((x) => ({ nivel: nivel(x.nombre), media: x.media })) })),
    enesEstrato: [Math.min(...enesEstrato), Math.max(...enesEstrato)],
    proveedorPrimero,
    caidaFirme,
    proveedor: encuesta.olas.map((ola) => ({ ola, valor: pctRol(ola, 3) ?? 0 })),
    segundo1: segundo,
    roles: encuesta.olas.map((ola) => ({ ola, valores: ROLES.map((rol) => ({ rol, valor: pctRol(ola, rol) ?? 0 })) })),
    bases: repartos.map((x) => ({ ola: x.ola, base: x.r.base })),
    proveedorSector,
  })
  const ficha = FICHA[idioma]

  const TRES: { clave: string, etiqueta: string, color: string, valor: (r: Reparto) => number }[] = [
    { clave: 'desacuerdo', etiqueta: t.partes.desacuerdo, color: CONFIANZA.mucha, valor: (r) => r.desacuerdo },
    { clave: 'indiferente', etiqueta: t.partes.indiferente, color: NEUTRO, valor: (r) => r.indiferente },
    { clave: 'acuerdo', etiqueta: t.partes.acuerdo, color: CONFIANZA.ninguna, valor: (r) => r.acuerdo },
  ]
  const filasRol = ROLES.map((codigo) => ({ clave: String(codigo), etiqueta: t.rol[codigo], valores: encuesta.olas.map((ola) => pctRol(ola, codigo)) }))

  return (
    <CapaRecorrido
      abierta={abierta}
      alCerrar={() => { navegar('/') }}
      salida={t.salida}
      metodo="metodo-territorio"
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

          {/* Escena 1: las tres partes de la pregunta, una tanda de barras por oleada. Va primero para
              que el lector sepa qué se intenta explicar antes del mapa (Felipe y Codex, 22-09-2026). */}
          <Escena
            indice={1}
            raiz={raiz}
            dosColumnas
            titulo={t.titularRiesgo}
            frases={t.frasesRiesgo}
            figura={(activo, reducido) => (
              <div className="riesgo-partes flex flex-col gap-2.5">
                <p className="sr-only">{t.descripcionRiesgo}</p>
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
                            title={t.tituloSegmento(r.ola, x.etiqueta, x.valor(r), r.base)}
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
            nota={<p className="text-xs leading-snug text-gray-500">{t.notaRiesgo}</p>}
          />

          <Respiro raiz={raiz} indice={-1} titulo={t.respiroRegion.titulo}>
            {t.respiroRegion.cuerpo}
          </Respiro>

          {/* Escena 2: cómo se agruparon las regiones, con el mapa real (simplemaps; pedido de Felipe,
              22-09-2026). Un solo paso: explica la comparación que viene, no es un resultado. El
              término se define una vez acá, «exposición económica a China», y no se dice «estrato». */}
          <Escena
            indice={2}
            raiz={raiz}
            dosColumnas
            titulo={t.titularMapa}
            frases={t.frasesMapa}
            figura={() => (
              <div className="flex items-center gap-4">
                <MapaRegiones
                  relleno={(codigo) => colorEstrato(regiones.find((r) => r.codigo === codigo)?.estrato ?? '')}
                  descripcion={t.descripcionMapa}
                />
                <ul aria-hidden className="flex flex-col gap-2.5">
                  {CLAVES.map((e) => (
                    <li key={e} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: colorEstrato(e) }} />
                      <span className="text-[12px] leading-snug text-gray-700">
                        <span className="font-semibold text-gray-900">{nivel(e)}</span>
                        <br />
                        {lista(regionesDe(e))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            nota={<p className="text-xs leading-snug text-gray-500">{t.notaMapa}</p>}
          />

          <Respiro raiz={raiz} indice={-2} titulo={t.respiroExposicion.titulo}>
            {t.respiroExposicion.cuerpo}
          </Respiro>

          {/* Escena 3: el riesgo por nivel de exposición, una oleada por paso y **nunca sumadas**. El eje sale de
              las tres juntas, así que no cambia al encenderse cada una. */}
          <Escena
            indice={3}
            raiz={raiz}
            dosColumnas
            titulo={t.titularEstrato}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={Math.min(activo, olasEstrato.length - 1)} />
            )}
            frases={t.frasesEstrato}
            figura={(activo, reducido) => (
              <div className="flex flex-col gap-2">
                <p className="sr-only">{t.descripcionEstrato}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{t.rotuloExposicion}</p>
                <Puntos
                  series={seriesEstrato}
                  filas={filasEstrato}
                  escala={{ min: pisoNeto, max: techoNeto }}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => t.tituloPuntoEstrato(fila.etiqueta, serie.etiqueta, valor)}
                  marcas={(techoNeto - pisoNeto) / 5 + 1}
                  anchoEtiqueta="4.5rem"
                  compacto
                  altoFila={27}
                  radioCreciente
                  leyenda={false}
                  unidadEje={t.unidadEjeEstrato}
                  rotular={Math.min(activo, seriesEstrato.length - 1)}
                  visible={(_fila, ola) => reducido || olasEstrato.findIndex((o) => String(o.ola) === ola) <= activo}
                />
                <LeyendaDeOleadas olas={olasEstrato.map((o) => o.ola)} tonos={seriesEstrato.map((s) => s.color)} />
              </div>
            )}
            nota={<p className="text-xs leading-snug text-gray-500">{t.notaEstrato}</p>}
          />

          <Respiro raiz={raiz} indice={-3} titulo={t.respiroRol.titulo}>
            {t.respiroRol.cuerpo}
          </Respiro>

          {/* Escena 4: el rol de China en la comuna (`p8`), elección única. Una fila por rol y un
              punto por oleada, como los sectores de «Inversión y Estado». La baja de proveedor no
              pasa la corrección del bloque, así que la frase no la narra como caída (Codex,
              22-09-2026): da las cifras y lo que sí se sostiene. */}
          <Escena
            indice={4}
            raiz={raiz}
            dosColumnas
            titulo={t.titularRol}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={t.frasesRol}
            figura={(activo, reducido) => (
              <div className="flex flex-col gap-2">
                <p className="sr-only">{t.descripcionRol}</p>
                <Puntos
                  series={seriesRol}
                  filas={filasRol}
                  escala={{ min: 0, max: topeRol }}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => t.tituloPuntoRol(fila.etiqueta, serie.etiqueta, valor)}
                  marcas={topeRol / 20 + 1}
                  anchoEtiqueta="5.5rem"
                  compacto
                  altoFila={34}
                  radioCreciente
                  leyenda={false}
                  unidadEje={t.unidadEjeRol}
                  rotular={activo === 0 ? 0 : seriesRol.length - 1}
                  visible={(_fila, ola) => reducido || activo >= 1 || ola === String(primeraOla)}
                />
                <LeyendaDeOleadas olas={encuesta.olas} tonos={tonos} />
              </div>
            )}
            nota={<p className="text-xs leading-snug text-gray-500">{t.notaRol}</p>}
          />

          <Cierre
            raiz={raiz}
            titulo={ficha.nombre}
            frases={[
              { escena: 1, texto: t.titularRiesgo },
              { escena: 3, texto: t.titularEstrato },
              { escena: 4, texto: t.titularRol },
            ]}
          />
        </>
      )}
    </CapaRecorrido>
  )
}
