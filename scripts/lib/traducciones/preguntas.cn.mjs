// Traducción al chino (simplificado) del catálogo del explorador (`scripts/lib/preguntas_explorador.mjs` y las abiertas), por id de pregunta. `categorias` va por código; `categoriasPorOla`, por código y oleada; `serie`, lo de «Entre oleadas». Los enunciados y categorías de 2023 y 2024 salen del libro de códigos oficial en este idioma; los de 2025, sin libro, los traducimos nosotros.
//
// Las claves no se tocan: el ETL falla si falta o sobra una (`validar.mjs`). Generado por
// `node scripts/etl_combinada.mjs --esqueleto` y traducido a mano. Términos según el glosario
// (`la documentación interna`); donde el libro oficial CN tiene un error
// documentado en el alineado, manda el glosario y se anota «desvío». `// sin libro`: ningún libro
// trae la pregunta (o esa versión), la traducción es nuestra.
//
// Decisiones transversales:
// - «Indiferente» en toda escala → 中立 (L23; término 87), también en p11, p17_escala, p21, p18c y
//   p18d, para que un concepto tenga un término. El libro alterna 中立 / 无所谓 / 一般.
// - Escala de acuerdo → 强烈不同意…强烈同意 (L23), no 强烈反对 / 反对 (L24).
// - comuna → 市镇（comuna） en el enunciado; en títulos, 市镇.

