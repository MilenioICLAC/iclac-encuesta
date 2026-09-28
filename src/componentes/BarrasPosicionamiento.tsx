import { decimal, idioma, porcentaje } from '../locale'
import { textoExplorador as t } from '../nucleo/explorador'
import './BarrasPosicionamiento.css'
import Enfasis from './Enfasis'

interface Categoria {
  clave: string
  etiqueta: string
  /** El nombre corto de los extremos, junto a sus cifras («China», «EE. UU.»). Sin él, la etiqueta. */
  corta?: string
  color: string
  valores: number[]
}

interface Props {
  olas: number[]
  reparto: Categoria[]
  mostrarUltima: boolean
  reducido: boolean
}

/** Una fila por oleada, siempre sobre el total de respuestas. El espacio de la
 * última fila se reserva desde el inicio: animar la entrada no desplaza las demás. */
export default function BarrasPosicionamiento ({ olas, reparto, mostrarUltima, reducido }: Props) {
  const ultima = olas.length - 1
  const extremos = reparto.filter((c) => c.clave === '1' || c.clave === '2')
  const nombre = (c: Categoria) => c.corta ?? c.etiqueta
  const cambio = (c: Categoria) => c.valores[ultima] - c.valores[ultima - 1]

  return (
    <figure className="barras-posicionamiento" aria-label={t('posicionamiento.aria')}>
      <p className="text-xs text-gray-500">{t('posicionamiento.total')}</p>
      <div className="p26-filas">
        {olas.map((ola, i) => {
          const final = i === ultima
          const visible = !final || mostrarUltima || reducido
          // **La marca ya no es una animación, así que `reducido` no la apaga.** Con la emanata
          // sí correspondía: era movimiento. Un cursor estático es información sobre de qué habla
          // el paso, y quien pidió menos movimiento no pidió menos información.
          const animar = final && mostrarUltima
          return (
            <div key={ola} className={`p26-fila ${visible ? '' : 'p26-oculta'}`} data-ola={ola}>
              <span className="p26-ola">{ola}</span>
              <div className="p26-barra" role="img" aria-label={`${ola}${idioma() === 'cn' ? '：' : ': '}${reparto.map((c) => `${c.etiqueta} ${porcentaje(c.valores[i], 1)}`).join(idioma() === 'cn' ? '，' : ', ')}`}>
                {reparto.map((c) => (
                  <span key={c.clave} className={`p26-segmento ${c.clave === '1' || c.clave === '2' ? 'p26-extremo' : ''}`}
                    style={{ width: `${c.valores[i]}%`, backgroundColor: c.color }}
                    title={t('figura.conEtiqueta', { etiqueta: c.etiqueta, resto: porcentaje(c.valores[i], 1) })}>
                    {animar && (c.clave === '1' || c.clave === '2') && <Enfasis />}
                  </span>
                ))}
              </div>
              <div className="p26-valores" aria-hidden="true">
                {extremos.map((c) => <span key={c.clave}>{nombre(c)} <strong>{porcentaje(c.valores[i], 1)}</strong></span>)}
              </div>
            </div>
          )
        })}
      </div>
      <div className={`p26-cambio ${mostrarUltima || reducido ? '' : 'p26-oculta'}`}>
        {ultima > 0 && <>
          <span className="text-gray-500">{t('posicionamiento.frente', { a: olas[ultima], b: olas[ultima - 1] })}</span>{' '}
          {extremos.map((c, i) => <span key={c.clave}>{i > 0 && ' · '}{nombre(c)} <strong>{cambio(c) > 0 ? '+' : '−'}{decimal(Math.abs(cambio(c)), 1)}{t('posicionamiento.pp')}</strong></span>)}
        </>}
      </div>
      <ul className="p26-leyenda">
        {reparto.map((c) => <li key={c.clave}><span aria-hidden="true" style={{ backgroundColor: c.color }} />{c.etiqueta}</li>)}
      </ul>
    </figure>
  )
}
