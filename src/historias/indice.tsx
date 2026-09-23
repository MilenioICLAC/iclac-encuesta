import type { Encuesta } from '../nucleo/tipos'
import { HistoriaEntrePotencias, HistoriaMirada } from './recorrido'
import { HistoriaChinaCotidiana } from './cotidiana'
import { HistoriaInversion } from './inversion'
import { HistoriaTerritorio } from './territorio'
import { HistoriaVacuna } from './vacuna'

/**
 * Las historias del visualizador, **una por bloque de la guía de contexto de ICLAC** (02-09-2026).
 *
 * El orden es el de la guía, que es el del cuestionario. Un bloque entra solo si alguna de sus
 * hipótesis sobrevive al contraste con Holm dentro de su familia (`scripts/contrastes.test.mjs`,
 * «las hipótesis de la guía, bloque por bloque»). El bloque tres, la economía de la comuna, no
 * sostuvo su hipótesis central y entra igual, **descriptivo**, por decisión de Felipe (22-09-2026):
 * lo que afirma es lo que sí pasó el contraste.
 *
 * `hallazgo` es lo que la tarjeta del menú promete. **No lleva cifras**: una cifra escrita acá
 * envejece con la oleada siguiente, y la que importa está dentro de la historia, calculada.
 * `medidas` son los contrastes que la sostienen, y con ellos se arma su sección de método.
 */
export interface Historia {
  id: string
  bloque: number
  nombre: string
  pregunta: string
  hallazgo: string
  medidas: string[]
  Componente: (props: { encuesta: Encuesta, abierta: boolean }) => React.ReactElement
}

export const HISTORIAS: Historia[] = [
  {
    id: 'mirada',
    bloque: 1,
    nombre: 'La mirada',
    pregunta: '¿Qué opina la gente sobre China?',
    hallazgo: 'En la última oleada China queda por primera vez sobre Estados Unidos, y la posición política no ordena la opinión de forma robusta.',
    medidas: ['termometro-china', 'termometro-eeuu', 'termometro-japon', 'termometro-corea', 'termometro-francia', 'opinion-china', 'brecha-china-eeuu', 'brecha-japon-china', 'dispersion-china', 'ideologia-china', 'palabra-trump', 'palabra-tecnologia'],
    Componente: HistoriaMirada,
  },
  {
    id: 'entre-potencias',
    bloque: 2,
    nombre: 'Entre dos potencias',
    pregunta: '¿Con quién se queda Chile?',
    hallazgo: 'La confianza en China se dispara, y en la última oleada cambia cuál potencia prefiere la minoría que elige.',
    medidas: ['confia-china', 'confia-eeuu', 'confianza-china', 'confianza-eeuu', 'mas-confianza-china', 'mas-confianza-eeuu', 'empate-confianza', 'brecha-confianza', 'no-alineamiento', 'ventaja-china-p26'],
    Componente: HistoriaEntrePotencias,
  },
  {
    id: 'territorio',
    bloque: 3,
    nombre: 'Donde uno vive',
    pregunta: '¿Pesa China distinto según dónde se vive?',
    hallazgo: 'Hay más desacuerdo que acuerdo con que el acercamiento con China haya traído más riesgos que oportunidades, y la exposición económica de la región no cambia eso.',
    medidas: ['riesgo-desacuerdo', 'riesgo-indiferente', 'riesgo-comuna', 'riesgo-desacuerdo-sobre-acuerdo', 'riesgo-neto-exposicion', 'riesgo-estrato', 'p8-proveedor', 'p8-inversor', 'p8-proveedor-sobre-inversor', 'p8-proveedor-sobre-comprador', 'p8-proveedor-sobre-competidor'],
    Componente: HistoriaTerritorio,
  },
  {
    id: 'inversion',
    bloque: 4,
    nombre: 'Inversión y Estado',
    pregunta: '¿Dónde poner límites a la inversión?',
    hallazgo: 'Una mayoría amplia y quieta quiere que el Estado pueda frenar inversiones, y sabe dónde: minería y electricidad.',
    medidas: ['limitar-inversiones', 'electrica-sobre-banca'],
    Componente: HistoriaInversion,
  },
  {
    id: 'china-cotidiana',
    bloque: 5,
    nombre: 'China cotidiana',
    pregunta: '¿Cuánta China hay en la vida diaria?',
    hallazgo: 'Entre la primera y la última oleada, más gente tiene un mall chino cerca; conocer a alguien de China, no.',
    medidas: ['mall-cerca', 'restaurante-cerca', 'conoce-china', 'palabra-mall', 'palabra-buena', 'buses-sabia', 'racismo-visto', 'racismo-contacto'],
    Componente: HistoriaChinaCotidiana,
  },
  {
    id: 'vacuna',
    bloque: 6,
    nombre: 'La vacuna',
    pregunta: '¿Qué queda de la vacuna china?',
    hallazgo: 'El recuerdo de haberla recibido no se mueve; la buena opinión de quienes la recibieron, sí.',
    medidas: ['sinovac-recibio', 'sinovac-buena', 'prefiere-pfizer'],
    Componente: HistoriaVacuna,
  },
]

export const historiaDe = (id: string | undefined) => HISTORIAS.find((h) => h.id === id) ?? null