export default {
  p5_1_val: {
    titulo: '对中国的好感度（0–100）',
    // Desvío (término 88): el libro dice 非常不利 / 非常有利 («desventajoso / ventajoso»).
    enunciado: '您对以下国家的看法如何？请按0至100分作答，0表示“非常负面”，100表示“非常正面”。如果您对该国没有看法或完全不了解，请选择“不愿回答”。国家：中国。',
  },
  p5_2_val: {
    titulo: '对美国的好感度（0–100）',
    enunciado: '您对以下国家的看法如何？请按0至100分作答，0表示“非常负面”，100表示“非常正面”。如果您对该国没有看法或完全不了解，请选择“不愿回答”。国家：美国。',
  },
  p5_3_val: {
    titulo: '对韩国的好感度（0–100）',
    enunciado: '您对以下国家的看法如何？请按0至100分作答，0表示“非常负面”，100表示“非常正面”。如果您对该国没有看法或完全不了解，请选择“不愿回答”。国家：韩国。',
  },
  p5_4_val: {
    titulo: '对法国的好感度（0–100）',
    enunciado: '您对以下国家的看法如何？请按0至100分作答，0表示“非常负面”，100表示“非常正面”。如果您对该国没有看法或完全不了解，请选择“不愿回答”。国家：法国。',
  },
  p5_5_val: {
    titulo: '对日本的好感度（0–100）',
    enunciado: '您对以下国家的看法如何？请按0至100分作答，0表示“非常负面”，100表示“非常正面”。如果您对该国没有看法或完全不了解，请选择“不愿回答”。国家：日本。',
  },
  p4_1: {
    titulo: '提到中国时首先想到的',
    enunciado: '当有人提到“中国”时，您首先想到的是什么？',
    nota: '开放式问题：统计受访者写下的词语，并按词根归并。',
  },
  p4_2: {
    titulo: '提到美国时首先想到的',
    enunciado: '当有人提到“美国”时，您首先想到的是什么？',
    nota: '开放式问题：统计受访者写下的词语，并按词根归并。',
  },
  p4_3: {
    titulo: '提到韩国时首先想到的',
    enunciado: '当有人提到“韩国”时，您首先想到的是什么？',
    nota: '开放式问题：统计受访者写下的词语，并按词根归并。',
  },
  p4_4: {
    titulo: '提到法国时首先想到的',
    enunciado: '当有人提到“法国”时，您首先想到的是什么？',
    nota: '开放式问题：统计受访者写下的词语，并按词根归并。',
  },
  p4_5: {
    titulo: '提到日本时首先想到的',
    enunciado: '当有人提到“日本”时，您首先想到的是什么？',
    nota: '开放式问题：统计受访者写下的词语，并按词根归并。',
  },
  p24: {
    titulo: '对中国应对拉丁美洲问题能力的信任',
    // Categorías de L24; desvío de L23 (完全不信任), término 86.
    enunciado: '您在多大程度上信任中国有能力以负责任的方式应对拉丁美洲的问题？',
    categorias: {
      1: '很多',
      2: '一些',
      3: '很少',
      99: '没有',
    },
  },
  p25: {
    titulo: '对美国应对拉丁美洲问题能力的信任',
    enunciado: '您在多大程度上信任美国有能力以负责任的方式应对拉丁美洲的问题？',
    categorias: {
      1: '很多',
      2: '一些',
      3: '很少',
      99: '没有',
    },
  },
  p26: {
    titulo: '智利应如何在美国与中国之间定位？',
    enunciado: '您认为在未来几年日益显现的美中竞争中，智利应如何定位？',
    categorias: {
      1: '支持中国',
      2: '支持美国',
      3: '与两国保持距离',
      4: '与两国都保持往来',
    },
  },
  p7: {
    // Desvío (término 90): L24 dice 与中国的关系 («la relación»), no «el acercamiento».
    titulo: '与中国关系的拉近带来的风险是否多于机遇？',
    enunciado: '请结合您所居住的市镇（comuna）或城市，表明您是否同意以下说法：“与中国关系的拉近为智利带来的风险多于机遇。”',
    categorias: {
      1: '强烈不同意',
      2: '不同意',
      3: '中立',
      4: '同意',
      5: '强烈同意',
    },
  },
  p6: {
    // Desvío (término 92): el libro dice 重要 («importante») y L24 es agramatical (是否…吗).
    titulo: '您是否在意智利的经济伙伴为民主国家？',
    enunciado: '对于与智利有经济往来的国家是否为民主国家，您在意的程度如何？',
    categorias: {
      1: '很在意',
      2: '不太在意',
      3: '无所谓，不在意',
    },
    serie: {
      nota: '2023年的题目措辞为“拥有民主政府”，自2024年起为“是民主国家”。答案选项相同，但2023年与2024年之间的部分差异可能来自题目措辞的改动。',
    },
  },
  p27: {
    // El libro L24 no trae el preámbulo de energías renovables: se traduce del catálogo.
    titulo: '中国企业能否在可再生能源领域提供更好的解决方案？',
    enunciado: '多份报告显示，中国科技企业在可再生能源的开发和生产方面处于领先地位。您是否认为中国企业能够提供比美国企业更好的解决方案？',
    categorias: {
      1: '强烈不同意',
      2: '不同意',
      3: '中立',
      4: '同意',
      5: '强烈同意',
    },
  },
  p37: { // sin libro
    titulo: '智利在对华关系中是否应优先考虑人权？',
    enunciado: '您是否认为智利在与中国的关系中应优先推进人权议程？',
    categorias: {
      1: '强烈同意',
      2: '同意',
      3: '中立',
      4: '不同意',
      5: '强烈不同意',
    },
  },
  p1: {
    titulo: '您的职业领域与哪类活动相关？',
    enunciado: '您的职业领域是否与以下某项活动相关？',
    categorias: {
      1: '矿业',
      // Desvío leve: el libro dice 农业/果农 (果农 es «fruticultor», la persona, no el sector).
      2: '农业或水果种植业',
      3: '零售或客户服务',
      4: '金融服务或电信',
      5: '畜牧业或水产养殖',
      6: '旅游业',
      7: '制造业或本国工业',
      8: '学术界',
      9: '政府',
      98: '其他领域',
    },
  },
  p2: {
    titulo: '在您的职业领域，中国主要是……',
    enunciado: '就您的职业领域而言，您认为中国主要是……',
    categorias: {
      1: '重要投资者',
      2: '重要买家',
      3: '重要供应商',
      4: '重要竞争对手',
    },
  },
  p8: { // sin libro
    titulo: '在您所在的市镇或城市，中国主要是……',
    enunciado: '就您所在的市镇（comuna）或城市而言，您认为中国主要是……',
    categorias: {
      1: '重要投资者',
      2: '重要买家',
      3: '重要供应商',
      4: '重要竞争对手',
    },
  },
  p19: {
    // Desvío (término 85): L24 dice 政府 y 限制 donde el español dice «Estado» y «bloquear».
    titulo: '国家是否应能阻止战略性行业的投资？',
    enunciado: '您认为智利是否应设立一个机构，在投资影响智利国家对战略性行业的控制时能够阻止这些投资？还是认为应允许外国企业自由投资？',
    categorias: {
      1: '应能在战略性行业限制投资',
      2: '应允许外国企业自由投资',
    },
  },
  p20: {
    // Libro 2023 (rótulo y sectores); el enunciado y la versión 2024, sin libro.
    titulo: '限制哪些行业的外国投资最为重要？',
    enunciado: '您认为限制哪些行业的外国投资最为重要？',
    enunciadoPorOla: {
      2024: '您认为限制哪个行业的外国投资最为重要？',
    },
    poblacion: '仅询问认为国家应能在战略性行业限制投资的受访者。',
    categorias: {
      p20_1: '电力分配',
      p20_2: '铜业',
      p20_3: '锂业',
      p20_4: '酒店业',
      p20_5: '5G与电信',
      p20_6: '葡萄酒业',
      p20_7: '银行业',
      p20_98: '其他行业',
    },
  },
  p21: {
    titulo: '智利获得更多外国投资对您有利吗？',
    enunciado: '从您的个人情况出发，您如何看待智利在未来几年获得更多外国企业的投资？',
    tituloPorOla: {
      2023: '智利获得更多中国投资对您有利吗？',
    },
    enunciadoPorOla: {
      2023: '从您的个人情况出发，您如何看待智利在未来几年获得更多来自中国的投资？',
    },
    categorias: {
      1: '非常有害',
      2: '有害',
      3: '中立',
      4: '有益',
      5: '非常有益',
    },
    serie: {
      nota: '不含2023年：该年询问的是中国投资，而非整体外国投资。2025年，该题排在一个关于中国在电信领域投资的实验模块之后。',
    },
  },
  p22: {
    // Libro 2023 (efectos); se sigue el catálogo donde el libro difiere («condiciones», «llegada»).
    titulo: '您在所在市镇看到中国投资带来了哪些影响？',
    enunciado: '就您所居住的市镇（comuna）而言，您观察到中国投资带来了哪些影响？最多选择两项。',
    categorias: {
      p22_1: '劳动条件变差',
      p22_2: '环境污染',
      p22_3: '智利企业竞争力下降',
      p22_4: '中国移民的到来',
      p22_5: '自然资源主权流失',
      p22_6: '产品种类更加丰富',
      p22_7: '创造就业',
      p22_8: '技术改进',
      p22_98: '其他影响',
    },
  },
  p6a: {
    titulo: '您能说出至少三个中国企业或品牌吗？',
    enunciado: '您能说出至少三个中国企业或品牌吗？',
    categorias: {
      0: '否',
      1: '是',
    },
    serie: {
      nota: '2024年，回答“是”的受访者写出了三个品牌；2025年，受访者可以回答“是”但写出的品牌少于三个。',
    },
  },
  p6a_marcas: {
    titulo: '受访者提到的中国品牌',
    enunciado: '您能说出至少三个中国企业或品牌吗？',
    poblacion: '仅包括表示能说出中国企业或品牌的受访者。',
    nota: '开放式问题：统计受访者写下的词语，并按词根归并。',
  },
  p6b: { // sin libro
    titulo: '您去过以下哪些国家？',
    enunciado: '您是否去过以下国家？可多选。',
    nota: '该题没有“都没去过”选项，许多选择“其他”的受访者注明自己没有去过其中任何一个国家：因此该条形并不反映前往其他国家的情况。',
    categorias: {
      p6b_1: '美国',
      p6b_2: '中国',
      p6b_3: '西班牙',
      p6b_4: '巴西',
      p6b_98: '其他',
    },
  },
  p12: {
    // Desvío (término 93): el libro dice 中国商场 («centro comercial»); en Chile es una tienda de variedades.
    titulo: '您是否住在距华人百货店不到十个街区的地方？',
    enunciado: '您是否住在距某家华人经营的百货店（mall chino）不到十个街区的地方？',
    categorias: {
      1: '是',
      2: '否',
    },
  },
  p13: {
    // Término 94: 中餐馆, no 中国餐馆 (libro), que puede leerse como «restaurante en China».
    titulo: '您是否住在距中餐馆不到十个街区的地方？',
    enunciado: '您是否住在距某家中餐馆不到十个街区的地方？',
    categorias: {
      1: '是',
      2: '否',
    },
  },
  p14: {
    titulo: '您是否亲自认识来自中国的人或华裔人士？',
    enunciado: '您是否亲自认识来自中国的人或华裔人士？',
    categorias: {
      1: '是',
      2: '否',
    },
  },
  p15: {
    titulo: '您认为有多少华人生活在智利？',
    enunciado: '您认为在智利生活的华人大约有多少？',
    categorias: {
      1: '少于2万',
      2: '2万至9.9万',
      3: '10万至19.9万',
      4: '20万至30万',
    },
    categoriasPorOla: {
      2: {
        2023: '2万至5万',
      },
      3: {
        2023: '10万至15万',
      },
    },
    serie: {
      nota: '不含2023年：该年提供的是其他区间（2万至5万和10万至15万）。',
    },
  },
  p17_escala: {
    titulo: '您与中国人的互动情况如何？',
    enunciado: '您与来自中国的人或华裔人士的互动情况如何？',
    sinSerie: '该题仅在2023年以这些选项提问；自2024年起改为开放式问题。',
    categorias: {
      1: '非常好',
      2: '好',
      3: '中立',
      4: '差',
      5: '非常差',
    },
  },
  p16: { // sin libro
    titulo: '与来自中国的人接触的场合',
    enunciado: '您在哪些场合与来自中国的人或华裔人士有接触或互动？',
    nota: '开放式问题：统计受访者写下的词语，并按词根归并。',
  },
  p17_texto: { // sin libro
    titulo: '与来自中国的人的互动情况',
    enunciado: '您与来自中国的人或华裔人士的互动情况如何？',
    nota: '开放式问题：统计受访者写下的词语，并按词根归并。',
  },
  p18: { // sin libro
    titulo: '您最近是否见过针对华人或亚裔的种族歧视现象？',
    enunciado: '您最近是否看到过某条新闻或表情包（meme），或亲眼目睹过某次互动或某个情形，并认为其带有针对华人或亚裔的种族歧视色彩？',
    categorias: {
      1: '是',
      2: '否',
    },
  },
  p18a: { // sin libro
    titulo: '您如何获取信息？（2024年：关于中国；2025年：国际事务）',
    enunciado: '您如何获取国际事务方面的信息？可多选。',
    tituloPorOla: {
      2024: '您如何获取关于中国的信息？',
      2025: '您如何获取国际事务方面的信息？',
    },
    enunciadoPorOla: {
      2024: '您如何获取关于中国的信息？可多选。',
    },
    sinSerie: '2024年询问的是如何获取关于中国的信息，2025年询问的是国际事务方面的信息：这是两个不同的问题。',
    categorias: {
      p18a_1: '社交媒体或YouTube',
      p18a_2: '电视',
      p18a_3: '报纸',
      p18a_4: '我不获取这类信息',
    },
  },
  p18c: { // sin libro
    titulo: '您是否有兴趣让子女学习汉语普通话？',
    enunciado: '您是否有兴趣让您的子女在中小学或大学学习汉语普通话？',
    categorias: {
      1: '非常感兴趣',
      2: '感兴趣',
      3: '中立',
      4: '不太感兴趣',
      5: '完全不感兴趣',
    },
  },
  p18d: { // sin libro
    titulo: '您如何看待圣地亚哥30%的公交车为电动公交车？',
    enunciado: '圣地亚哥公共公交车队中有30%为电动公交车，您对此怎么看？',
    categorias: {
      1: '非常正面',
      2: '正面',
      3: '中立',
      4: '负面',
      5: '非常负面',
    },
  },
  p18e: { // sin libro
    titulo: '您是否知道圣地亚哥的电动公交车采用中国品牌？',
    enunciado: '您是否知道这些公交车采用中国品牌（主要是比亚迪和福田）？',
    categorias: {
      1: '是',
      2: '否',
    },
  },
  p9: {
    titulo: '您是否接种过科兴新冠疫苗？',
    enunciado: '新冠疫情期间，您是否接种过科兴疫苗？',
    categorias: {
      1: '是，两剂',
      2: '是，一剂',
      3: '否，未接种',
      4: '记不清', // sin libro: ningún libro trae «No recuerdo»
    },
    serie: {
      nota: '跨轮次对比时，接种剂数合并计算。',
      categorias: {
        0: '未接种',
        1: '至少一剂',
      },
    },
  },
  p10: {
    // L24 omite «De haber estado disponibles» y pone la frase en presente: se sigue el catálogo.
    titulo: '您当初是否会更希望最初接种的是辉瑞或莫德纳疫苗？',
    enunciado: '您在多大程度上同意以下说法？“如果当时有的话，我会更希望最初接种的是辉瑞或莫德纳疫苗。”',
    poblacion: '仅询问接种过科兴疫苗的受访者。',
    categorias: {
      1: '强烈不同意',
      2: '不同意',
      3: '中立',
      4: '同意',
      5: '强烈同意',
    },
  },
  p11: {
    // Libro 2023 (rótulo); «Indiferente» → 中立 y no 一般 (el libro), ver arriba.
    titulo: '您如何看待科兴疫苗？',
    enunciado: '您对科兴新冠疫苗的看法如何？',
    poblacionPorOla: {
      2023: '仅询问接种过科兴疫苗的受访者；自2024年起询问全部受访者。',
    },
    categorias: {
      1: '非常好',
      2: '好',
      3: '中立',
      4: '差',
      5: '非常差',
    },
    serie: {
      nota: '跨轮次对比时，仅包括接种过科兴疫苗的受访者：2023年该题只向他们提问，自2024年起向全部受访者提问。',
    },
  },
  p3: {
    titulo: '政治倾向，从1（左）到10（右）',
    enunciado: '在1为极左、10为极右的范围内，您的政治倾向是什么？',
    categorias: {
      1: '1 · 极左',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10 · 极右',
    },
  },
  p4: {
    // Libro 2023–2024 con desvíos: dice 最后一轮 (no «segunda vuelta») y 博里克 (Xinhua: 博里奇).
    // La versión 2025 (Kast contra Jara), sin libro; 哈拉 sin verificar, con el nombre al lado.
    titulo: '总统选举第二轮投票',
    enunciado: '如果今天举行总统选举第二轮投票，而您必须在这两个选项中选择一个，您会投票给谁？',
    tituloPorOla: {
      2023: '您在2021年第二轮投票中投给了谁？',
      2024: '您在2021年第二轮投票中投给了谁？',
      2025: '若第二轮投票在卡斯特与哈拉（Jeannette Jara）之间进行，您会投给谁？',
    },
    enunciadoPorOla: {
      2023: '在上一次总统选举的第二轮投票中，您投票给了谁？',
      2024: '在上一次总统选举的第二轮投票中，您投票给了谁？',
    },
    categorias: {
      1: '卡斯特',
      2: '哈拉',
      3: '不会投票或投白票',
      4: '废票',
    },
    categoriasPorOla: {
      1: {
        2023: '博里奇',
        2024: '博里奇',
      },
      2: {
        2023: '卡斯特',
        2024: '卡斯特',
      },
      3: {
        2023: '未投票/投白票',
        2024: '未投票/投白票',
      },
    },
    serie: {
      nota: '2023年和2024年询问的是在2021年第二轮投票中投给了谁（博里奇或卡斯特）；2025年询问的是若第二轮投票在卡斯特与哈拉（Jeannette Jara）之间进行会投给谁。博里奇和哈拉仅出现在各自所属的轮次中。',
      categorias: {
        1: '博里奇',
        2: '卡斯特',
        3: '未投票、不会投票或投白票',
        4: '废票',
        5: '哈拉',
      },
    },
  },
}
