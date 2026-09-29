import { Navigate, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import BarrasDeEscena from '../componentes/BarrasDeEscena'
import Puntos from '../componentes/Puntos'
import { multirespuesta } from '../nucleo/agregar'
import { topeDeBarras } from '../nucleo/escala'
import { pasosDeOrden } from '../nucleo/paleta'
import { decimal, porcentaje, useIdioma } from '../locale'
import { AnioDelPaso, LeyendaDeOleadas } from './comun'
import { serieDeMedida } from './lectura'
import { FICHA, TEXTOS } from './textos/inversion'

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
 *
 * **El componente calcula y compone; no escribe texto.** Toda la prosa, en los tres idiomas, está en
 * `textos/inversion.tsx`, que recibe las cifras y las banderas en `Valores`.
 */
export function HistoriaInversion ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  const navegar = useNavigate()
  const idioma = useIdioma()
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
  const podioFirme = podio.length === olasSectores.length && podio.every((b) => b.p < 0.05 && b.diferencia > 0)
    && orden({ ...primeraS, menciones: primeraS.menciones.slice(0, 3) }) === orden({ ...ultimaS, menciones: ultimaS.menciones.slice(0, 3) })

  const parejo = (s: NonNullable<typeof limitar>) => s.consecutivas.every((c) => c.p >= 0.05) && (s.punta?.p ?? 0) >= 0.05

  const primeraOla = limitar.puntos[0].ola
  const ultimaOla = limitar.puntos[limitar.puntos.length - 1].ola
  const t = TEXTOS[idioma]({
    primeraOla,
    ultimaOla,
    limitar: limitar.puntos,
    quieto: parejo(limitar),
    // «Tres de cada cuatro» solo mientras las tres oleadas redondeen a eso.
    tresDeCuatro: limitar.puntos.every((p) => p.valor >= 70 && p.valor < 80),
    advertencia: limitar.advertencia,
    sectores: sectores.map((x) => ({ ola: x.ola, base: x.base, menciones: x.menciones.map((m) => ({ columna: m.columna, porcentaje: m.porcentaje })) })),
    opcionEs: Object.fromEntries(grupo.opciones.map((o) => [o.columna, o.opcion])),
    podioFirme,
    mismoOrden,
  })
  const ficha = FICHA[idioma]

  const topeLimitar = topeDeBarras(limitar.puntos.map((p) => p.valor))
  // Eje de 0 a un múltiplo de 20, con marcas cada 20: con el tope de las barras (75) y tres marcas
  // el eje decía 0, 38 y 75.
  const topeSectores = Math.min(100, Math.ceil(Math.max(...sectores.flatMap((s) => s.menciones.map((m) => m.porcentaje))) / 20) * 20)

  // Los sectores como el termómetro: una fila por sector y un punto por oleada, en el mismo eje,
  // ordenados por la última. Pedido de Felipe (21-09-2026): las dos oleadas a la vista a la vez.
  // La clave de cada fila es la columna, que no depende del idioma; el rótulo sí.
  const filasSectores = ultimaS.menciones.map((m) => ({
    clave: m.columna,
    etiqueta: t.sector(m.columna),
    valores: sectores.map((x) => x.menciones.find((y) => y.columna === m.columna)?.porcentaje ?? null),
  }))
  const seriesSectores = sectores.map((x) => ({
    clave: String(x.ola),
    etiqueta: String(x.ola),
    color: tonos[encuesta.olas.indexOf(x.ola)],
  }))
  const olasConSectores = sectores.map((x) => x.ola)
  const tonosSectores = sectores.map((x) => tonos[encuesta.olas.indexOf(x.ola)])

  return (
    <CapaRecorrido
      abierta={abierta}
      alCerrar={() => { navegar('/') }}
      salida={t.salida}
      metodo="metodo-inversion"
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

          {/* Escena 1: la mayoría que quiere poder limitar. Lo que afirma es que no se mueve. */}
          <Escena
            indice={1}
            raiz={raiz}
            dosColumnas
            titulo={t.titularLimitar}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={activo === 0 ? 0 : encuesta.olas.length - 1} />
            )}
            frases={t.frasesLimitar}
            figura={(activo, reducido) => (
              <BarrasDeEscena
                max={topeLimitar}
                formato={fmt}
                descripcion={t.descripcionLimitar}
                rotulo={t.rotuloLimitar}
                unidadEje={t.ejeLimitar}
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
            nota={<p className="text-xs leading-snug text-gray-500">{t.notaLimitar}</p>}
          />

          <Respiro raiz={raiz} indice={-1} titulo={t.respiro.titulo}>
            {t.respiro.cuerpo}
          </Respiro>

          {/* Escena 2: los sectores de `p20`, una oleada por paso. **Cambia de oleada sin cambiar de
              eje**: el tope sale de las dos juntas. */}
          <Escena
            indice={2}
            raiz={raiz}
            dosColumnas
            titulo={t.titularSectores}
            cabecera={(activo) => (
              <AnioDelPaso olas={encuesta.olas} tonos={tonos} hasta={encuesta.olas.indexOf(activo === 0 ? primeraS.ola : ultimaS.ola)} />
            )}
            frases={t.frasesSectores}
            figura={(activo, reducido) => (
              <div className="flex flex-col gap-2">
                <Puntos
                  rotulo={t.rotuloSectores}
                  descripcion={t.descripcionSectores}
                  series={seriesSectores}
                  filas={filasSectores}
                  escala={{ min: 0, max: topeSectores }}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => t.tituloPunto(fila.etiqueta, serie.etiqueta, valor)}
                  marcas={topeSectores / 20 + 1}
                  anchoEtiqueta="8.5rem"
                  compacto
                  altoFila={28}
                  radioCreciente
                  leyenda={false}
                  unidadEje={t.unidadEje}
                  rotular={seriesSectores.length - 1}
                  visible={(_fila, ola) => reducido || activo >= 1 || ola === String(primeraS.ola)}
                />
                <LeyendaDeOleadas olas={olasConSectores} tonos={tonosSectores} />
              </div>
            )}
            nota={<p className="text-xs leading-snug text-gray-500">{t.notaSectores}</p>}
          />

          <Cierre
            raiz={raiz}
            titulo={ficha.nombre}
            frases={[
              { escena: 1, texto: t.titularLimitar },
              { escena: 2, texto: t.titularSectores },
            ]}
          />
        </>
      )}
    </CapaRecorrido>
  )
}
