/**
 * Las preguntas del explorador, una por una: título legible, enunciado, tipo, orden de las
 * categorías y qué se puede comparar entre oleadas.
 *
 * **Es el único lugar donde se decide cómo se muestra una pregunta.** El diccionario del cliente
 * no se toca (`variables[].etiqueta` sigue siendo su texto, con sus prefijos y sus cortes a 255
 * caracteres): acá va lo que lee la persona. Cada entrada salió de una ficha revisada contra los
 * datos de las tres oleadas, no contra el libro de códigos (campaña del 23-09-2026; fichas y
 * cruce con Codex en la documentación interna).
 *
 * `validarPreguntas` la cruza con los datos en cada corrida del ETL y **falla** si un código de
 * los datos no tiene etiqueta, si una etiqueta cambia de sentido entre oleadas sin que la entrada
 * lo declare, o si una variable publicada no está ni acá ni en `FUERA`. Así una oleada nueva
 * no puede colarse con los rótulos de la anterior, que es lo que le pasaba a `p4`: en 2023 la
 * barra «Kast» eran los votantes de Boric.
 *
 * Campos:
 * - `categorias`: `[código, etiqueta]` **en el orden de lectura** (una escala va de un extremo al
 *   otro aunque sus códigos no, como `p24` o `p37`). En una múltiple el código es la columna.
 * - `porOla`: etiquetas que cambian de sentido en alguna oleada (`p4`, `p15`).
 * - `orden: 'frecuencia'`: de mayor a menor, con `alFinal` siempre abajo («Otro»).
 * - `serie`: qué se compara «Entre oleadas». `olas` son las que hicieron la misma pregunta;
 *   `variable` y `categorias` permiten comparar con la derivada (`p9_rec`); `filtro` fija la
 *   población común (`p11`). `recodificar` lleva, por oleada, los códigos de esa oleada a los de
 *   la serie (`p4`: en 2025 el 1 es Kast y el 2 Jara), y en esa oleada cada código va escrito; una categoría de la serie con un tercer
 *   elemento, `[código, etiqueta, olas]`, existe solo en esas oleadas y en las demás no se dibuja
 *   (no es 0 %). `null` con `sinSerie` dice por qué no se ofrece.
 * - `advertencia`: id de una medida de `contrastes`, cuya advertencia se muestra tal cual. El
 *   texto vive allá, en un solo lugar.
 */

