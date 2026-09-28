// Traducción al chino (simplificado) de los textos de los contrastes (`scripts/lib/contrastes.mjs`), por id de medida, brecha, grupo, regresión y familia. `tramos` son los nombres de los grupos de cada contraste, por su clave en español.
//
// Cada valor empieza igual al español y se reemplaza por la traducción. Las claves no se tocan:
// el ETL falla si falta o sobra una (`validar.mjs`). Generado por `node scripts/etl_combinada.mjs --esqueleto`.

export default {
  metodo: {
    alcance: '样本为非概率样本：这些检验是将各轮调查相互比较，并不对总体进行估计，也不是误差范围。',
  },
  medidas: {
    'termometro-china': {
      etiqueta: '对中国的好感度',
    },
    'termometro-eeuu': {
      etiqueta: '对美国的好感度',
    },
    'termometro-corea': {
      etiqueta: '对韩国的好感度',
    },
    'termometro-francia': {
      etiqueta: '对法国的好感度',
    },
    'termometro-japon': {
      etiqueta: '对日本的好感度',
    },
    'confianza-china': {
      etiqueta: '对中国的信任为“很多”',
    },
    'confianza-eeuu': {
      etiqueta: '对美国的信任为“很多”',
    },
    'confia-china': {
      etiqueta: '信任中国（很多或一些）',
    },
    'confia-eeuu': {
      etiqueta: '信任美国（很多或一些）',
    },
    'mas-confianza-china': {
      etiqueta: '对中国的信任高于对美国的信任',
    },
    'mas-confianza-eeuu': {
      etiqueta: '对美国的信任高于对中国的信任',
    },
    'empate-confianza': {
      etiqueta: '对两个大国的信任程度相同',
    },
    'racismo-visto': {
      etiqueta: '看到过针对华人或亚裔的种族歧视内容',
      advertencia: '自2024年起，该题排在一道关于信息来源的题目之后，因此差异可能有一部分来自问卷，而非来自受访者本身。',
    },
    'mall-cerca': {
      etiqueta: '住处距华人经营的百货店（mall chino）不到十个街区',
    },
    'restaurante-cerca': {
      etiqueta: '住处距中餐馆不到十个街区',
    },
    'conoce-china': {
      etiqueta: '本人认识来自中国的人或华裔人士',
    },
    'no-alineamiento': {
      etiqueta: '不选边站',
    },
    'pro-china': {
      etiqueta: '倾向于支持中国',
    },
    'pro-eeuu': {
      etiqueta: '倾向于支持美国',
    },
    'distancia-ambos': {
      etiqueta: '倾向于与两个大国保持距离',
    },
    'relacionarse-ambos': {
      etiqueta: '倾向于与两个大国都保持往来',
    },
    'dispersion-china': {
      etiqueta: '对中国的好感度与其中位数的平均距离',
    },
    'p8-proveedor': {
      etiqueta: '认为中国在其所在市镇是重要的供应商',
    },
    'p8-inversor': {
      etiqueta: '认为中国在其所在市镇是重要的投资者',
    },
    'p8-comprador': {
      etiqueta: '认为中国在其所在市镇是重要的买家',
    },
    'palabra-trump': {
      etiqueta: '提到美国时首先写下的是“Trump”（特朗普）',
      advertencia: '探索性检验：该词是在查看词频之后选定的。',
    },
    'palabra-tecnologia': {
      etiqueta: '提到中国时首先写下的是“科技”（tecnología）',
      advertencia: '探索性检验：该词是在查看词频之后选定的。',
    },
    'palabra-mall': {
      etiqueta: '提到“mall”是与华人接触的场合',
      advertencia: '探索性检验：该词是在查看词频之后选定的。',
    },
    'palabra-buena': {
      etiqueta: '用“好”（buena）形容自己与华人的交往',
      advertencia: '探索性检验：该词是在查看词频之后选定的。',
    },
    'riesgo-desacuerdo': {
      etiqueta: '不同意与中国关系的拉近带来的风险多于机遇',
    },
    'riesgo-indiferente': {
      etiqueta: '对“与中国关系的拉近带来的风险多于机遇”持中立态度',
    },
    'riesgo-comuna': {
      etiqueta: '认为与中国关系的拉近带来的风险多于机遇',
    },
    'limitar-inversiones': {
      etiqueta: '希望设立一个能够限制战略性行业投资的机构',
      advertencia: '2025年，该题是在一个关于中国电信投资的实验模块之后作答的。',
    },
    'sinovac-recibio': {
      etiqueta: '至少接种过一剂科兴疫苗',
      advertencia: '2025年新增了“不记得”选项，选择该项的受访者不计入这一数字。',
    },
    'sinovac-buena': {
      etiqueta: '在接种过科兴疫苗的人中，对科兴疫苗评价好或很好',
    },
    'prefiere-pfizer': {
      etiqueta: '当初本会更希望接种辉瑞或莫德纳疫苗',
    },
  },
  brechas: {
    'brecha-china-eeuu': {
      etiqueta: '对中国的好感度减去对美国的好感度',
    },
    'brecha-japon-china': {
      etiqueta: '对日本的好感度减去对中国的好感度',
    },
    'brecha-confianza': {
      etiqueta: '对中国的信任减去对美国的信任',
    },
    'ventaja-china-p26': {
      etiqueta: '倾向于支持中国减去倾向于支持美国',
    },
    'p8-proveedor-sobre-inversor': {
      etiqueta: '在其所在市镇，视中国为供应商减去视中国为投资者',
    },
    'p8-proveedor-sobre-comprador': {
      etiqueta: '在其所在市镇，视中国为供应商减去视中国为买家',
    },
    'p8-proveedor-sobre-competidor': {
      etiqueta: '在其所在市镇，视中国为供应商减去视中国为竞争对手',
    },
    'riesgo-desacuerdo-sobre-acuerdo': {
      etiqueta: '不同意减去同意“与中国关系的拉近带来了更多风险”',
    },
    'electrica-sobre-banca': {
      etiqueta: '选择配电行业减去选择银行业',
    },
  },
  grupos: {
    'ideologia-china': {
      etiqueta: '按政治倾向分组的对中国好感度',
      tramos: {
        Izquierda: '左派',
        Centro: '中间派',
        Derecha: '右派',
      },
    },
    'racismo-contacto': {
      etiqueta: '看到过种族歧视内容，按本人是否认识来自中国的人分组',
      tramos: {
        Conoce: '认识',
        'No conoce': '不认识',
      },
    },
    'buses-sabia': {
      etiqueta: '对公交车电动化评价正面，按是否知道这些公交车采用中国品牌分组',
      tramos: {
        'Sabía': '知道',
        'No sabía': '不知道',
      },
    },
    'riesgo-estrato': {
      etiqueta: '认为与中国关系的拉近带来的风险多于机遇，按所在地区的对华经济关联度分组',
      tramos: {
        'Muy alto': '很高',
        Alto: '高',
        Medio: '中',
        Bajo: '低',
      },
    },
    'riesgo-neto-exposicion': {
      etiqueta: '不同意减去同意“与中国关系的拉近带来了更多风险”，按所在地区的对华经济关联度分组',
      tramos: {
        'Muy alto': '很高',
        Alto: '高',
        Medio: '中',
        Bajo: '低',
      },
    },
  },
  regresiones: {
    'ideologia-china': {
      etiqueta: '对中国的好感度与政治倾向自我定位的关系',
    },
  },
  transversal: {
    'opinion-china': {
      cortes: {
        nse_rec: '社会经济水平组',
        region_macrozona: '地理分区',
        edad_rec: '年龄组',
      },
    },
  },
  familias: {
    'guia-bloque-1': {
      etiqueta: '“对华观感”的假设',
    },
    'guia-bloque-2': {
      etiqueta: '“两强之间”的假设',
    },
    'guia-bloque-3': {
      etiqueta: '“身居何处”的假设',
    },
    'estrato-por-oleada': {
      etiqueta: '三轮调查中按对华经济关联度的风险认知',
    },
    'proveedor-primero': {
      etiqueta: '三轮调查中“供应商”与其他各角色的逐一对比',
    },
    'neto-por-oleada': {
      etiqueta: '三轮调查中不同意多于同意',
    },
    'neto-por-nivel': {
      etiqueta: '三轮调查中按对华经济关联度的净差值',
    },
    'electrica-sobre-banca': {
      etiqueta: '提问该题的两轮调查中配电行业相对银行业',
    },
    cotidiana: {
      etiqueta: '“日常生活中的中国”在2023至2025年间的四项变化',
    },
    'guia-bloque-6': {
      etiqueta: '“疫苗”的假设',
    },
    palabras: {
      etiqueta: '开放式回答中的四个词',
    },
  },
}
