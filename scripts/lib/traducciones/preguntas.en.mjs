// Traducción al inglés del catálogo del explorador (`scripts/lib/preguntas_explorador.mjs` y las abiertas), por id de pregunta. `categorias` va por código; `categoriasPorOla`, por código y oleada; `serie`, lo de «Entre oleadas». Los enunciados y categorías de 2023 y 2024 salen del libro de códigos oficial en este idioma; los de 2025, sin libro, los traducimos nosotros.
//
// Cada valor empieza igual al español y se reemplaza por la traducción. Las claves no se tocan:
// el ETL falla si falta o sobra una (`validar.mjs`). Generado por `node scripts/etl_combinada.mjs --esqueleto`.
//
// Procedencia (glosario, `la documentación interna`, sección 4): donde
// el libro EN 2023/2024 trae el texto, va el oficial salvo los desvíos del glosario (número de
// término entre paréntesis). `// sin libro` marca lo que ningún libro traduce y tradujimos nosotros.
// Los títulos son nuestros siempre. Donde el rótulo del catálogo difiere del rótulo español del
// libro, se traduce el del catálogo con el vocabulario del libro.

export default {
  // Libro: L23 rótulo y escala, L24 enunciado y escala («Very unfavorable / Very favorable»,
  // «Prefer not to answer»). El resto del enunciado, sin libro.
  p5_1_val: {
    titulo: 'Opinion of China, 0 to 100',
    enunciado: 'What is your opinion about the following countries? Give your opinion on a scale from 0 to 100, where 0 is “Very unfavorable” and 100 is “Very favorable.” If you have no opinion or know nothing about that country, select “Prefer not to answer.” Country: China.',
  },
  p5_2_val: {
    titulo: 'Opinion of the United States, 0 to 100',
    enunciado: 'What is your opinion about the following countries? Give your opinion on a scale from 0 to 100, where 0 is “Very unfavorable” and 100 is “Very favorable.” If you have no opinion or know nothing about that country, select “Prefer not to answer.” Country: United States.',
  },
  p5_3_val: {
    titulo: 'Opinion of South Korea, 0 to 100',
    enunciado: 'What is your opinion about the following countries? Give your opinion on a scale from 0 to 100, where 0 is “Very unfavorable” and 100 is “Very favorable.” If you have no opinion or know nothing about that country, select “Prefer not to answer.” Country: South Korea.',
  },
  p5_4_val: {
    titulo: 'Opinion of France, 0 to 100',
    enunciado: 'What is your opinion about the following countries? Give your opinion on a scale from 0 to 100, where 0 is “Very unfavorable” and 100 is “Very favorable.” If you have no opinion or know nothing about that country, select “Prefer not to answer.” Country: France.',
  },
  p5_5_val: {
    titulo: 'Opinion of Japan, 0 to 100',
    enunciado: 'What is your opinion about the following countries? Give your opinion on a scale from 0 to 100, where 0 is “Very unfavorable” and 100 is “Very favorable.” If you have no opinion or know nothing about that country, select “Prefer not to answer.” Country: Japan.',
  },
  // Libro: L23 P4_1–P4_5, enunciado oficial («What’s the first thing that comes to mind when they say...?»).
  p4_1: {
    titulo: 'First thing that comes to mind about China',
    enunciado: 'What’s the first thing that comes to mind when they say “China”?',
    nota: 'Open-ended question: the words people wrote are counted, grouped by stem.',
  },
  p4_2: {
    titulo: 'First thing that comes to mind about the United States',
    enunciado: 'What’s the first thing that comes to mind when they say “United States”?',
    nota: 'Open-ended question: the words people wrote are counted, grouped by stem.',
  },
  p4_3: {
    titulo: 'First thing that comes to mind about South Korea',
    enunciado: 'What’s the first thing that comes to mind when they say “South Korea”?',
    nota: 'Open-ended question: the words people wrote are counted, grouped by stem.',
  },
  p4_4: {
    titulo: 'First thing that comes to mind about France',
    enunciado: 'What’s the first thing that comes to mind when they say “France”?',
    nota: 'Open-ended question: the words people wrote are counted, grouped by stem.',
  },
  p4_5: {
    titulo: 'First thing that comes to mind about Japan',
    enunciado: 'What’s the first thing that comes to mind when they say “Japan”?',
    nota: 'Open-ended question: the words people wrote are counted, grouped by stem.',
  },
  // Libro: rótulo y categorías L23/L24; enunciado sin libro. Categorías con desvío (86): «High» no
  // responde a «¿cuánta confianza?».
  p24: {
    titulo: 'Trust in China to deal with Latin America’s problems',
    enunciado: 'How much trust do you have in China’s ability to deal responsibly with Latin America’s problems?',
    categorias: {
      1: 'A great deal',
      2: 'Some',
      3: 'Little',
      99: 'None',
    },
  },
  p25: {
    titulo: 'Trust in the United States to deal with Latin America’s problems',
    enunciado: 'How much trust do you have in the United States’ ability to deal responsibly with Latin America’s problems?',
    categorias: {
      1: 'A great deal',
      2: 'Some',
      3: 'Little',
      99: 'None',
    },
  },
  // Libro: categorías L23/L24, con desvío (91); enunciado sin libro.
  p26: {
    titulo: 'How should Chile position itself between the United States and China?',
    enunciado: 'How do you think Chile should position itself in the coming years in the emerging competition between the United States and China?',
    categorias: {
      1: 'Side with China',
      2: 'Side with the United States',
      3: 'Keep its distance from both',
      4: 'Engage with both',
    },
  },
  // Libro: escala L23; enunciado L24 con desvío (90): «acercamiento» es «closer ties», no «relationship».
  p7: {
    titulo: 'Have closer ties with China brought more risks than opportunities?',
    enunciado: 'Thinking about your municipality or city of residence, indicate whether you agree or disagree with the following statement: “Closer ties with China have generated more risks than opportunities for Chile.”',
    categorias: {
      1: 'Strongly disagree',
      2: 'Disagree',
      3: 'Indifferent',
      4: 'Agree',
      5: 'Strongly agree',
    },
  },
  // Libro: enunciado L24; categorías con desvío (92).
  p6: {
    titulo: 'Does it matter to you that Chile’s economic partners are democracies?',
    enunciado: 'How much does it matter to you that a country that has economic relations with Chile is a democracy?',
    categorias: {
      1: 'It matters a lot to me',
      2: 'It matters little to me',
      3: 'I’m indifferent, it doesn’t matter to me',
    },
    serie: {
      nota: 'In 2023 the question said “has a democratic government”; since 2024, “is a democracy.” The response options are the same, but part of the difference between 2023 and 2024 may come from the change in wording.',
    },
  },
  // Libro: segunda frase y escala L24/L23; el preámbulo de energías renovables, sin libro.
  p27: {
    titulo: 'Can Chinese companies offer better renewable energy solutions?',
    enunciado: 'According to several reports, Chinese technology companies lead the development and production of renewable energy. Do you believe Chinese companies can offer better solutions than US companies?',
    categorias: {
      1: 'Strongly disagree',
      2: 'Disagree',
      3: 'Indifferent',
      4: 'Agree',
      5: 'Strongly agree',
    },
  },
  // sin libro (2025); la escala es la de acuerdo de L23.
  p37: {
    titulo: 'Should Chile prioritize human rights in its relationship with China?',
    enunciado: 'Do you think Chile should prioritize the human rights agenda in its relationship with China?',
    categorias: {
      1: 'Strongly agree',
      2: 'Agree',
      3: 'Indifferent',
      4: 'Disagree',
      5: 'Strongly disagree',
    },
  },
  // Libro: enunciado y categorías L23/L24 («/» del libro como «or», igual que el catálogo).
  p1: {
    titulo: 'What activity is your professional area related to?',
    enunciado: 'Is your professional area related to any of these activities?',
    categorias: {
      1: 'Mining',
      2: 'Agriculture or fruit farming',
      3: 'Retail or customer service',
      4: 'Financial services or telecommunications',
      5: 'Livestock or aquaculture',
      6: 'Tourism',
      7: 'Manufacturing or national industry',
      8: 'Academia',
      9: 'Government',
      98: 'Other area',
    },
  },
  // Libro: enunciado y categorías L23/L24.
  p2: {
    titulo: 'In your professional area, China is mainly…',
    enunciado: 'Thinking about your professional area, would you say that China is mainly…',
    categorias: {
      1: 'An important investor',
      2: 'An important buyer',
      3: 'An important supplier',
      4: 'An important competitor',
    },
  },
  // sin libro; categorías iguales a p2 (L23/L24).
  p8: {
    titulo: 'In your municipality or city, China is mainly…',
    enunciado: 'Thinking about your municipality or city, would you say that China is mainly…',
    categorias: {
      1: 'An important investor',
      2: 'An important buyer',
      3: 'An important supplier',
      4: 'An important competitor',
    },
  },
  // Libro: L24 enunciado recortado («Do you think the Chilean state should have an institution that
  // can block investments...?»), completado por nosotros. Categoría 1: el oficial («Investments
  // should be limited…») pierde el «poder» del catálogo; categoría 2, oficial.
  p19: {
    titulo: 'Should the Chilean state be able to block investment in strategic sectors?',
    enunciado: 'Do you think the Chilean state should have an institution that can block investments if they affect the Chilean state’s control over strategic sectors, or do you think foreign companies should be allowed to invest freely?',
    categorias: {
      1: 'It should be able to limit them in strategic sectors',
      2: 'Foreign companies should be allowed to invest freely',
    },
  },
  // Libro: sectores L23 (datos 2024 sin libro); enunciado sin libro. «Hotel» → «Hotel industry»,
  // en serie con «Wine industry».
  p20: {
    titulo: 'In which sectors is it most important to limit foreign investment?',
    enunciado: 'Which sectors do you think are most important for restricting foreign investment?',
    enunciadoPorOla: {
      2024: 'Which sector do you think is most important for restricting foreign investment?',
    },
    poblacion: 'Only asked of those who said the Chilean state should be able to limit investment in strategic sectors.',
    categorias: {
      p20_1: 'Electrical distribution',
      p20_2: 'Copper',
      p20_3: 'Lithium',
      p20_4: 'Hotel industry',
      p20_5: '5G and telecommunications',
      p20_6: 'Wine industry',
      p20_7: 'Banking',
      p20_98: 'Other sector',
    },
  },
  // Libro: escala L23/L24; enunciados sin libro. 2023 es inversión china y 2024–2025 extranjera (84).
  p21: {
    titulo: 'Would more foreign investment in Chile benefit you?',
    enunciado: 'Thinking about your personal situation, what do you think about Chile receiving more investment from foreign companies in the coming years?',
    tituloPorOla: {
      2023: 'Would more Chinese investment in Chile benefit you?',
    },
    enunciadoPorOla: {
      2023: 'Thinking about your personal situation, what do you think about Chile receiving more investment from China in the coming years?',
    },
    categorias: {
      1: 'Very harmful',
      2: 'Harmful',
      3: 'Indifferent',
      4: 'Beneficial',
      5: 'Very beneficial',
    },
    serie: {
      nota: 'Excludes 2023, which asked about investment from China rather than foreign investment in general. In 2025 the question came after an experimental module on Chinese investment in telecommunications.',
    },
  },
  // Libro: efectos L23 (datos 2024 sin libro); enunciado sin libro. Donde el rótulo del catálogo
  // difiere del libro ES («Peores condiciones laborales», «Llegada de inmigración china»), se
  // traduce el del catálogo.
  p22: {
    titulo: 'What effects of Chinese investment do you see in your municipality?',
    enunciado: 'Thinking about your municipality of residence, what effects of Chinese investment do you observe? Choose up to two options.',
    categorias: {
      p22_1: 'Worse working conditions',
      p22_2: 'Environmental pollution',
      p22_3: 'Decline in competitiveness of Chilean companies',
      p22_4: 'Arrival of Chinese immigrants',
      p22_5: 'Loss of sovereignty over natural resources',
      p22_6: 'Greater variety of products',
      p22_7: 'Job creation',
      p22_8: 'Technological improvement',
      p22_98: 'Other effect',
    },
  },
  // Libro: enunciado L24 P6A.
  p6a: {
    titulo: 'Can you name at least three Chinese companies or brands?',
    enunciado: 'Can you name at least three Chinese companies or brands?',
    categorias: {
      0: 'No',
      1: 'Yes',
    },
    serie: {
      nota: 'In 2024 those who said yes wrote all three brands; in 2025 people could say yes and write fewer.',
    },
  },
  p6a_marcas: {
    titulo: 'Chinese brands mentioned',
    enunciado: 'Can you name at least three Chinese companies or brands?',
    poblacion: 'Only those who said they could name any.',
    nota: 'Open-ended question: the words people wrote are counted, grouped by stem.',
  },
  // sin libro (2025). «Puede elegir varios» → «Select all that apply» (18).
  p6b: {
    titulo: 'Which of these countries have you visited?',
    enunciado: 'Have you visited any of the following countries? Select all that apply.',
    nota: 'There was no “None” option, and many of the people who checked “Other” wrote that they had not visited any of these countries: that bar does not measure travel to other countries.',
    categorias: {
      p6b_1: 'United States',
      p6b_2: 'China',
      p6b_3: 'Spain',
      p6b_4: 'Brazil',
      p6b_98: 'Other',
    },
  },
  // Libro: rótulo L23/L24 («Chinese mall»), con desvío (93); «a menos de diez cuadras», sin libro.
  p12: {
    titulo: 'Do you live fewer than ten blocks from a Chinese-run variety store?',
    enunciado: 'Do you live fewer than ten blocks from a Chinese-run variety store (mall chino)?',
    categorias: {
      1: 'Yes',
      2: 'No',
    },
  },
  // Libro: rótulo L23/L24 («Chinese Restaurant»); enunciado sin libro.
  p13: {
    titulo: 'Do you live fewer than ten blocks from a Chinese restaurant?',
    enunciado: 'Do you live fewer than ten blocks from a Chinese restaurant?',
    categorias: {
      1: 'Yes',
      2: 'No',
    },
  },
  // Libro: rótulo L23/L24 («Personal Contact»); enunciado sin libro, con el término 95.
  p14: {
    titulo: 'Do you personally know anyone from China or of Chinese descent?',
    enunciado: 'Do you personally know anyone from China or of Chinese descent?',
    categorias: {
      1: 'Yes',
      2: 'No',
    },
  },
  // Libro: tramos L24 (2024–2025) y L23 (2023); enunciado sin libro.
  p15: {
    titulo: 'How many Chinese people do you think live in Chile?',
    enunciado: 'Approximately how many Chinese people do you think live in Chile?',
    categorias: {
      1: 'Less than 20 thousand',
      2: 'Between 20 and 99 thousand',
      3: 'Between 100 and 199 thousand',
      4: 'Between 200 and 300 thousand',
    },
    categoriasPorOla: {
      2: {
        2023: 'Between 20 and 50 thousand',
      },
      3: {
        2023: 'Between 100 and 150 thousand',
      },
    },
    serie: {
      nota: 'Excludes 2023, which offered other ranges (20 to 50 thousand and 100 to 150 thousand).',
    },
  },
  // Libro: categorías L23 P17NEW; enunciado sin libro.
  p17_escala: {
    titulo: 'How have your interactions with Chinese people been?',
    enunciado: 'How have your interactions with people from China or of Chinese descent been?',
    sinSerie: 'Asked with these response options only in 2023; since 2024 the answer is open-ended.',
    categorias: {
      1: 'Very good',
      2: 'Good',
      3: 'Indifferent',
      4: 'Bad',
      5: 'Very bad',
    },
  },
  // sin libro.
  p16: {
    titulo: 'Where do you have contact with people from China?',
    enunciado: 'In what context(s) do you have contact or interaction with people from China or of Chinese descent?',
    nota: 'Open-ended question: the words people wrote are counted, grouped by stem.',
  },
  // sin libro.
  p17_texto: {
    titulo: 'What have your interactions with people from China been like?',
    enunciado: 'How have your interactions with people from China or of Chinese descent been?',
    nota: 'Open-ended question: the words people wrote are counted, grouped by stem.',
  },
  // sin libro; «racista (anti-chino o asiático)» con el término 96.
  p18: {
    titulo: 'Have you recently seen something racist against Chinese or Asian people?',
    enunciado: 'Have you recently seen a news story or meme, or witnessed an interaction or incident, that you consider to have been racist (anti-Chinese or anti-Asian)?',
    categorias: {
      1: 'Yes',
      2: 'No',
    },
  },
  // sin libro (2024 y 2025).
  p18a: {
    titulo: 'How do you get information? (2024: about China; 2025: about international affairs)',
    enunciado: 'How do you get information about international affairs? Select all that apply.',
    tituloPorOla: {
      2024: 'How do you get information about China?',
      2025: 'How do you get information about international affairs?',
    },
    enunciadoPorOla: {
      2024: 'How do you get information about China? Select all that apply.',
    },
    sinSerie: 'In 2024 the question asked how you get information about China, and in 2025 about international affairs: they are two different questions.',
    categorias: {
      p18a_1: 'Social media or YouTube',
      p18a_2: 'Television',
      p18a_3: 'Newspapers',
      p18a_4: 'I don’t keep up with the news',
    },
  },
  // sin libro (2025).
  p18c: {
    titulo: 'Would you like your son or daughter to study Mandarin Chinese?',
    enunciado: 'Would you be interested in your son or daughter studying Mandarin Chinese at school or university?',
    categorias: {
      1: 'Very interested',
      2: 'Interested',
      3: 'Indifferent',
      4: 'Not very interested',
      5: 'Not at all interested',
    },
  },
  // sin libro (2025).
  p18d: {
    titulo: 'What do you think of 30% of Santiago’s buses being electric?',
    enunciado: 'What do you think about 30% of Santiago’s public bus fleet being electric?',
    categorias: {
      1: 'Very positive',
      2: 'Positive',
      3: 'Indifferent',
      4: 'Negative',
      5: 'Very negative',
    },
  },
  // sin libro (2025).
  p18e: {
    titulo: 'Did you know that Santiago’s electric buses are Chinese-branded?',
    enunciado: 'Did you know that these buses are Chinese-branded (mainly BYD and Foton)?',
    categorias: {
      1: 'Yes',
      2: 'No',
    },
  },
  // Libro: enunciado L24; dosis con el término 83. «No recuerdo», sin libro.
  p9: {
    titulo: 'Did you receive a Sinovac COVID-19 vaccine?',
    enunciado: 'Did you receive any Sinovac COVID-19 vaccine during the pandemic?',
    categorias: {
      1: 'Yes, two doses',
      2: 'Yes, one dose',
      3: 'No, none',
      4: 'I don’t remember',
    },
    serie: {
      nota: 'Across waves, doses are combined.',
      categorias: {
        0: 'None',
        1: 'At least one dose',
      },
    },
  },
  // Libro: enunciado L24 («I would have preferred my first vaccines to be Pfizer or Moderna») y
  // escala L23; «De haber estado disponibles» y la pregunta de acuerdo, sin libro.
  p10: {
    titulo: 'Would you have preferred your first vaccines to be Pfizer or Moderna?',
    enunciado: 'How much do you agree with the following statement? “Had they been available, I would have preferred my first vaccines to be Pfizer or Moderna.”',
    poblacion: 'Only asked of those who received a Sinovac vaccine.',
    categorias: {
      1: 'Strongly disagree',
      2: 'Disagree',
      3: 'Indifferent',
      4: 'Agree',
      5: 'Strongly agree',
    },
  },
  // Libro: categorías L23 P11; enunciado sin libro.
  p11: {
    titulo: 'What is your opinion of Sinovac vaccines?',
    enunciado: 'What is your opinion of Sinovac COVID-19 vaccines?',
    poblacionPorOla: {
      2023: 'In 2023, asked only of those who received a Sinovac vaccine; since 2024, asked of everyone.',
    },
    categorias: {
      1: 'Very good',
      2: 'Good',
      3: 'Indifferent',
      4: 'Bad',
      5: 'Very bad',
    },
    serie: {
      nota: 'Across waves, only those who received Sinovac are included: in 2023 the question was asked only of them, and since 2024 of everyone.',
    },
  },
  // Libro: enunciado L24; extremos L23 («Far Left / Far Right», término 58).
  p3: {
    titulo: 'Political ideology, from 1 (left) to 10 (right)',
    enunciado: 'Where 1 is extreme left and 10 extreme right, what is your political ideology?',
    categorias: {
      1: '1 · Far left',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10 · Far right',
    },
  },
  // Libro: 2023–2024, enunciado L23/L24 (sin «between Boric and Kast», que el catálogo no trae) y
  // categorías con desvío (82: «Null vote» → «Spoiled ballot»). 2025 (Kast contra Jara): sin libro.
  p4: {
    titulo: 'Vote in the presidential runoff',
    enunciado: 'If the presidential runoff were held today and you had to choose one of these two options, who would you vote for?',
    tituloPorOla: {
      2023: 'Who did you vote for in the 2021 runoff?',
      2024: 'Who did you vote for in the 2021 runoff?',
      2025: 'Who would you vote for in a runoff between Kast and Jara?',
    },
    enunciadoPorOla: {
      2023: 'Who did you vote for in the last presidential election runoff?',
      2024: 'Who did you vote for in the last presidential election runoff?',
    },
    categorias: {
      1: 'Kast',
      2: 'Jara',
      3: 'Would not vote or would vote blank',
      4: 'Spoiled ballot',
    },
    categoriasPorOla: {
      1: {
        2023: 'Boric',
        2024: 'Boric',
      },
      2: {
        2023: 'Kast',
        2024: 'Kast',
      },
      3: {
        2023: 'Did not vote / voted blank',
        2024: 'Did not vote / voted blank',
      },
    },
    serie: {
      nota: '2023 and 2024 ask who people voted for in the 2021 runoff (Boric or Kast); 2025, who they would vote for in a runoff between Kast and Jara. Boric and Jara appear only in their own waves.',
      categorias: {
        1: 'Boric',
        2: 'Kast',
        3: 'Did not or would not vote, or blank ballot',
        4: 'Spoiled ballot',
        5: 'Jara',
      },
    },
  },
}