export const PREGUNTAS = [
  // --- Cómo se mira a China y a otros países -------------------------------------------------
  ...[
    ['p5_1_val', 'p5_1', 'China'],
    ['p5_2_val', 'p5_2', 'Estados Unidos'],
    ['p5_3_val', 'p5_3', 'Corea del Sur'],
    ['p5_4_val', 'p5_4', 'Francia'],
    ['p5_5_val', 'p5_5', 'Japón'],
  ].map(([id, bandera, pais]) => ({
    id,
    titulo: `Opinión sobre ${pais}, de 0 a 100`,
    enunciado: `¿Cuál es tu opinión sobre los siguientes países? Escribe tu opinión considerando una escala del 0 al 100, donde 0 es «Muy desfavorable» y 100 es «Muy favorable». Si no tienes opinión al respecto o no conoces nada de ese país, selecciona «Prefiero no responder». País: ${pais}.`,
    tipo: 'numerica',
    // Quien eligió «Prefiero no responder» no tiene número: queda fuera del promedio, y la figura
    // dice cuántos fueron.
    noResponde: { variable: bandera, codigo: 999 },
    serie: { olas: [2023, 2024, 2025] },
  })),
  {
    id: 'p24',
    titulo: 'Confianza en China para lidiar con los problemas de América Latina',
    enunciado: '¿Cuánta confianza tienes en la capacidad de China para lidiar de manera responsable con los problemas de América Latina?',
    tipo: 'ordinal',
    // El orden de `CATEGORIAS` en `src/nucleo/confianza.ts`: de un extremo al otro, no por código.
    categorias: [[99, 'Ninguna'], [3, 'Poca'], [2, 'Algo'], [1, 'Mucha']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p25',
    titulo: 'Confianza en Estados Unidos para lidiar con los problemas de América Latina',
    enunciado: '¿Cuánta confianza tienes en la capacidad de Estados Unidos para lidiar de manera responsable con los problemas de América Latina?',
    tipo: 'ordinal',
    categorias: [[99, 'Ninguna'], [3, 'Poca'], [2, 'Algo'], [1, 'Mucha']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p26',
    titulo: '¿Cómo debería posicionarse Chile entre Estados Unidos y China?',
    enunciado: '¿Cómo cree usted que Chile debería posicionarse en los próximos años en la emergente competencia entre Estados Unidos y China?',
    tipo: 'nominal',
    // El orden de la historia (`repartoP26`): los dos alineamientos en los extremos.
    categorias: [[2, 'A favor de EE. UU.'], [3, 'Mantener distancia de ambos'], [4, 'Relacionarse con ambos'], [1, 'A favor de China']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p7',
    titulo: '¿El acercamiento con China ha traído más riesgos que oportunidades?',
    enunciado: 'Pensando en su comuna o ciudad de residencia, indique si está de acuerdo o en desacuerdo con la siguiente afirmación: «El acercamiento con China ha generado más riesgos que oportunidades para Chile».',
    tipo: 'ordinal',
    categorias: [[1, 'Muy en desacuerdo'], [2, 'En desacuerdo'], [3, 'Indiferente'], [4, 'De acuerdo'], [5, 'Muy de acuerdo']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p6',
    titulo: '¿Te importa que los socios económicos de Chile sean democracias?',
    enunciado: '¿Cuánto le importa que un país que se relaciona económicamente con Chile sea una democracia?',
    tipo: 'ordinal',
    categorias: [[1, 'Me importa mucho'], [2, 'Me importa poco'], [3, 'Me es indiferente o no me importa']],
    serie: {
      olas: [2023, 2024, 2025],
      nota: 'En 2023 la pregunta decía «tenga un gobierno democrático»; desde 2024, «sea una democracia». Las categorías son las mismas, pero parte de la diferencia entre 2023 y 2024 puede venir del cambio de redacción.',
    },
  },
  {
    id: 'p27',
    titulo: '¿Pueden las empresas chinas dar mejores soluciones en energías renovables?',
    enunciado: 'Según varios informes, las compañías tecnológicas chinas lideran el desarrollo y la producción de energías renovables. ¿Cree usted que las empresas chinas pueden ofrecer mejores soluciones que las empresas estadounidenses?',
    tipo: 'ordinal',
    categorias: [[1, 'Muy en desacuerdo'], [2, 'En desacuerdo'], [3, 'Indiferente'], [4, 'De acuerdo'], [5, 'Muy de acuerdo']],
    serie: { olas: [2023, 2024] },
  },
  {
    id: 'p37',
    titulo: '¿Debería Chile priorizar los derechos humanos en su relación con China?',
    enunciado: '¿Cree usted que Chile debe priorizar la agenda de derechos humanos en la relación con China?',
    tipo: 'ordinal',
    // Codificada al revés que `p27` (1 es «Muy de acuerdo»): se lee en el mismo sentido que ella.
    categorias: [[5, 'Muy en desacuerdo'], [4, 'En desacuerdo'], [3, 'Indiferente'], [2, 'De acuerdo'], [1, 'Muy de acuerdo']],
    serie: null,
  },

  // --- Economía, trabajo e inversión -----------------------------------------------------------
  {
    id: 'p1',
    titulo: '¿Con qué actividad se relaciona tu área profesional?',
    enunciado: '¿Su área profesional está relacionada con alguna de estas actividades?',
    tipo: 'nominal',
    categorias: [
      [1, 'Minería'], [2, 'Agricultura o fruticultura'], [3, 'Comercio minorista o atención al cliente'],
      [4, 'Servicios financieros o telecomunicaciones'], [5, 'Ganadería o acuicultura'], [6, 'Turismo'],
      [7, 'Manufactura o industria nacional'], [8, 'Academia'], [9, 'Gobierno'], [98, 'Otra área'],
    ],
    orden: 'frecuencia',
    alFinal: [98],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p2',
    titulo: 'En tu área profesional, China es principalmente…',
    enunciado: 'Pensando en su área profesional, diría que China es principalmente…',
    tipo: 'nominal',
    // Mismo orden que `p8`, que tiene las mismas opciones: se leen lado a lado.
    categorias: [[1, 'Un inversor importante'], [2, 'Un comprador importante'], [3, 'Un proveedor importante'], [4, 'Un competidor importante']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p8',
    titulo: 'En tu comuna o ciudad, China es principalmente…',
    enunciado: 'Pensando en su comuna o ciudad, diría que China es principalmente…',
    tipo: 'nominal',
    categorias: [[1, 'Un inversor importante'], [2, 'Un comprador importante'], [3, 'Un proveedor importante'], [4, 'Un competidor importante']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p19',
    titulo: '¿Debería el Estado poder bloquear inversiones en sectores estratégicos?',
    enunciado: '¿Cree usted que el Estado chileno debería contar con una institución que pueda bloquear inversiones si estas afectaran el control del Estado chileno sobre sectores estratégicos, o cree que debe permitirse a las empresas extranjeras invertir libremente?',
    tipo: 'binaria',
    categorias: [[1, 'Debería poder limitarlas en sectores estratégicos'], [2, 'Las empresas extranjeras deben invertir libremente']],
    serie: { olas: [2023, 2024, 2025] },
    advertencia: 'limitar-inversiones',
  },
  {
    id: 'p20',
    titulo: '¿En qué sectores es más importante limitar la inversión extranjera?',
    enunciado: '¿Cuáles sectores le parece que son más importantes para limitar inversiones del extranjero?',
    // 2024 lo formula en singular (base 2024, hoja Variables), aunque 302 de 488 marcaron dos o más.
    enunciadoPorOla: { 2024: '¿Cuál sector le parece que es más importante para limitar inversiones del extranjero?' },
    tipo: 'multiple',
    categorias: [
      ['p20_1', 'Distribución eléctrica'], ['p20_2', 'Cobre'], ['p20_3', 'Litio'], ['p20_4', 'Hotelería'],
      ['p20_5', '5G y telecomunicaciones'], ['p20_6', 'Vitivinícola'], ['p20_7', 'Banca'], ['p20_98', 'Otro sector'],
    ],
    orden: 'frecuencia',
    alFinal: ['p20_98'],
    poblacion: 'Solo a quienes dijeron que el Estado debería poder limitar inversiones en sectores estratégicos.',
    serie: { olas: [2023, 2024] },
  },
  {
    id: 'p21',
    titulo: '¿Te conviene que Chile reciba más inversión extranjera?',
    tituloPorOla: { 2023: '¿Te conviene que Chile reciba más inversión china?' },
    enunciado: 'Pensando en su situación personal, ¿qué opina de que en los próximos años Chile reciba más inversiones de empresas extranjeras?',
    enunciadoPorOla: { 2023: 'Pensando en su situación personal, ¿qué opinas de que en los próximos años Chile reciba más inversiones de China?' },
    tipo: 'ordinal',
    categorias: [[1, 'Muy perjudicial'], [2, 'Perjudicial'], [3, 'Indiferente'], [4, 'Beneficioso'], [5, 'Muy beneficioso']],
    serie: {
      olas: [2024, 2025],
      nota: 'Sin 2023, que preguntó por la inversión de China y no por la extranjera en general. En 2025 la pregunta vino después de un bloque experimental sobre inversión china en telecomunicaciones.',
    },
  },
  {
    id: 'p22',
    titulo: '¿Qué efectos de la inversión china ves en tu comuna?',
    enunciado: 'Pensando en su comuna de residencia, ¿qué efectos observa de la inversión china? Elegir hasta dos opciones.',
    tipo: 'multiple',
    categorias: [
      ['p22_1', 'Peores condiciones laborales'], ['p22_2', 'Contaminación ambiental'],
      ['p22_3', 'Menor competitividad de empresas chilenas'], ['p22_4', 'Llegada de inmigración china'],
      ['p22_5', 'Pérdida de soberanía sobre recursos naturales'], ['p22_6', 'Más variedad de productos'],
      ['p22_7', 'Creación de empleo'], ['p22_8', 'Mejora tecnológica'], ['p22_98', 'Otro efecto'],
    ],
    orden: 'frecuencia',
    alFinal: ['p22_98'],
    serie: { olas: [2023, 2024] },
  },

  // --- China en la vida cotidiana --------------------------------------------------------------
  {
    id: 'p6a',
    variable: 'p6a_2',
    titulo: '¿Puedes nombrar al menos tres empresas o marcas chinas?',
    enunciado: '¿Puedes mencionar al menos tres empresas o marcas chinas?',
    tipo: 'binaria',
    // `p6a_1` y `p6a_2` son el «No» y el «Sí» de la misma pregunta, complementarias en todos los
    // casos; `p6a_3` y `p6a_4` solo dicen si se llenó la segunda y tercera casilla de texto.
    categorias: [[1, 'Sí'], [0, 'No']],
    serie: {
      olas: [2024, 2025],
      nota: 'En 2024 quienes dijeron que sí escribieron las tres marcas; en 2025 se podía decir que sí y escribir menos.',
    },
  },
  {
    id: 'p6b',
    titulo: '¿Cuáles de estos países has visitado?',
    enunciado: '¿Ha visitado alguno de los siguientes países? Puede elegir varios.',
    tipo: 'multiple',
    categorias: [['p6b_1', 'Estados Unidos'], ['p6b_2', 'China'], ['p6b_3', 'España'], ['p6b_4', 'Brasil'], ['p6b_98', 'Otro(s)']],
    orden: 'frecuencia',
    alFinal: ['p6b_98'],
    nota: 'No había opción «Ninguno», y muchas de las personas que marcaron «Otro(s)» escribieron que no habían visitado ninguno de estos países: esa barra no mide viajes a otros países.',
    serie: null,
  },
  {
    id: 'p12',
    titulo: '¿Vives a menos de diez cuadras de un mall chino?',
    enunciado: '¿Vive a menos de diez cuadras de algún mall chino?',
    tipo: 'binaria',
    categorias: [[1, 'Sí'], [2, 'No']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p13',
    titulo: '¿Vives a menos de diez cuadras de un restaurante chino?',
    enunciado: '¿Vive a menos de diez cuadras de algún restaurante chino?',
    tipo: 'binaria',
    categorias: [[1, 'Sí'], [2, 'No']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p14',
    titulo: '¿Conoces personalmente a alguien de China o de ascendencia china?',
    enunciado: '¿Conoces personalmente alguna persona de China o de ascendencia china?',
    tipo: 'binaria',
    categorias: [[1, 'Sí'], [2, 'No']],
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p15',
    titulo: '¿Cuántas personas chinas crees que viven en Chile?',
    enunciado: '¿Cuántos chinos crees que viven en Chile, aproximadamente?',
    tipo: 'ordinal',
    categorias: [[1, 'Menos de 20 mil'], [2, 'Entre 20 mil y 99 mil'], [3, 'Entre 100 mil y 199 mil'], [4, 'Entre 200 mil y 300 mil']],
    // 2024 usa los tramos de 2025: lo confirma la hoja `Labels` de la base 2024 (ficha de p15).
    porOla: { 2023: [[2, 'Entre 20 mil y 50 mil'], [3, 'Entre 100 mil y 150 mil']] },
    // Solo categorías idénticas se comparan (hecho 3 de CLAUDE.md). La derivada `p15_rec` junta
    // los tramos del medio para llegar a 2023, pero con otros límites la gente que pensaba en 70
    // o 170 mil tenía otras opciones: queda como alternativa, no como serie.
    serie: {
      olas: [2024, 2025],
      nota: 'Sin 2023, que ofrecía otros tramos (20 a 50 mil y 100 a 150 mil).',
    },
  },
  {
    id: 'p17_escala',
    titulo: '¿Cómo han sido tus interacciones con personas chinas?',
    enunciado: '¿Cómo han sido tus interacciones con personas de China o de ascendencia china?',
    tipo: 'ordinal',
    categorias: [[1, 'Muy buenas'], [2, 'Buenas'], [3, 'Indiferentes'], [4, 'Malas'], [5, 'Muy malas']],
    serie: null,
    sinSerie: 'Con estas categorías solo se preguntó en 2023; desde 2024 la respuesta es abierta.',
  },
  {
    id: 'p18',
    titulo: '¿Has visto hace poco algo racista contra personas chinas o asiáticas?',
    enunciado: '¿Has visto recientemente alguna noticia o meme, o has sido testigo de una interacción o instancia, que consideras que fue racista (anti-chino o asiático)?',
    tipo: 'binaria',
    categorias: [[1, 'Sí'], [2, 'No']],
    serie: { olas: [2023, 2024, 2025] },
    advertencia: 'racismo-visto',
  },
  {
    id: 'p18a',
    // El título general solo aparece en el selector fuera de 2024 y 2025: nombra las dos preguntas.
    titulo: '¿Cómo te informas? (2024: sobre China; 2025: asuntos internacionales)',
    tituloPorOla: { 2024: '¿Cómo te informas sobre China?', 2025: '¿Cómo te informas sobre asuntos internacionales?' },
    enunciado: '¿Cómo te informas sobre asuntos internacionales? Puede elegir varios.',
    enunciadoPorOla: { 2024: '¿Cómo te informas sobre China? Puede elegir varios.' },
    tipo: 'multiple',
    categorias: [['p18a_1', 'Redes sociales o YouTube'], ['p18a_2', 'Televisión'], ['p18a_3', 'Diarios'], ['p18a_4', 'No me informo']],
    orden: 'frecuencia',
    alFinal: ['p18a_4'],
    serie: null,
    sinSerie: 'En 2024 se preguntó cómo te informas sobre China, y en 2025 sobre asuntos internacionales: son dos preguntas distintas.',
  },
  {
    id: 'p18c',
    titulo: '¿Te interesaría que tu hijo o hija estudiara chino mandarín?',
    enunciado: '¿Estaría interesado o interesada en que su hijo o hija estudie chino mandarín en el colegio o la universidad?',
    tipo: 'ordinal',
    categorias: [[1, 'Muy interesado'], [2, 'Interesado'], [3, 'Indiferente'], [4, 'Poco interesado'], [5, 'Nada interesado']],
    serie: null,
  },
  {
    id: 'p18d',
    titulo: '¿Qué te parece que el 30 % de los buses de Santiago sean eléctricos?',
    enunciado: '¿Qué opina de que el 30 % de la flota de buses públicos de Santiago sean eléctricos?',
    tipo: 'ordinal',
    categorias: [[1, 'Muy positivo'], [2, 'Positivo'], [3, 'Indiferente'], [4, 'Negativo'], [5, 'Muy negativo']],
    serie: null,
  },
  {
    id: 'p18e',
    titulo: '¿Sabías que los buses eléctricos de Santiago son de marcas chinas?',
    enunciado: '¿Sabías que estos buses son de marcas chinas (BYD y Foton, principalmente)?',
    tipo: 'binaria',
    categorias: [[1, 'Sí'], [2, 'No']],
    serie: null,
  },

  // --- Vacunas -----------------------------------------------------------------------------------
  {
    id: 'p9',
    titulo: '¿Recibiste alguna vacuna Sinovac contra el COVID-19?',
    enunciado: '¿Recibió alguna vacuna de Sinovac durante la pandemia de COVID-19?',
    tipo: 'nominal',
    categorias: [[1, 'Sí, dos dosis'], [2, 'Sí, una dosis'], [3, 'No, ninguna'], [4, 'No recuerdo']],
    serie: {
      olas: [2023, 2024, 2025],
      variable: 'p9_rec',
      categorias: [[1, 'Al menos una dosis'], [0, 'Ninguna']],
      nota: 'Entre oleadas se juntan las dosis.',
    },
    advertencia: 'sinovac-recibio',
  },
  {
    id: 'p10',
    titulo: '¿Habrías preferido que tus primeras vacunas fueran Pfizer o Moderna?',
    enunciado: '¿Qué tan de acuerdo está con la siguiente frase? «De haber estado disponibles, hubiese preferido que mis primeras vacunas fuesen Pfizer o Moderna».',
    tipo: 'ordinal',
    categorias: [[1, 'Muy en desacuerdo'], [2, 'En desacuerdo'], [3, 'Indiferente'], [4, 'De acuerdo'], [5, 'Muy de acuerdo']],
    poblacion: 'Solo a quienes recibieron alguna vacuna Sinovac.',
    serie: { olas: [2023, 2024, 2025] },
  },
  {
    id: 'p11',
    titulo: '¿Qué opinión tienes de las vacunas Sinovac?',
    enunciado: '¿Qué opinión tiene de las vacunas de COVID-19 de Sinovac?',
    tipo: 'ordinal',
    categorias: [[1, 'Muy buena'], [2, 'Buena'], [3, 'Indiferente'], [4, 'Mala'], [5, 'Muy mala']],
    poblacionPorOla: { 2023: 'Solo a quienes recibieron alguna vacuna Sinovac; desde 2024, a todas las personas.' },
    serie: {
      olas: [2023, 2024, 2025],
      filtro: { variable: 'p9', codigos: [1, 2] },
      nota: 'Entre oleadas, solo quienes recibieron Sinovac: en 2023 la pregunta se les hizo solo a ellos, y desde 2024 a todas las personas.',
    },
  },

  // --- Política --------------------------------------------------------------------------------
  {
    id: 'p3',
    titulo: 'Ideología política, de 1 (izquierda) a 10 (derecha)',
    enunciado: 'Donde 1 es extrema izquierda y 10 extrema derecha, ¿cuál es su ideología política?',
    tipo: 'ordinal',
    categorias: [
      [1, '1 · Muy de izquierda'], [2, '2'], [3, '3'], [4, '4'], [5, '5'],
      [6, '6'], [7, '7'], [8, '8'], [9, '9'], [10, '10 · Muy de derecha'],
    ],
    serie: { olas: [2023, 2024, 2025] },
    // El corte de ideología es esta misma pregunta en tres tramos: cortarla por sí misma no dice nada.
    sinCortes: ['p3_3'],
  },
  {
    id: 'p4',
    titulo: 'Voto en segunda vuelta presidencial',
    tituloPorOla: {
      2023: '¿Por quién votaste en la segunda vuelta de 2021?',
      2024: '¿Por quién votaste en la segunda vuelta de 2021?',
      2025: '¿Por quién votarías en una segunda vuelta entre Kast y Jara?',
    },
    enunciado: 'Si la segunda vuelta de las elecciones presidenciales fuera hoy y tuviera que optar por una de estas dos opciones, ¿por quién votaría?',
    enunciadoPorOla: {
      2023: '¿Por quién votó en la segunda vuelta de las últimas elecciones presidenciales?',
      2024: '¿Por quién votó en la segunda vuelta de las últimas elecciones presidenciales?',
    },
    tipo: 'nominal',
    categorias: [[1, 'Kast'], [2, 'Jara'], [3, 'No votaría o votaría en blanco'], [4, 'Nulo']],
    // Los códigos cambian de candidato en 2025. 2024 usa los de 2023: lo confirma la hoja
    // `Labels` de la base 2024, alineada por `key` (ficha de p4).
    porOla: {
      2023: [[1, 'Boric'], [2, 'Kast'], [3, 'No votó o votó en blanco']],
      2024: [[1, 'Boric'], [2, 'Kast'], [3, 'No votó o votó en blanco']],
    },
    // Felipe, undécima ronda: «unamos las preguntas en la comparación entre oleadas, aprovechando
    // que ambas hablan de segunda vuelta y tienen a Kast». No es la misma pregunta (hecho 3): 2023 y
    // 2024 recuerdan el voto de 2021 y 2025 pregunta por uno hipotético. La nota lo dice, y Boric y
    // Jara solo aparecen en sus oleadas.
    serie: {
      olas: [2023, 2024, 2025],
      recodificar: { 2025: { 1: 2, 2: 5, 3: 3, 4: 4 } },
      categorias: [
        [2, 'Kast'],
        [1, 'Boric', [2023, 2024]],
        [5, 'Jara', [2025]],
        [3, 'No votó o no votaría, o en blanco'],
        [4, 'Nulo'],
      ],
      nota: '2023 y 2024 preguntan por quién se votó en la segunda vuelta de 2021 (Boric o Kast); 2025, por quién se votaría en una segunda vuelta entre Kast y Jara. Boric y Jara aparecen solo en sus oleadas.',
    },
  },
]

/**
 * Variables con categorías que no son una pregunta del explorador, cada una con su razón. Si
 * aparece una nueva en el diccionario, el ETL falla hasta que se decida dónde va.
 */
export const FUERA = {
  sexo: 'caracterización: es un corte', edadr: 'caracterización: es un corte (edad_rec)',
  educacion: 'caracterización: es un corte (educacion_rec)', region: 'caracterización: es un corte (macrozona)',
  nse: 'caracterización: es un corte (nse_rec)',
  p5_1: 'marca de «Prefiero no responder» de p5_1_val', p5_2: 'marca de «Prefiero no responder» de p5_2_val',
  p5_3: 'marca de «Prefiero no responder» de p5_3_val', p5_4: 'marca de «Prefiero no responder» de p5_4_val',
  p5_5: 'marca de «Prefiero no responder» de p5_5_val',
  p9_rec: 'derivada: la serie de p9', p15_rec: 'derivada de p15 con límites distintos en 2023: no se compara',
  p6a_1: 'el «No» de p6a', p6a_3: 'solo dice si se llenó la segunda casilla de p6a', p6a_4: 'solo dice si se llenó la tercera casilla de p6a',
  edad: 'caracterización continua: el corte son sus tramos (edad_rec)',
  p4_voto: 'derivada de p4 en texto, sin 2024: el explorador compara p4 por candidato',
  p23: '2023, escala de 1 a 5 sin enunciado ni etiquetas en ninguna fuente del cliente',
  // El monitor la muestra como la viñeta de inversión china en telecomunicaciones, con etiquetas
  // «Muy negativa … Muy positiva» que no vienen del cliente. `p28_size` reparte 2023 en tres
  // tercios exactos: si son tres versiones de la viñeta, agregada mezcla tratamientos. Queda fuera
  // hasta que ICLAC diga qué es (24-09-2026).
  p28: '2023, viñeta de telecomunicaciones sin etiquetas del cliente; pendiente de ICLAC qué es p28_size',
}

/**
 * Las preguntas abiertas, que el explorador muestra como una múltiple de palabras (Felipe,
 * laboratorio `abiertas`, 24-09-2026): una barra por palabra con el porcentaje de **personas** que
 * la escribieron, sobre las que escribieron algo. Barras y no columnas apiladas, porque una persona
 * nombra varias cosas y los porcentajes no reparten un total.
 *
 * - `palabras`: cuántas muestra la figura. Sin corte y con corte, las más dichas en esa oleada;
 *   entre oleadas, las de mayor porcentaje promedio entre oleadas.
 * - `minimo`: con corte, una palabra que menos de estas personas nombraron en un grupo no lleva
 *   punto en ese grupo. Con las preguntas por país en 2023 casi no quedan puntos: es lo que hay.
 * - `propia`: palabras que no se cuentan, el nombre del propio país (como «china» en «La mirada»).
 * - `despuesDe`: dónde entra en el selector.
 *
 * `scripts/lib/abiertas.mjs` las cuenta en el ETL con el tokenizador de las nubes (`lib/texto.mjs`)
 * y deja por persona solo una marca por palabra de las que pueden salir en la figura. El texto
 * no viaja.
 */
export const ABIERTAS = {
  palabras: 10,
  minimo: 10,
  nota: 'Pregunta abierta: se cuentan las palabras que la gente escribió, agrupadas por raíz.',
  preguntas: [
    ...[
      ['p4_1', 'China', ['china', 'chino'], 'p5_5_val'],
      ['p4_2', 'Estados Unidos', ['eeuu', 'estados', 'unidos', 'usa', 'norteamérica', 'gringo'], 'p4_1'],
      ['p4_3', 'Corea del Sur', ['corea', 'coreano', 'sur'], 'p4_2'],
      ['p4_4', 'Francia', ['francia', 'francés'], 'p4_3'],
      ['p4_5', 'Japón', ['japón', 'japonés'], 'p4_4'],
    ].map(([id, pais, propia, despuesDe]) => ({
      id,
      columnas: [id],
      titulo: `Lo primero que se viene a la cabeza con ${pais}`,
      enunciado: `¿Qué es lo primero que se le viene a la cabeza cuando le dicen «${pais}»?`,
      propia,
      despuesDe,
    })),
    {
      id: 'p16',
      columnas: ['p16'],
      titulo: 'Dónde se tiene contacto con personas de China',
      enunciado: '¿En qué contexto(s) tienes contacto o interacción con personas de China o de ascendencia china?',
      propia: [],
      despuesDe: 'p17_escala',
    },
    {
      id: 'p17_texto',
      columnas: ['p17_texto'],
      titulo: 'Cómo han sido las interacciones con personas de China',
      enunciado: '¿Cómo han sido tus interacciones con personas de China o de ascendencia china?',
      propia: [],
      despuesDe: 'p16',
    },
    {
      id: 'p6a_marcas',
      columnas: ['p6a_2_txt', 'p6a_3_txt', 'p6a_4_txt'],
      titulo: 'Marcas chinas que se mencionan',
      enunciado: '¿Puedes mencionar al menos tres empresas o marcas chinas?',
      poblacion: 'Solo quienes dijeron poder mencionar alguna.',
      propia: [],
      despuesDe: 'p6a',
    },
  ],
}

/** Compara etiquetas sin tildes, mayúsculas, puntuación ni orden de palabras: «1 Muy de Izquierda» = «Muy de Izquierda 1». */
function forma (etiqueta) {
  return String(etiqueta).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').sort().join(' ')
}

/**
 * Cruza el catálogo con los datos y devuelve lo que viaja al navegador. Falla con un mensaje por
 * cada inconsistencia, todas juntas.
 *
 * @param variables  las del diccionario, ya armadas por el ETL
 * @param multiples  los grupos de selección múltiple
 * @param valores    filas de la hoja `valores` ({ variable, ola, codigo, etiqueta })
 * @param casos      las filas que viajan, con `ola`
 * @param preguntas  el catálogo; las pruebas pasan uno roto a propósito
 */
export function validarPreguntas ({ variables, multiples, valores, casos, preguntas = PREGUNTAS }) {
  const errores = []
  const variable = (n) => variables.find((v) => v.nombre === n)
  const olasDe = (n) => [...new Set(casos.filter((c) => c[n] !== null && c[n] !== undefined).map((c) => c.ola))].sort()
  const codigosEn = (n, ola) => new Set(casos.filter((c) => c.ola === ola && c[n] !== null && c[n] !== undefined).map((c) => Number(c[n])))

  const publicadas = []
  for (const p of preguntas) {
    const donde = `explorador · ${p.id}`
    if (p.titulo.length > 80) errores.push(`${donde}: título de ${p.titulo.length} caracteres (máximo 80)`)
    for (const t of [p.titulo, p.enunciado, ...Object.values(p.tituloPorOla ?? {})]) {
      if (/_¿|\s{2}| - ¿/.test(t)) errores.push(`${donde}: texto con restos del diccionario: «${t}»`)
    }

    if (p.tipo === 'multiple') {
      const grupo = multiples.find((m) => m.id === p.id)
      if (!grupo) { errores.push(`${donde}: no hay grupo de selección múltiple con ese id`); continue }
      const declaradas = new Set(p.categorias.map(([c]) => c))
      for (const o of grupo.opciones) if (!declaradas.has(o.columna)) errores.push(`${donde}: la opción ${o.columna} no tiene etiqueta`)
      for (const c of declaradas) if (!grupo.opciones.some((o) => o.columna === c)) errores.push(`${donde}: ${c} no es una opción del grupo`)
      const olas = [...new Set(grupo.opciones.flatMap((o) => o.olas))].sort()
      if (p.serie) for (const o of p.serie.olas) if (!olas.includes(o)) errores.push(`${donde}: la serie pide ${o}, y el grupo no está en esa oleada`)
      publicadas.push(publicar(p, { variable: p.id, olas }))
      continue
    }

    const nombre = p.variable ?? p.id
    const v = variable(nombre)
    if (!v) { errores.push(`${donde}: la variable ${nombre} no está en el diccionario`); continue }
    const olas = olasDe(nombre)

    if (p.tipo !== 'numerica') {
      comprobarCategorias(errores, donde, nombre, p.categorias, p.porOla, olas, codigosEn)
      comprobarEtiquetas(errores, donde, nombre, p, valores)
    } else if (p.noResponde && !variable(p.noResponde.variable)) {
      errores.push(`${donde}: la marca ${p.noResponde.variable} no está en el diccionario`)
    }

    if (p.serie) {
      for (const o of p.serie.olas) if (!olas.includes(o)) errores.push(`${donde}: la serie pide ${o}, y la pregunta no tiene datos ahí`)
      if (p.serie.olas.length < 2) errores.push(`${donde}: una serie de una oleada no compara nada; va \`serie: null\``)
      if (p.serie.variable) {
        const olasSerie = olasDe(p.serie.variable)
        comprobarCategorias(errores, `${donde} (serie)`, p.serie.variable, p.serie.categorias, undefined, olasSerie.filter((o) => p.serie.olas.includes(o)), codigosEn)
      }
      if (p.serie.recodificar) comprobarRecodificacion(errores, `${donde} (serie)`, nombre, p.serie, codigosEn)
      if (p.serie.filtro && !variable(p.serie.filtro.variable)) errores.push(`${donde}: el filtro usa ${p.serie.filtro.variable}, que no existe`)
    } else if (olas.length > 1 && !p.sinSerie && !(v.serie === false)) {
      errores.push(`${donde}: está en ${olas.join(', ')} y no se compara; falta \`sinSerie\` con la razón`)
    }
    publicadas.push(publicar(p, { variable: nombre, olas }))
  }

  // **Toda variable publicada** tiene que estar en una de las listas, tenga o no categorías.
  // Hasta el 24-09-2026 la regla miraba solo las con categorías, y así `p23` y `p28`, categóricas
  // a las que el cliente no les puso etiquetas, llegaban sin categorías y nadie las clasificaba.
  // Las columnas de texto de `ABIERTAS` cuentan como ubicadas aunque el catálogo no las traiga
  // armadas: sus entradas las pone el ETL (`abiertas.mjs`).
  const cubiertas = new Set([
    ...preguntas.map((p) => p.variable ?? p.id),
    ...multiples.flatMap((m) => m.opciones.map((o) => o.columna)),
    ...ABIERTAS.preguntas.flatMap((a) => a.columnas),
    ...Object.keys(FUERA),
  ])
  for (const v of variables) {
    if (!cubiertas.has(v.nombre)) {
      errores.push(`explorador: ${v.nombre} se publica y no está ni en PREGUNTAS ni en FUERA`)
    }
  }

  if (errores.length > 0) throw new Error(`El catálogo del explorador no cuadra con los datos:\n  ${errores.join('\n  ')}`)
  return publicadas
}

function comprobarCategorias (errores, donde, nombre, categorias, porOla, olas, codigosEn) {
  const declaradas = new Set(categorias.map(([c]) => c))
  const vistos = new Set()
  for (const ola of olas) {
    for (const c of codigosEn(nombre, ola)) {
      vistos.add(c)
      if (!declaradas.has(c)) errores.push(`${donde}: el código ${c} aparece en ${ola} y no tiene etiqueta`)
    }
  }
  for (const c of declaradas) if (!vistos.has(c)) errores.push(`${donde}: el código ${c} no aparece en ninguna oleada`)
  for (const [ola, pares] of Object.entries(porOla ?? {})) {
    for (const [c] of pares) if (!declaradas.has(c)) errores.push(`${donde}: porOla ${ola} rotula ${c}, que no está en categorias`)
  }
}

/**
 * Una serie que recodifica: cada código de cada oleada, ya llevado al de la serie, tiene su
 * categoría, y una categoría que declara sus oleadas no tiene respuestas fuera de ellas. Sin esto,
 * un código mal llevado sumaría a Boric los votos de Jara, que es el error que ya se pagó en `p4`.
 */
function comprobarRecodificacion (errores, donde, nombre, serie, codigosEn) {
  const categorias = serie.categorias ?? []
  if (!categorias.length) { errores.push(`${donde}: recodifica y no declara las categorías de la serie`); return }
  for (const ola of serie.olas) {
    const mapa = serie.recodificar[ola]
    for (const c of codigosEn(nombre, ola)) {
      // En una oleada que recodifica, **cada** código va escrito, también los que no cambian: si
      // no, un código olvidado se queda con su número y suma a otro candidato. Con `{ 1: 2 }` los
      // 394 votos de Jara (código 2 en 2025) caían en Kast, que es el código 2 de la serie (Codex).
      if (mapa && !(c in mapa)) { errores.push(`${donde}: el código ${c} de ${ola} no está en el mapa de recodificación`); continue }
      const final = mapa ? mapa[c] : c
      const cat = categorias.find(([k]) => k === final)
      if (!cat) errores.push(`${donde}: el código ${c} de ${ola} queda como ${final}, que no tiene categoría`)
      else if (cat[2] && !cat[2].includes(ola)) errores.push(`${donde}: «${cat[1]}» tiene respuestas en ${ola}, que no está entre sus oleadas`)
    }
  }
}

/**
 * Si la hoja `valores` rotula un código distinto en dos oleadas (más allá de tildes y orden de
 * palabras), la entrada tiene que decir qué etiqueta va en cada una. Es la prueba que habría
 * atrapado a `p4`.
 */
function comprobarEtiquetas (errores, donde, nombre, p, valores) {
  const porCodigo = new Map()
  for (const v of valores) {
    if (String(v.variable ?? '').trim() !== nombre) continue
    const codigo = Number(v.codigo)
    if (!porCodigo.has(codigo)) porCodigo.set(codigo, new Map())
    porCodigo.get(codigo).set(Number(v.ola), String(v.etiqueta ?? '').trim())
  }
  for (const [codigo, olas] of porCodigo) {
    const formas = new Set([...olas.values()].map(forma))
    if (formas.size < 2) continue
    const declarado = Object.values(p.porOla ?? {}).some((pares) => pares.some(([c]) => c === codigo))
    if (!declarado) {
      errores.push(`${donde}: el código ${codigo} cambia de etiqueta entre oleadas (${[...olas].map(([o, e]) => `${o}: «${e}»`).join(', ')}) y la entrada no declara porOla`)
    }
  }
}

function publicar (p, { variable, olas }) {
  const categorias = p.categorias?.map(([codigo, etiqueta]) => {
    const porOla = {}
    for (const [ola, pares] of Object.entries(p.porOla ?? {})) {
      const par = pares.find(([c]) => c === codigo)
      if (par) porOla[ola] = par[1]
    }
    return Object.keys(porOla).length > 0 ? { codigo, etiqueta, porOla } : { codigo, etiqueta }
  })
  return {
    id: p.id,
    variable,
    titulo: p.titulo,
    ...(p.tituloPorOla ? { tituloPorOla: p.tituloPorOla } : {}),
    enunciado: p.enunciado,
    ...(p.enunciadoPorOla ? { enunciadoPorOla: p.enunciadoPorOla } : {}),
    tipo: p.tipo,
    olas,
    ...(categorias ? { categorias } : {}),
    orden: p.orden ?? 'fijo',
    ...(p.alFinal ? { alFinal: p.alFinal } : {}),
    ...(p.noResponde ? { noResponde: p.noResponde } : {}),
    serie: p.serie
      ? {
          olas: p.serie.olas,
          variable: p.serie.variable ?? variable,
          ...(p.serie.categorias ? { categorias: p.serie.categorias.map(([codigo, etiqueta, olasCat]) => ({ codigo, etiqueta, ...(olasCat ? { olas: olasCat } : {}) })) } : {}),
          ...(p.serie.recodificar ? { recodificar: p.serie.recodificar } : {}),
          ...(p.serie.filtro ? { filtro: p.serie.filtro } : {}),
          ...(p.serie.nota ? { nota: p.serie.nota } : {}),
        }
      : null,
    ...(p.sinSerie ? { sinSerie: p.sinSerie } : {}),
    ...(p.sinCortes ? { sinCortes: p.sinCortes } : {}),
    ...(p.poblacion ? { poblacion: p.poblacion } : {}),
    ...(p.poblacionPorOla ? { poblacionPorOla: p.poblacionPorOla } : {}),
    ...(p.nota ? { nota: p.nota } : {}),
    ...(p.advertencia ? { advertencia: p.advertencia } : {}),
    ...(p.abierta ? { abierta: p.abierta } : {}),
  }
}
