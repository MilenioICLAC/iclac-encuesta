// Traducción al inglés de los textos de los contrastes (`scripts/lib/contrastes.mjs`), por id de medida, brecha, grupo, regresión y familia. `tramos` son los nombres de los grupos de cada contraste, por su clave en español.
//
// Cada valor empieza igual al español y se reemplaza por la traducción. Las claves no se tocan:
// el ETL falla si falta o sobra una (`validar.mjs`). Generado por `node scripts/etl_combinada.mjs --esqueleto`.

export default {
  metodo: {
    alcance: 'The sample is a non-probability sample: these tests compare the waves with one another and do not estimate population values. They are not a margin of error.',
  },
  medidas: {
    'termometro-china': {
      etiqueta: 'Opinion of China',
    },
    'termometro-eeuu': {
      etiqueta: 'Opinion of the United States',
    },
    'termometro-corea': {
      etiqueta: 'Opinion of South Korea',
    },
    'termometro-francia': {
      etiqueta: 'Opinion of France',
    },
    'termometro-japon': {
      etiqueta: 'Opinion of Japan',
    },
    'confianza-china': {
      etiqueta: 'A great deal of trust in China',
    },
    'confianza-eeuu': {
      etiqueta: 'A great deal of trust in the United States',
    },
    'confia-china': {
      etiqueta: 'Trusts China (a great deal or some)',
    },
    'confia-eeuu': {
      etiqueta: 'Trusts the United States (a great deal or some)',
    },
    'mas-confianza-china': {
      etiqueta: 'Trusts China more than the United States',
    },
    'mas-confianza-eeuu': {
      etiqueta: 'Trusts the United States more than China',
    },
    'empate-confianza': {
      etiqueta: 'Trusts both powers to the same degree',
    },
    'racismo-visto': {
      etiqueta: 'Saw racist content against Chinese or Asian people',
      advertencia: 'Since 2024 the question comes after another one about sources of information, so part of the difference may come from the questionnaire rather than from the respondents.',
    },
    'mall-cerca': {
      etiqueta: 'Lives less than ten blocks from a Chinese-run variety store (mall chino)',
    },
    'restaurante-cerca': {
      etiqueta: 'Lives less than ten blocks from a Chinese restaurant',
    },
    'conoce-china': {
      etiqueta: 'Personally knows someone from China or of Chinese descent',
    },
    'no-alineamiento': {
      etiqueta: 'Non-alignment',
    },
    'pro-china': {
      etiqueta: 'Prefers to side with China',
    },
    'pro-eeuu': {
      etiqueta: 'Prefers to side with the United States',
    },
    'distancia-ambos': {
      etiqueta: 'Prefers to keep a distance from both powers',
    },
    'relacionarse-ambos': {
      etiqueta: 'Prefers to engage with both powers',
    },
    'dispersion-china': {
      etiqueta: 'Average distance of opinions of China from the median',
    },
    'p8-proveedor': {
      etiqueta: 'Sees China as an important supplier in their municipality',
    },
    'p8-inversor': {
      etiqueta: 'Sees China as an important investor in their municipality',
    },
    'p8-comprador': {
      etiqueta: 'Sees China as an important buyer in their municipality',
    },
    'palabra-trump': {
      etiqueta: 'Writes “Trump” as the first thing they associate with the United States',
      advertencia: 'Exploratory test: the word was chosen after looking at the frequencies.',
    },
    'palabra-tecnologia': {
      etiqueta: 'Writes “technology” (tecnología) as the first thing they associate with China',
      advertencia: 'Exploratory test: the word was chosen after looking at the frequencies.',
    },
    'palabra-mall': {
      etiqueta: 'Names the “mall” as a setting for contact with Chinese people',
      advertencia: 'Exploratory test: the word was chosen after looking at the frequencies.',
    },
    'palabra-buena': {
      etiqueta: 'Describes their interaction with Chinese people as “good” (buena)',
      advertencia: 'Exploratory test: the word was chosen after looking at the frequencies.',
    },
    'riesgo-desacuerdo': {
      etiqueta: 'Disagrees that closer ties with China brought more risks than opportunities',
    },
    'riesgo-indiferente': {
      etiqueta: 'Indifferent as to whether closer ties with China brought more risks than opportunities',
    },
    'riesgo-comuna': {
      etiqueta: 'Believes that closer ties with China brought more risks than opportunities',
    },
    'limitar-inversiones': {
      etiqueta: 'Wants an institution that can limit investment in strategic sectors',
      advertencia: 'In 2025 the question was answered after an experimental module on Chinese investment in telecommunications.',
    },
    'sinovac-recibio': {
      etiqueta: 'Received at least one dose of the Sinovac vaccine',
      advertencia: 'In 2025 the option “I don’t remember” was added, and those who choose it are left out of this figure.',
    },
    'sinovac-buena': {
      etiqueta: 'Has a good or very good opinion of Sinovac vaccines, among those who received a Sinovac vaccine',
    },
    'prefiere-pfizer': {
      etiqueta: 'Would have preferred Pfizer or Moderna',
    },
  },
  brechas: {
    'brecha-china-eeuu': {
      etiqueta: 'Opinion of China minus opinion of the United States',
    },
    'brecha-japon-china': {
      etiqueta: 'Opinion of Japan minus opinion of China',
    },
    'brecha-confianza': {
      etiqueta: 'Trust in China minus trust in the United States',
    },
    'ventaja-china-p26': {
      etiqueta: 'Prefers to side with China minus prefers to side with the United States',
    },
    'p8-proveedor-sobre-inversor': {
      etiqueta: 'Sees China as a supplier minus sees it as an investor, in their municipality',
    },
    'p8-proveedor-sobre-comprador': {
      etiqueta: 'Sees China as a supplier minus sees it as a buyer, in their municipality',
    },
    'p8-proveedor-sobre-competidor': {
      etiqueta: 'Sees China as a supplier minus sees it as a competitor, in their municipality',
    },
    'riesgo-desacuerdo-sobre-acuerdo': {
      etiqueta: 'Disagrees minus agrees that closer ties with China brought more risks',
    },
    'electrica-sobre-banca': {
      etiqueta: 'Share selecting electricity distribution minus share selecting banking',
    },
  },
  grupos: {
    'ideologia-china': {
      etiqueta: 'Opinion of China by ideological group',
      tramos: {
        Izquierda: 'Left',
        Centro: 'Center',
        Derecha: 'Right',
      },
    },
    'racismo-contacto': {
      etiqueta: 'Saw racist content, by whether they personally know someone from China',
      tramos: {
        Conoce: 'Knows someone',
        'No conoce': 'Does not know anyone',
      },
    },
    'buses-sabia': {
      etiqueta: 'Views the electrification of buses positively, by whether they knew the buses were Chinese-branded',
      tramos: {
        'Sabía': 'Knew',
        'No sabía': 'Did not know',
      },
    },
    'riesgo-estrato': {
      etiqueta: 'Believes that closer ties with China brought more risks than opportunities, by their region’s economic exposure to China',
      tramos: {
        'Muy alto': 'Very high',
        Alto: 'High',
        Medio: 'Medium',
        Bajo: 'Low',
      },
    },
    'riesgo-neto-exposicion': {
      etiqueta: 'Disagreement minus agreement that closer ties with China brought more risks, by their region’s economic exposure to China',
      tramos: {
        'Muy alto': 'Very high',
        Alto: 'High',
        Medio: 'Medium',
        Bajo: 'Low',
      },
    },
  },
  regresiones: {
    'ideologia-china': {
      etiqueta: 'Opinion of China by ideological self-placement',
    },
  },
  transversal: {
    'opinion-china': {
      cortes: {
        nse_rec: 'socioeconomic groups',
        region_macrozona: 'macro-regions',
        edad_rec: 'age groups',
      },
    },
  },
  familias: {
    'guia-bloque-1': {
      etiqueta: 'hypotheses of “How China is seen”',
    },
    'guia-bloque-2': {
      etiqueta: 'hypotheses of “Between two powers”',
    },
    'guia-bloque-3': {
      etiqueta: 'hypotheses of “Where people live”',
    },
    'estrato-por-oleada': {
      etiqueta: 'perceived risk by economic exposure, in the three waves',
    },
    'proveedor-primero': {
      etiqueta: '“supplier” versus each of the other roles, in the three waves',
    },
    'neto-por-oleada': {
      etiqueta: 'more disagreement than agreement, in the three waves',
    },
    'neto-por-nivel': {
      etiqueta: 'the net balance by economic exposure, in the three waves',
    },
    'electrica-sobre-banca': {
      etiqueta: 'electricity distribution versus banking, in the two waves in which it was asked',
    },
    cotidiana: {
      etiqueta: 'the four changes in “China in everyday life” between 2023 and 2025',
    },
    'guia-bloque-6': {
      etiqueta: 'hypotheses of “The vaccine”',
    },
    palabras: {
      etiqueta: 'the four words from the open-ended responses',
    },
  },
}
