import type { Idioma } from './locale'

/**
 * Los textos del cromo del sitio, en los tres idiomas.
 *
 * **Solo el cromo.** Acá están el encabezado, el nav y los avisos: lo que rodea a las figuras.
 * Los títulos de los módulos, las escenas del recorrido y las notas al pie siguen en español y
 * dentro del código, que es el pendiente que el pie ya declara. Separarlo así permite que el
 * selector de idioma exista y haga algo real (el nav y el formato de los números cambian) sin
 * fingir un sitio trilingüe que todavía no está.
 *
 * Cuando los textos del contenido salgan a su archivo, este módulo es donde se juntan.
 */

type Cadena = Record<Idioma, string>

const cadena = (es: string, en: string, cn: string): Cadena => ({ es, en, cn })

export const TEXTOS = {
  titulo: cadena(
    'Encuesta de Percepciones sobre China en Chile',
    'Survey of Perceptions of China in Chile',
    '智利对华认知调查',
  ),
  bajada: cadena(
    'Monitor de opinión pública · ICLAC',
    'Public opinion monitor · ICLAC',
    '公众舆论监测 · ICLAC',
  ),
  menu: cadena('Menú', 'Menu', '菜单'),
  cerrarMenu: cadena('Cerrar el menú', 'Close menu', '关闭菜单'),
  idioma: cadena('Idioma', 'Language', '语言'),
  // El aviso no es un disclaimer de cortesía: sin él, elegir «EN» deja al lector frente a un
  // sitio en español sin explicación, y parece que el botón no funcionó.
  soloCromo: cadena(
    '',
    'Only the site navigation is translated so far: the figures, their notes and the story are still in Spanish.',
    '目前仅站点导航已翻译：图表、图注与叙事内容仍为西班牙语。',
  ),
  nav: {
    recorrido: cadena('Historias', 'Stories', '故事'),
    explorar: cadena('Explorar', 'Explore', '自由探索'),
    descargas: cadena('Descargas', 'Downloads', '数据下载'),
    ficha: cadena('Ficha técnica', 'Survey details', '调查说明'),
    datos: cadena('Sobre los datos', 'About the data', '关于数据'),
  },
} as const

export function texto (cadena: Cadena, idioma: Idioma): string {
  return cadena[idioma]
}
