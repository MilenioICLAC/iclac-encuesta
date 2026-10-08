import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import comunEs from './locales/es/comun.json'
import capaEs from './locales/es/capa.json'
import exploradorEs from './locales/es/explorador.json'
import paginasEs from './locales/es/paginas.json'
import comunEn from './locales/en/comun.json'
import capaEn from './locales/en/capa.json'
import exploradorEn from './locales/en/explorador.json'
import paginasEn from './locales/en/paginas.json'
import comunCn from './locales/cn/comun.json'
import capaCn from './locales/cn/capa.json'
import exploradorCn from './locales/cn/explorador.json'
import paginasCn from './locales/cn/paginas.json'

/**
 * El idioma del sitio, copiado de mapa_FDI (`iclac-mapa-fdi/src/i18n.ts`).
 *
 * **Cromo, páginas y explorador** van en `src/locales/<idioma>/<namespace>.json`, con las mismas
 * claves en los tres idiomas (lo vigila `scripts/historias.test.mjs`). La prosa de las historias no
 * pasa por acá: vive en `src/historias/textos/`, en TypeScript, porque sus frases eligen el texto
 * según las pruebas y una plantilla ICU las alejaría de la condición que las sostiene.
 *
 * **El menú de iclac.cl llega con `?lng=en|cn`**, según el idioma del WordPress. Con `BrowserRouter` va en
 * la misma query que el estado del explorador: `/explorar?lng=en&p=p7`.
 * Después manda lo guardado en `localStorage`, y al final el idioma del navegador.
 *
 * El código interno del chino es `cn`, como en mapa_FDI y en el menú de iclac.cl; el de `Intl` y el
 * de `<html lang>` es `zh-CN`, y esa traducción vive en `locale.ts`.
 */

/** Un navegador en chino dice `zh-CN`, `zh-TW` o `zh`; en inglés, `en-US` o `en-GB`: todos entran. */
function convertirDetectado (codigo: string): string {
  const c = codigo.toLowerCase()
  if (c.startsWith('zh')) return 'cn'
  if (c.startsWith('en')) return 'en'
  if (c.startsWith('es')) return 'es'
  return codigo
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { comun: comunEs, capa: capaEs, explorador: exploradorEs, paginas: paginasEs },
      en: { comun: comunEn, capa: capaEn, explorador: exploradorEn, paginas: paginasEn },
      cn: { comun: comunCn, capa: capaCn, explorador: exploradorCn, paginas: paginasCn },
    },
    ns: ['comun', 'capa', 'explorador', 'paginas'],
    defaultNS: 'comun',
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'cn'],
    interpolation: { escapeValue: false },
    // En Node (pruebas y scripts) no hay lector: sin esto el detector lee el `navigator` de Node,
    // que dice `en-US`, y las pruebas escritas contra el español correrían en inglés.
    ...(typeof window === 'undefined' ? { lng: 'es' } : {}),
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
      convertDetectedLanguage: convertirDetectado,
    },
  })

export default i18n
