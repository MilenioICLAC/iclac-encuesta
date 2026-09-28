import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Las dieciséis regiones de Chile continental, con la geometría de simplemaps.
 *
 * La geometría la escribe `scripts/geometria_regiones.mjs` en `public/data/chile-regiones.json`
 * (fuente y licencia ahí). Se pide aparte y no viaja en `encuesta.json` porque pesa 140 kB y solo la
 * usa esta figura. **Mientras carga, la figura guarda su lugar** con el mismo alto: si apareciera
 * después, el bloque de la escena crecería a mitad de paso.
 *
 * El color lo decide quien la usa (`relleno`), y `encendida` apaga regiones con opacidad, sin
 * sacarlas: la forma de Chile se lee siempre entera.
 */

interface Geometria {
  viewBox: string
  regiones: { codigo: number, nombre: string, d: string }[]
}

let cache: Promise<Geometria> | null = null
const cargar = () => {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/chile-regiones.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
  return cache
}

interface Props {
  relleno: (codigo: number) => string
  encendida?: (codigo: number) => boolean
  descripcion: string
}

export default function MapaRegiones ({ relleno, encendida = () => true, descripcion }: Props) {
  const { t } = useTranslation('comun')
  const [geo, setGeo] = useState<Geometria | null>(null)
  useEffect(() => {
    let vivo = true
    cargar().then((g) => { if (vivo) setGeo(g) }).catch(() => { /* sin mapa: queda el texto equivalente */ })
    return () => { vivo = false }
  }, [])

  const [, , w, h] = (geo?.viewBox ?? '0 0 177 917').split(' ').map(Number)
  return (
    <svg
      role="img"
      aria-label={descripcion}
      viewBox={geo?.viewBox ?? '0 0 177 917'}
      // **El alto vive en el CSS** (`.mapa-regiones` en `index.css`): depende del alto de la pantalla
      // y crece en escritorio, y una media query no alcanza a un valor escrito acá.
      style={{ aspectRatio: `${w} / ${h}` }}
      className="mapa-regiones shrink-0"
    >
      {geo?.regiones.map((r) => (
        <path
          key={r.codigo}
          d={r.d}
          fill={relleno(r.codigo)}
          stroke="#ffffff"
          strokeWidth={0.8}
          strokeLinejoin="round"
          className="transition-opacity duration-500"
          style={{ opacity: encendida(r.codigo) ? 1 : 0.18 }}
        >
          {/* El nombre en el idioma activo (`comun.json`, `regiones`); el del archivo es el del cliente. */}
          <title>{t(`regiones.${r.codigo}`, { defaultValue: r.nombre })}</title>
        </path>
      ))}
    </svg>
  )
}
