/**
 * Qué contrastes sostienen cada figura, y por extensión cada historia.
 *
 * **Un dato, un lugar.** Antes cada historia declaraba en `indice.tsx` una lista plana de medidas,
 * que servía para armar su método completo pero no decía cuál prueba respalda cuál figura. Con el
 * método en un pop-up por figura hace falta esa asignación, y tenerla en dos partes (la lista plana
 * y la asignación) garantiza que diverjan: acá está la asignación y la lista plana se deriva de ella
 * (`medidasDe`), en el mismo orden.
 *
 * **Las claves son la figura, no el número de escena.** El número cambia solo: «China cotidiana»
 * corre sus escenas cuando la oleada no trae las palabras del lugar de contacto.
 *
 * Una figura puede no tener prueba: el mapa de exposición de «Donde uno vive» es descriptivo, y su
 * pop-up muestra la nota sola. Que la lista esté vacía es distinto de que falte, y por eso va
 * escrita.
 *
 * **Y una escena puede tener dos figuras**, una por paso: las palabras de «La mirada» (China y
 * Estados Unidos), los buses y el racismo de «China cotidiana». Cada una lleva su clave, y la
 * escena elige cuál pasa al pop-up según el paso. Con una sola lista por escena, el pop-up del
 * primer paso de los buses ofrecía como prueba un contraste de la figura siguiente (Codex,
 * 29-09-2026).
 */
export const MEDIDAS = {
  mirada: {
    termometro: [
      'termometro-china', 'termometro-eeuu', 'termometro-japon', 'termometro-corea', 'termometro-francia',
      'opinion-china', 'brecha-china-eeuu', 'brecha-japon-china', 'dispersion-china',
    ],
    ideologia: ['ideologia-china'],
    palabrasChina: ['palabra-tecnologia'],
    palabrasEeuu: ['palabra-trump'],
  },
  'entre-potencias': {
    confianza: ['confia-china', 'confia-eeuu', 'confianza-china', 'confianza-eeuu'],
    balanza: ['mas-confianza-china', 'mas-confianza-eeuu', 'empate-confianza', 'brecha-confianza'],
    posicionamiento: ['no-alineamiento', 'ventaja-china-p26'],
  },
  territorio: {
    riesgo: ['riesgo-desacuerdo', 'riesgo-indiferente', 'riesgo-comuna', 'riesgo-desacuerdo-sobre-acuerdo'],
    mapa: [],
    estrato: ['riesgo-neto-exposicion', 'riesgo-estrato'],
    rol: [
      'p8-proveedor', 'p8-inversor',
      'p8-proveedor-sobre-inversor', 'p8-proveedor-sobre-comprador', 'p8-proveedor-sobre-competidor',
    ],
  },
  inversion: {
    limitar: ['limitar-inversiones'],
    sectores: ['electrica-sobre-banca'],
  },
  'china-cotidiana': {
    cosas: ['mall-cerca', 'restaurante-cerca'],
    personas: ['conoce-china'],
    lugar: ['palabra-mall', 'palabra-buena'],
    // La marca de los buses es descriptiva: lo que se contrasta es la opinión según si se sabía.
    busesMarca: [],
    busesOpinion: ['buses-sabia'],
    vistoSerie: ['racismo-visto'],
    vistoContacto: ['racismo-contacto'],
  },
  vacuna: {
    recuerdo: ['sinovac-recibio'],
    opinion: ['sinovac-buena', 'prefiere-pfizer'],
  },
} satisfies Record<string, Record<string, string[]>>

export type IdHistoria = keyof typeof MEDIDAS

/** Todas las medidas de una historia, en el orden en que sus figuras las usan. */
export const medidasDe = (id: IdHistoria): string[] => Object.values(MEDIDAS[id] as Record<string, string[]>).flat()
