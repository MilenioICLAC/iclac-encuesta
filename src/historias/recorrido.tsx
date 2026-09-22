import { useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import { filtrar, media, proporcion } from '../nucleo/agregar'
import { TERMOMETRO, variableDe } from '../nucleo/modulos'
import Puntos from '../componentes/Puntos'
import CapaRecorrido, { Cierre, Escena, Portada, Respiro } from '../componentes/CapaRecorrido'
import Divergente from '../componentes/Divergente'
import BarrasPosicionamiento from '../componentes/BarrasPosicionamiento'
import Regresion from '../componentes/Regresion'
import { figuraBalanza, figuraConfianza } from '../nucleo/confianza'
import { figuraTermometro } from '../nucleo/termometro'
import { escalaRedonda } from '../nucleo/escala'
import { NEUTRO, SEMANTICOS, pasosDeOrden } from '../nucleo/paleta'
import { decimal, numero, porcentaje } from '../locale'
import { AnioDelPaso, LeyendaDeOleadas } from './comun'
import { cardinal, describir, filasDePalabras, lector, serieDeMedida } from './lectura'

/**
 * Las historias de los bloques uno y dos de la guía de ICLAC, que antes eran un solo recorrido de
 * cinco escenas: «La mirada» (termómetro e ideología) y «Entre dos potencias» (confianza, balanza
 * y alineamiento). **Comparten todos sus cálculos**, así que siguen siendo una sola función con una
 * `parte`: partirlas en dos copias de trescientas líneas de cifras garantizaba que divergieran.
 */
const PORTADA = {
  mirada: '¿Qué opina la gente sobre China?',
  potencias: '¿Con quién se queda Chile?',
} as const

/**
 * El recorrido, con los tres hallazgos que la guía propone para ordenar la narrativa.
 *
 * **Los textos son datos, no código.** Hoy están acá porque es un borrador, pero cada tramo
 * tiene que salir de un archivo de contenido con sus tres idiomas: así, que ICLAC entregue
 * tarde deja de bloquear el desarrollo.
 *
 * Y las cifras se calculan, no se transcriben. Es la diferencia entre una frase que envejece
 * mal y una que se corrige sola al incorporar una oleada.
 */
/**
 * Qué puntos enciende cada paso del primer tramo.
 *
 * Va como tabla y no repartido por el texto porque es la parte que hay que poder auditar de un
 * vistazo: es lo único que decide qué dato se muestra y qué dato se calla. **El último paso
 * enciende todo**, que es la garantía de que el recorrido no termina escondiendo nada, y el
 * estado sin JavaScript o con `prefers-reduced-motion` (ver `nucleo/pasos.ts`).
 */
function encendidos (olas: number[]) {
  const ultima = olas.at(-1)
  const dosPotencias = (pais: string) => pais === 'China' || pais === 'Estados Unidos'
  return [
    // Las dos potencias, sin la última oleada todavía: el paso habla de 2023 y 2024.
    (pais: string, ola: number) => dosPotencias(pais) && ola !== ultima,
    (pais: string) => dosPotencias(pais),
    (pais: string) => dosPotencias(pais) || pais === 'Japón',
    () => true,
    // Los cinco pasos del experimento cambian la figura entera, no los países: la tabla los deja
    // encendidos para que el estado sin JavaScript y el de movimiento reducido sigan mostrando
    // todo el termómetro.
    () => true,
    () => true,
    () => true,
    () => true,
    () => true,
  ]
}

function Recorrido ({ encuesta, abierta, parte }: { encuesta: Encuesta, abierta: boolean, parte: 'mirada' | 'potencias' }) {
  const todos = (ola: number) => filtrar(encuesta, { olas: [ola] })

  // Una fila por país y un punto por oleada, ordenadas por la última oleada. Con tres
  // encuestas sueltas una línea prometería interpolación que no existe, y cinco líneas que se
  // cruzan obligarían a distinguir todos los pares de color contra todos, que es el caso donde
  // la paleta topa en tres (un registro de decisiones interno). Acá el color son las tres oleadas y el nombre del país
  // carga la identidad, así que el tope alcanza justo.
  const termometro = TERMOMETRO.map((p) => ({
    ...p,
    valores: encuesta.olas.map((ola) => media(todos(ola), p.nombre)),
  }))
  // La escala, el orden de las filas y el rótulo del eje salen de `termometro.ts`: si otra vista
  // muestra esta pregunta, pasa por el mismo código y no puede verse distinto.
  const figura = figuraTermometro(termometro.map((t) => ({
    clave: t.pais,
    etiqueta: t.pais,
    valores: t.valores.map((v) => (v.base > 0 ? v.media : null)),
  })))
  const basesPorPais = new Map(termometro.map((t) => [t.pais, t.valores]))


  const chinaT = termometro[0].valores
  const eeuuT = termometro[1].valores
  // El mayor movimiento de cualquier país entre las dos primeras oleadas. Se calcula en vez de
  // escribirse porque la frase que lo usa deja de ser cierta el día que entre una oleada nueva.
  const quietas = Math.max(...termometro.map((t) => Math.abs((t.valores[1]?.media ?? 0) - (t.valores[0]?.media ?? 0))))
  // El singular se decide sobre el número que se **muestra**, no sobre el crudo. Con el crudo, el
  // mayor movimiento (0,973) se escribe «1,0» y se leía «más de 1,0 puntos».
  const quietasRedondo = Math.round(quietas * 10) / 10
  // El mejor evaluado sale de los datos, no del texto: hoy es Japón, y la frase que lo nombra se
  // corrige sola si deja de serlo. `siempreMejor` es lo que habilita decir «sigue», que es una
  // afirmación sobre las tres oleadas y no sobre la última.
  // La primera fila de la figura ya viene ordenada por la última oleada, que es justo lo que la
  // frase quiere decir: quién encabeza hoy.
  const mejor = termometro.find((t) => t.pais === figura.filas[0]?.clave) ?? termometro[0]
  const siempreMejor = encuesta.olas.every((_, i) =>
    termometro.every((t) => (t.valores[i]?.media ?? 0) <= (mejor.valores[i]?.media ?? 0)))
  // El titular afirma quién quedó por encima en la última oleada, así que se arma con el dato y
  // no se escribe: el día que entre una oleada que dé vuelta la serie, el título se da vuelta con
  // ella en vez de quedar publicado diciendo lo contrario de su propia figura.
  const chinaSobreEeuu = (chinaT.at(-1)?.media ?? 0) > (eeuuT.at(-1)?.media ?? 0)
  const pasosEncendidos = encendidos(encuesta.olas)
  const bases = termometro.flatMap((t) => t.valores.map((v) => v.base)).filter((n) => n > 0)
  const baseMinima = Math.min(...bases)
  const baseMaxima = Math.max(...bases)

  const p24 = variableDe(encuesta, 'p24')
  const p25 = variableDe(encuesta, 'p25')
  const p26 = variableDe(encuesta, 'p26')

  const confianza = p24
    ? encuesta.olas.map((ola) => ({ ola, valor: proporcion(todos(ola), p24, [1]).porcentaje, base: todos(ola).length }))
    : []
  /**
   * Las dos figuras de la escena 2.
   *
   * **La escena no elige un umbral**: muestra las cuatro categorías a los dos lados de un cero
   * común y cierra comparando dentro de la persona. Con «mucha» sola, China pasa a Estados Unidos
   * en 2025; con «mucha o algo», venía arriba desde 2023, y una frase cuyo signo depende de un
   * corte que la figura no declara es el defecto que ya dejó tres cifras de opinión circulando.
   */
  const confianzaFigura = p24 && p25
    ? figuraConfianza([{ grupo: 'China', variable: p24 }, { grupo: 'Estados Unidos', variable: p25 }], encuesta.olas, todos)
    : null
  const balanza = p24 && p25 ? figuraBalanza(encuesta.olas, todos) : null
  /**
   * `p26` para la escena 5, armado desde el libro de códigos del artefacto.
   *
   * **Ningún código ni etiqueta se escribe acá.** Las categorías salen de la variable, el color de
   * cada una sale de `SEMANTICOS` por su etiqueta, y el denominador es el de `proporcion`: las
   * personas que contestaron, que en `p26` son todas las de la oleada porque no tiene faltantes.
   * Una oleada nueva que agregue o renombre una categoría entra sola.
   */
  const catP26 = p26?.categorias ?? []
  const cuota = (codigo: number, ola: number) =>
    (p26 ? proporcion(todos(ola), p26, [codigo]) : { porcentaje: 0, base: 0 })
  const serieDe = (codigo: number) => encuesta.olas.map((ola) => {
    const { porcentaje: valor, base } = cuota(codigo, ola)
    return { ola, valor, base }
  })
  const proChina = catP26.some((c) => c.codigo === 1) ? serieDe(1) : []
  const proEeuu = catP26.some((c) => c.codigo === 2) ? serieDe(2) : []
  /**
   * El reparto completo, en orden visual: las dos que se cruzan a los extremos y las que no
   * eligen bando al medio. Es el orden que hace legible la franja, porque deja juntas a las dos
   * que la escena compara.
   */
  const repartoP26 = [2, 3, 4, 1]
    .map((codigo) => catP26.find((c) => c.codigo === codigo))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      clave: String(c.codigo),
      etiqueta: c.etiqueta,
      color: SEMANTICOS[c.etiqueta] ?? NEUTRO,
      valores: encuesta.olas.map((ola) => cuota(c.codigo, ola).porcentaje),
    }))
  const navegar = useNavigate()

  // Lo que dicen las pruebas del ETL sobre las tres oleadas. Las frases de la escena 1 se arman
  // con esto y no con la diferencia cruda.
  const contraste = lector(encuesta)
  const primeraOla = encuesta.olas.at(0) ?? 0
  const penultimaOla = encuesta.olas.at(-2) ?? 0
  const ultimaOla = encuesta.olas.at(-1) ?? 0
  const brechaPrimera = describir(contraste.brecha(primeraOla))
  const brechaPenultima = describir(contraste.brecha(penultimaOla))
  const quietasEntreOlas = contraste.todosQuietos(primeraOla, penultimaOla)
  // Estados Unidos en la escena 2, con «mucha o algo»: sube en la oleada del medio, baja en la
  // última, y en la serie completa queda pareja. Las tres cosas salen de la prueba y
  // no de mirar la figura.
  const vuelveEeuu = contraste.entre('confia-eeuu', penultimaOla, ultimaOla)
  const serieEeuu = contraste.entre('confia-eeuu', primeraOla, ultimaOla)
  // La caída del empate es lo que sostiene el titular de la escena 4: la ventaja de China sale de
  // ahí y no de Estados Unidos, cuya baja no pasa el contraste.
  /**
   * Las dos caídas del **último tramo**, que es del que habla la escena 4.
   *
   * **Antes se leía la serie completa y la frase decía «Estados Unidos no se mueve».** Eso es
   * cierto de 2023→2025 (−3,2, p = 0,10) y **falso** de 2024→2025 (−6,1, p = 0,002), que es el
   * tramo que la figura está mostrando. Las dos cifras salen del contraste del tramo, así que una
   * oleada nueva las mueve sola.
   */
  const caeElEmpate = contraste.entre('empate-confianza', penultimaOla, ultimaOla)
  const caeEeuu = contraste.entre('mas-confianza-eeuu', penultimaOla, ultimaOla)

  // **Los cinco pasos del experimento**, que son la segunda mitad de la escena 1.
  //
  // Reemplazaron a dos pasos que comparaban izquierda, centro y derecha como tres filas. Decían lo
  // mismo con menos: que el eje político no ordena la opinión sobre China. El experimento además
  // muestra **por qué** el monitor publicado encuentra un gradiente donde no lo hay, y eso solo se
  // puede contar mostrándolo. El hallazgo que se perdió (las dos puntas suben) sigue publicado en
  // «Sobre los datos».
  /**
   * **El vuelco de `p26`, comprobado antes de titularlo.** Tres condiciones: las dos primeras
   * oleadas favorecen a Estados Unidos, la última a China, y las tres pasan el contraste. Sin las
   * tres, el titular cae a uno descriptivo en vez de afirmar algo que la figura no sostiene.
   */
  const ventajasP26 = encuesta.olas.map((ola) => contraste.ventajaP26(ola))
  const vuelcoP26 = ventajasP26.length > 1 && ventajasP26.every((v) => v !== null && v.p < 0.05) &&
    ventajasP26.slice(0, -1).every((v) => (v?.diferencia ?? 0) < 0) &&
    (ventajasP26.at(-1)?.diferencia ?? 0) > 0

  // «Por primera vez» es una afirmación sobre toda la serie, así que se comprueba sobre toda la
  // serie: China arriba y por encima del ruido en la última oleada, y en ninguna anterior.
  const arriba = (ola: number) => {
    const b = contraste.brecha(ola)
    return b !== null && b.diferencia > 0 && b.p < 0.05
  }
  const primeraVezArriba = arriba(ultimaOla) && encuesta.olas.slice(0, -1).every((ola) => !arriba(ola))

  // Las pruebas de «Entre dos potencias» que los titulares y las notas afirman.
  const subeChina = contraste.entre('confia-china', primeraOla, ultimaOla)
  const eeuuSerieBalanza = contraste.entre('mas-confianza-eeuu', primeraOla, ultimaOla)
  const noAlineamiento = contraste.entre('no-alineamiento', primeraOla, ultimaOla)
  const bajaNoAlineamiento = Boolean(noAlineamiento && noAlineamiento.p < 0.05 && noAlineamiento.diferencia < 0)

  // Los titulares que el cierre repite, escritos una sola vez: si una oleada nueva cambia uno,
  // cambia en su escena y en el cierre a la vez.
  // El titular de Codex (21-09-2026), condicionado: el cruce solo si es la primera vez que China
  // pasa el contraste, y Japón solo si encabeza las tres oleadas.
  const titularTermometro = primeraVezArriba
    ? `En ${ultimaOla} China pasa a Estados Unidos${siempreMejor && mejor.pais === 'Japón' ? ', pero Japón sigue liderando' : ''}`
    : `En ${ultimaOla} las personas evalúan mejor a ${chinaSobreEeuu ? 'China que a Estados Unidos' : 'Estados Unidos que a China'}.`
  const titularConfianza = subeChina && subeChina.p < 0.05 && subeChina.diferencia > 0
    ? `La confianza en China despega; la de Estados Unidos va y vuelve`
    : 'Cuánto se confía en China y en Estados Unidos'
  const titularP26 = vuelcoP26
    ? `En ${ultimaOla}, alinearse con China supera a alinearse con Estados Unidos`
    : 'Con qué potencia debería alinearse Chile'

  const regresion = contraste.regresion
  const primeraDeLaSerie = regresion?.porOla.find((o) => o.ola === primeraOla) ?? null
  // La escala vertical es una sola para los cinco pasos y para las tres oleadas: si dependiera de
  // lo que cada paso muestra, el mismo promedio cambiaría de lugar al avanzar el relato.
  const valoresRegresion = (regresion?.porOla ?? []).flatMap((o) => [
    ...o.puntos.map((q) => q.media).filter((v): v is number => v !== null),
    ...o.puntos.flatMap((q) => q.ic ?? []),
  ])
  const escalaRegresion = valoresRegresion.length > 0
    ? escalaRedonda(valoresRegresion, 4)
    : { min: 0, max: 100 }
  // El experimento solo se cuenta si el punto que sostiene la recta **la da vuelta**: con la
  // pendiente y su versión sin ese punto del mismo lado del cero, no hay nada que mostrar.
  const sostiene = primeraDeLaSerie?.sostiene ?? null
  // Lo que se escribe ante el nombre de cada país (respuesta abierta, contada por persona en el
  // ETL). La familia de palabras contrastadas son cuatro, con Holm: acá se usan dos.
  const nubeChina = encuesta.nubes.find((n) => n.id === 'p4_1')
  const nubeEeuu = encuesta.nubes.find((n) => n.id === 'p4_2')
  const palabras = ['palabra-trump', 'palabra-tecnologia', 'palabra-mall', 'palabra-buena'].map((id) => serieDeMedida(encuesta, id))
  const [trump, tecnologia] = palabras
  const holmPalabras = (() => {
    const ps = palabras.map((x) => x?.punta?.p ?? 1)
    const orden = ps.map((p, i) => [p, i] as const).sort((a, b) => a[0] - b[0])
    const out = new Array<number>(ps.length)
    let previo = 0
    orden.forEach(([p, i], k) => { previo = Math.max(previo, Math.min(1, p * (ps.length - k))); out[i] = previo })
    return out
  })()
  const saltoTrump = trump?.consecutivas.at(-1)
  const trumpSube = Boolean(trump && holmPalabras[0] < 0.05 && saltoTrump && saltoTrump.ic[0] > 0)
  const tecnologiaFirme = Boolean(tecnologia && holmPalabras[1] < 0.05 && (tecnologia.punta?.diferencia ?? 0) > 0)
  const ultimoTrump = trump?.puntos.at(-1)?.valor ?? 0
  const titularPalabras = trumpSube && ultimoTrump >= 10
    ? `En ${trump!.puntos.at(-1)!.ola}, más de uno de cada diez escribe «Trump» cuando le nombran Estados Unidos`
    : 'Lo primero que se le viene a la cabeza con cada país'
  const filasChina = nubeChina ? filasDePalabras(nubeChina, { tope: 5, fuera: ['china'] }) : []
  const filasEeuu = nubeEeuu ? filasDePalabras(nubeEeuu, { tope: 5, fuera: ['estados', 'unidos'] }) : []
  const topePalabras = Math.ceil(Math.max(5, ...[...filasChina, ...filasEeuu].flatMap((f) => f.valores.map((v) => v ?? 0))) / 5) * 5
  const seriesPalabras = encuesta.olas.map((ola, i) => ({ clave: String(ola), etiqueta: String(ola), color: pasosDeOrden(encuesta.olas.length)[i] }))

  const conExperimento = Boolean(
    regresion && primeraDeLaSerie && sostiene &&
    primeraDeLaSerie.recta.p < 0.05 && sostiene.recta.p >= 0.05,
  )
  const puntoMasPoblado = primeraDeLaSerie
    ? primeraDeLaSerie.puntos.reduce((mejor, q) => (q.n > mejor.n ? q : mejor), primeraDeLaSerie.puntos[0])
    : null
  const totalPrimera = primeraDeLaSerie ? primeraDeLaSerie.puntos.reduce((s, q) => s + q.n, 0) : 0

  // El puente entre las dos mitades de la escena: el alza no viene de un sector. Se nombran los
  // cortes donde **todos** los grupos se mueven en la misma dirección; el que tiene una excepción
  // se calla, porque la frase no tiene figura que la respalde y no puede redondear a su favor.
  const cortesEnteros = (contraste.transversal?.cortes ?? []).filter((c) => c.suben === c.total && c.total >= 3)
  const conPuente = cortesEnteros.length >= 2

  // Las oleadas son una secuencia, no tres categorías sueltas: van en un tono de claro a oscuro,
  // que es la paleta de orden del proyecto. Con tres colores distintos hay que aprenderse cuál es
  // cuál; con la rampa, más oscuro es más nuevo y no hay nada que memorizar.
  const tonos = pasosDeOrden(encuesta.olas.length)
  const serieTermometro = encuesta.olas.map((ola, i) => ({
    clave: String(ola),
    etiqueta: String(ola),
    color: tonos[i],
  }))

  return (
    <>
      <CapaRecorrido
        abierta={abierta}
        alCerrar={() => { navegar('/') }}
        salida="Volver a las historias"
        metodo={`metodo-${parte === 'mirada' ? 'mirada' : 'entre-potencias'}`}
        titulo={parte === 'mirada' ? 'La mirada' : 'Entre dos potencias'}
      >
        {(raiz) => (
          <>
            {/* La tapa: el logo y la pregunta, nada más. Lo que dura la historia y la salida ya
                los dice la barra. La invitación a avanzar la pone `Portada`. */}
            <Portada raiz={raiz} titulo={PORTADA[parte]}>
              <img
                src={`${import.meta.env.BASE_URL}icons/iclac.webp`}
                alt="ICLAC"
                className="logo-portada h-12 w-auto object-contain"
              />
              <h2 className="pregunta-portada my-auto max-w-[22ch] text-balance font-display text-[34px] font-semibold leading-[1.12] text-gray-900">
                {PORTADA[parte]}
              </h2>
            </Portada>

            {parte === 'mirada' && (
              <>
            <Escena
              indice={1}
              raiz={raiz}
              // La figura es una sola, así que en escritorio va el relato a un lado y la figura al
              // otro. Las escenas con dos o tres paneles en paralelo no pueden.
              dosColumnas
              // Un solo nivel de encabezado, con el hallazgo, como quedó en el laboratorio el
              // 07-09-2026. Lo que se está mirando bajó al pie de la figura, junto con las bases:
              // ahí se consulta cuando ya se vieron los puntos, y no compite con el titular.
              // «Las personas» y no «los chilenos»: la muestra no es probabilística y no habla
              // por el país.
              titulo={titularTermometro}
              cabecera={(activo) => (
                <AnioDelPaso
                  olas={encuesta.olas}
                  tonos={tonos}
                  // Hasta qué oleada llegó el relato: es la más nueva que el paso enciende.
                  hasta={Math.max(0, ...encuesta.olas.map((ola, i) => (
                    termometro.some((t) => pasosEncendidos[activo]?.(t.pais, ola)) ? i : 0
                  )))}
                />
              )}
              // **Las frases salen de las pruebas, no de restar dos promedios.** La brecha entre
              // los dos países se calcula dentro de cada persona, que es quien pone las dos notas:
              // así, «una oleada usó la escala más generosa» deja de ser una explicación posible.
              // Y donde el intervalo cruza el cero se dice «parejos», no se elige un ganador.
              frases={[
                <>
                  {brechaPrimera?.estado === 'parejos'
                    ? <>En {primeraOla} los dos estaban <strong>parejos</strong></>
                    : <>En {primeraOla} <strong>{brechaPrimera?.estado === 'china' ? 'China' : 'Estados Unidos'} estaba arriba</strong></>}
                  {brechaPenultima && (brechaPenultima.estado === 'parejos'
                    ? <>, y en {penultimaOla} seguían parejos.</>
                    : <>, y en {penultimaOla} <strong>{brechaPenultima.estado === 'china' ? 'China' : 'Estados Unidos'}</strong> quedó
                      arriba por {decimal(brechaPenultima.puntos)} puntos.</>)}
                </>,
                <>
                  {/* **La frase dice lo que la figura muestra.** Antes daba la brecha pareada
                      (6,5 puntos dentro de la misma persona), que es el estadístico más fuerte y
                      no tiene dónde verse en el gráfico: el lector leía un número que no está en
                      ningún punto. La brecha sigue sosteniendo la afirmación, y vive en el pie y
                      en «Sobre los datos», que es donde se va a buscar el método. */}
                  <strong>En {ultimaOla} China queda arriba{primeraVezArriba && ' por primera vez'}</strong>:
                  {' '}sube a {decimal(chinaT.at(-1)?.media ?? 0)} y Estados Unidos baja a{' '}
                  {decimal(eeuuT.at(-1)?.media ?? 0)}.
                </>,
                <>
                  <strong>{mejor.pais} {siempreMejor ? 'encabeza las tres oleadas' : `encabeza ${encuesta.olas.at(-1)}`}</strong>,
                  con {decimal(mejor.valores.at(-1)!.media)} en {encuesta.olas.at(-1)}:{' '}
                  {decimal((mejor.valores.at(-1)?.media ?? 0) - (chinaT.at(-1)?.media ?? 0))} puntos
                  sobre China.
                </>,
                <>
                  {/* Antes decía «ningún país se movió más de 1,0 puntos». El número era cierto y
                      no se podía calibrar: en una escala de 0 a 100 con desviación de 28, nadie
                      sabe si 1,0 es mucho. Con los contrastes se puede afirmar algo más fuerte y
                      sin número arbitrario. El hecho, en cambio, es el que sostiene el titular:
                      sin él no se distingue un quiebre de una tendencia que ya venía. */}
                  <strong>Todo el cambio de la serie ocurre en {ultimaOla}</strong>: entre{' '}
                  {primeraOla} y {penultimaOla}{' '}
                  {quietasEntreOlas
                    ? <>ninguno de los {cardinal(contraste.paises)} países se mueve</>
                    : <>ningún país se movió más de {decimal(quietas)} {quietasRedondo === 1 ? 'punto' : 'puntos'}</>}.
                </>,
              ]}
              figura={(activo) => (
                <Puntos
                  series={serieTermometro}
                  filas={figura.filas}
                  escala={figura.escala}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => {
                    const i = encuesta.olas.indexOf(Number(serie.clave))
                    const v = basesPorPais.get(fila.clave)?.[i]
                    return `${fila.etiqueta} · ${serie.etiqueta}: ${decimal(valor)} sobre 100 (n = ${numero(v?.base ?? 0)})`
                  }}
                  marcas={figura.marcas}
                  anchoEtiqueta="6.5rem"
                  compacto
                  altoFila={40}
                  radioCreciente
                  leyenda={false}
                  // Corto a propósito: en 360 px, la versión larga se partía en tres líneas y se
                  // pegaba a las marcas del eje.
                  unidadEje={figura.unidadEje}
                  rotular={encuesta.olas.length - 1}
                  visible={(pais, ola) => pasosEncendidos[activo]?.(pais, Number(ola)) ?? true}
                />
              )}
              nota={(
                // La leyenda va acá, en la esquina de abajo a la derecha del gráfico: el lector la
                // busca cuando ya vio los puntos, no antes.
                // El pie mide **lo mismo que la figura**, y por eso va en columna y no al lado de
                // la leyenda: compartiendo fila, el texto se encogía a 140 px bajo un gráfico de
                // 328 y la escena crecía 49 px de puro salto de línea.
                <div className="flex flex-col gap-1">
                  <p className="text-xs leading-snug text-gray-500">
                    {/* **Corto porque el alto está contado.** En un iPhone 12 la escena tiene 621 px
                        útiles y con el pie largo medía 697: el enlace al tablero quedaba bajo el
                        borde. Lo que se fue es la explicación de «parejos» con su intervalo, que es
                        material de método y vive completo en «Cómo se hizo el recorrido», a un
                        toque desde la barra. */}
                    Un punto por oleada, promedio de quienes contestaron. Bases de{' '}
                    {numero(baseMinima)} a {numero(baseMaxima)} según país y oleada. «Parejos» y
                    «arriba» comparan las dos notas dentro de cada persona.
                  </p>
                  <LeyendaDeOleadas olas={encuesta.olas} tonos={tonos} />
                </div>
              )}
            />

            {/* **El puente entre las dos historias, ahora como pausa y no como paso.**
                Era el quinto paso de la escena del termómetro, y la barra lo anunciaba como «paso 5
                de 9»: el lector no estaba en una pausa, estaba a mitad de una escena, y al entrar
                el bloque de texto brincaba 187 px porque la figura desaparecía. Como respiro tiene
                su propia pantalla, la barra dice «Pausa» y no hay figura que se vaya. */}
            {conExperimento && (
              <Respiro
                raiz={raiz}
                indice={-2}
                titulo="El alza no se concentra en un solo grupo. ¿Y en el eje político?"
              >
                {conPuente
                  ? <>El alza aparece en {cardinal(cortesEnteros[0].total)} {cortesEnteros[0].etiqueta} y
                    en {cardinal(cortesEnteros[1].total)} {cortesEnteros[1].etiqueta}. <strong>¿Y en el eje
                    político?</strong></>
                  : <>El alza no se concentra en un solo grupo. <strong>¿Y en el eje político?</strong></>}
              </Respiro>
            )}

            {/* **El experimento es una escena propia.**
                Contar el método es contar un hallazgo cuando el método *es* el hallazgo: se muestra
                la recta que publica el monitor, se marca el punto de treinta personas que la
                sostiene, se retira y la recta se endereza. Las cifras salen del ETL: si una oleada
                nueva cambia cuál punto sostiene la recta, las frases se corrigen solas, y si el
                punto deja de darla vuelta, la escena entera desaparece. */}
            {conExperimento && regresion && (
              <Escena
                indice={2}
                raiz={raiz}
                dosColumnas
                titulo="La posición política no ordena la opinión sobre China"
                cabecera={(activo) => (
                  <AnioDelPaso
                    olas={encuesta.olas}
                    tonos={tonos}
                    // El experimento trabaja sobre la primera oleada, y su último paso muestra las
                    // tres: el año grande dice lo mismo que la figura.
                    hasta={activo >= 3 ? encuesta.olas.length - 1 : 0}
                  />
                )}
                frases={[
                  <>
                    El monitor traza una recta y encuentra inclinación:{' '}
                    <strong>{decimal(Math.abs(primeraDeLaSerie?.recta.b ?? 0))} puntos menos por cada paso
                    hacia la derecha</strong>.
                  </>,
                  // **El intervalo tiene que decir de qué es.** Antes decía «cuyo promedio podría
                  // estar entre 31 y 55» sin nombrar qué promedio, y la frase siguiente repetía la
                  // cifra de personas que esta acababa de dar.
                  <>
                    Toda esa inclinación la sostiene <strong>un solo punto</strong>: las{' '}
                    {numero(sostiene?.n ?? 0)} personas del {sostiene?.x}, que evalúan a China entre{' '}
                    {decimal(primeraDeLaSerie?.puntos.find((q) => q.x === sostiene?.x)?.ic?.[0] ?? 0, 0)} y{' '}
                    {decimal(primeraDeLaSerie?.puntos.find((q) => q.x === sostiene?.x)?.ic?.[1] ?? 0, 0)}.
                  </>,
                  <>
                    <strong>Sin ellas la recta se endereza</strong>: {decimal(sostiene?.recta.b ?? 0)}{' '}
                    puntos, y la horizontal entra en el rango.
                  </>,
                  <>
                    Las otras oleadas dicen lo mismo: <strong>la posición política no ordena la
                    opinión sobre China</strong>.
                  </>,
                ]}
                figura={(activo) => (
                  <Regresion
                    datos={regresion}
                    ola={primeraOla}
                    escala={{ ...escalaRegresion, paso: Math.max(5, Math.round((escalaRegresion.max - escalaRegresion.min) / 3)) }}
                    tonos={tonos}
                    olas={encuesta.olas}
                    paso={activo + 1}
                    etiquetaIzquierda="1 · izquierda"
                    etiquetaDerecha="derecha · 10"
                    unidadEje="Evaluación de China de 0 a 100"
                  />
                )}
                nota={(activo, reducido) => (
                  // **El pie dice lo que la figura muestra en este paso.** Fijo, el paso que
                  // retira un punto seguiría declarando la muestra entera. La leyenda de oleadas
                  // aparece solo en el último, que es donde el color pasa a significar un año:
                  // antes hay una sola oleada en la figura y la clave ofrecería dos colores que
                  // no están dibujados.
                  <div className="flex flex-col gap-1">
                    <p className="text-xs leading-snug text-gray-500">
                      {/* Corto a propósito: el eje ya dice qué es 1 y qué es 10, y en un teléfono
                          de 664 px de alto cada línea del pie se la quita a la figura. */}
                      Cada punto es un promedio; su tamaño dice cuánta gente hay.{' '}
                      {activo >= 3 || reducido
                        ? <>Las tres oleadas, con sus muestras completas. La franja de cada recta es el rango de pendientes compatibles con los datos.</>
                        : activo === 2
                          ? <>Oleada {primeraOla} sin quienes se ubican en el {sostiene?.x}: {numero(sostiene?.recta.n ?? 0)} personas. El punto retirado queda hueco, no borrado.</>
                          : activo === 1
                            ? <>Oleada {primeraOla}, {numero(totalPrimera)} personas. La barra vertical es el intervalo del 95 % del promedio de ese punto.</>
                            : <>Oleada {primeraOla}, {numero(totalPrimera)} personas, de las cuales{' '}
                              {porcentaje(100 * (puntoMasPoblado?.n ?? 0) / (totalPrimera || 1), 0)} se ubica
                              en el {puntoMasPoblado?.x}. La recta es una regresión lineal simple de la
                              evaluación sobre la escala de ideología.</>}
                    </p>
                    {/* La leyenda del último paso lleva la pendiente de cada oleada: en la figura,
                        dos de las tres rectas terminan a menos de un punto y sus rótulos se pisan.
                        Acá el color ata cada cifra a su recta y no hay nada que se superponga. */}
                    {(activo >= 3 || reducido) && (
                      <ul className="ml-auto flex flex-wrap items-center justify-end gap-x-3.5 gap-y-1">
                        {encuesta.olas.map((ola, i) => {
                          const r = regresion?.porOla.find((o) => o.ola === ola)?.recta
                          const nula = r ? r.ic[0] <= 0 && r.ic[1] >= 0 : true
                          return (
                            <li key={ola} className="flex items-center gap-1.5 text-[11px] tabular-nums text-gray-500">
                              <span
                                className="inline-block h-0.5 w-4 shrink-0 rounded-full"
                                style={{ backgroundColor: tonos[i] }}
                              />
                              {ola}
                              {r && <> {r.b > 0 ? '+' : ''}{decimal(r.b, 2)}{nula && ' ns'}</>}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              />
            )}

            {/* **Las palabras, al final de «La mirada»** (decisión de Felipe, 22-09-2026: las respuestas
                abiertas van repartidas en las historias). Cambia de filas sin cambiar de eje: China
                en el primer paso, Estados Unidos en el segundo; con movimiento reducido van las dos. */}
            {nubeChina && nubeEeuu && trump && (
              <>
            <Respiro raiz={raiz} indice={-3} titulo="¿Y qué se les viene a la cabeza?">
              ¿Y qué es lo <strong>primero</strong> que se les viene a la cabeza?
            </Respiro>

            <Escena
              indice={conExperimento && regresion ? 3 : 2}
              raiz={raiz}
              dosColumnas
              titulo={titularPalabras}
              frases={[
                <>
                  Con China, en {encuesta.olas.at(-1)}, se escribe sobre todo {filasChina.slice(0, 3).map((f) => `«${f.etiqueta}»`).join(', ').replace(/, ([^,]*)$/, ' y $1')}.
                  {tecnologia && !tecnologiaFirme && <> «Tecnología» pasa de {porcentaje(tecnologia.puntos[0].valor, 1)} a {porcentaje(tecnologia.puntos.at(-1)!.valor, 1)}, un alza que no alcanza a afirmarse.</>}
                </>,
                trumpSube && saltoTrump
                  ? <>Con Estados Unidos, en {saltoTrump.desde} «Trump» lo escribía el {porcentaje(saltoTrump.a, 1)}. En {saltoTrump.hasta}, el <strong>{porcentaje(saltoTrump.b, 1)}</strong>.</>
                  : <>Con Estados Unidos: {filasEeuu.slice(0, 3).map((f) => `«${f.etiqueta}»`).join(', ').replace(/, ([^,]*)$/, ' y $1')}.</>,
              ]}
              figura={(activo, reducido) => {
                const bloque = (titulo: string, filas: typeof filasChina, clave: string) => (
                  <div key={clave} className="flex flex-col gap-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{titulo}</p>
                    <Puntos
                      series={seriesPalabras}
                      filas={filas}
                      escala={{ min: 0, max: topePalabras }}
                      formato={(v) => decimal(v, 1)}
                      formatoEje={(v) => decimal(v, 0)}
                      titulo={(fila, serie, valor) => `${titulo} · «${fila.etiqueta}» · ${serie.etiqueta}: ${porcentaje(valor, 1)}`}
                      marcas={topePalabras / 5 + 1}
                      anchoEtiqueta="6rem"
                      compacto
                      altoFila={28}
                      radioCreciente
                      leyenda={false}
                      unidadEje="% que la escribe"
                      rotular={seriesPalabras.length - 1}
                    />
                  </div>
                )
                return (
                  <div className="flex flex-col gap-3">
                    <p className="sr-only">{`Lo primero que se le viene a la cabeza, en porcentaje de quienes contestaron, por oleada. China: ${filasChina.map((f) => `${f.etiqueta} ${f.valores.map((v) => (v === null ? 'sin dato' : porcentaje(v, 1))).join(', ')}`).join('; ')}. Estados Unidos: ${filasEeuu.map((f) => `${f.etiqueta} ${f.valores.map((v) => (v === null ? 'sin dato' : porcentaje(v, 1))).join(', ')}`).join('; ')}.`}</p>
                    {(reducido || activo === 0) && bloque('China', filasChina, 'china')}
                    {(reducido || activo >= 1) && bloque('Estados Unidos', filasEeuu, 'eeuu')}
                    <LeyendaDeOleadas olas={encuesta.olas} tonos={tonos} />
                  </div>
                )
              }}
              nota={(
                <p className="text-xs leading-snug text-gray-500">
                  Una palabra por persona, sin opciones. Sobre {encuesta.olas.map((o) => numero(nubeEeuu.baseOla?.[String(o)] ?? 0)).join(', ')} personas.
                  «Trump» y «tecnología» se eligieron después de ver las cifras: pruebas exploratorias.
                </p>
              )}
            />
              </>
            )}
              </>
            )}

            {/* El respiro que unía la evaluación con la confianza se fue con la partición: cada mitad es
                ahora su propia historia y abre con su portada. */}
            {parte === 'potencias' && (
              <>
            <Escena
              indice={1}
              raiz={raiz}
              // Una sola figura por paso, así que en escritorio va el relato a un lado y la figura
              // al otro, igual que la escena 1.
              dosColumnas
              titulo={titularConfianza}
              frases={[
                // **Un extremo, no los dos.** Antes esta frase pedía cuatro cifras y dos cortes
                // distintos en una sola oración, sobre una figura que ya tiene seis filas y cuatro
                // categorías. El movimiento de «poca o ninguna» se ve en la figura sin narrarlo.
                <>
                  En China <strong>se corre el reparto entero</strong>: «mucha» se duplica, de{' '}
                  {porcentaje(confianza.at(0)?.valor ?? 0, 1)} a{' '}
                  {porcentaje(confianza.at(-1)?.valor ?? 0, 1)}.
                </>,
                // **La frase anterior decía «no es que Estados Unidos pierda confianza».** Con la
                // escala entera a la vista eso es falso en el último tramo: con «mucha o algo»
                // pierde por encima del ruido. Lo que sí se sostiene, y es lo que dice ahora, es
                // que en la serie completa vuelve a donde estaba.
                <>
                  {/* **La frase nombra su corte.** El titular dice que Estados Unidos va y vuelve,
                      que solo es cierto sumando «mucha» y «algo»: con «mucha» sola sube y se queda
                      (13,3 → 17,1, p = 0,029). La frase anterior habla de «mucha», así que sin
                      nombrarlo acá el lector cree que sigue leyendo la misma vara. */}
                  Sumando <strong>«mucha» y «algo»</strong>, Estados Unidos sube en {encuesta.olas[1]} y{' '}
                  <strong>vuelve</strong> en {ultimaOla}
                  {vuelveEeuu && vuelveEeuu.p < 0.05 && <> ({decimal(vuelveEeuu.diferencia)} puntos)</>}:{' '}
                  {serieEeuu && serieEeuu.p >= 0.05
                    ? <>entre {primeraOla} y {ultimaOla}, la diferencia es demasiado chica para afirmarla</>
                    : <>en la serie completa suma {decimal(serieEeuu?.diferencia ?? 0)} puntos</>}.
                </>,
              ]}
              figura={(activo, reducido) => (confianzaFigura && (
                <Divergente
                  categorias={confianzaFigura.categorias}
                  filas={confianzaFigura.filas}
                  extremo={confianzaFigura.extremo}
                  formato={(v) => decimal(v, 0)}
                  altoFila={26}
                  anchoEtiqueta="2.6rem"
                  // El primer paso habla solo de China. Las filas de Estados Unidos siguen en el
                  // documento con opacidad cero, y la escala ya está calculada sobre las seis, así
                  // que ningún segmento cambia de largo al encenderse.
                  visible={(clave) => reducido || activo >= 1 || clave.startsWith('p24-')}
                  // **Un solo foco, y solo donde la frase señala un segmento.** El paso 1 dice que
                  // «mucha» se duplica en China, así que se marca esa categoría en la última
                  // oleada, que es donde termina la cifra. El paso 2 habla de «mucha» **más**
                  // «algo» a lo largo de la serie: eso no es un segmento, son dos categorías por
                  // tres oleadas, y marcarlas todas llenaría la figura. Ahí no va marca.
                  enfatizar={(fila, categoria) =>
                    activo === 0 && fila.clave === `p24-${ultimaOla}` && categoria.etiqueta === 'Mucha'}
                  unidadEje="Porcentaje de quienes contestaron. El 0 del eje es el borde entre los dos lados, y cada fila suma 100."
                  titulo={(fila, categoria, valor) =>
                    `${fila.grupo ?? ''} ${fila.etiqueta} · ${categoria.etiqueta}: ${decimal(valor, 1)} % (n = ${numero(fila.base)})`}
                />
              ))}
              nota={(
                <p className="text-xs leading-snug text-gray-500">
                  Las cuatro respuestas de la pregunta, sin elegir un umbral: con «mucha» sola, China
                  queda encima de Estados Unidos solo en {ultimaOla}; con «mucha o algo», ya estaba
                  encima en {primeraOla}.
                </p>
              )}
            />

            {/* **La segunda pausa, y por la misma razón que la primera.** Acá el recorrido cambia
                de figura: deja de mirar el reparto de cada potencia y pasa a mirar a cada persona.
                Sin pausa, el cambio ocurría en el mismo paso en que cambiaba la frase, y el bloque
                se recolocaba de golpe (medido: la figura pasaba de 412 px a 291 y el titular bajaba
                60 px). */}
            {balanza && (
              <Respiro
                raiz={raiz}
                indice={-3}
                titulo="Los dos repartos miran al país entero. ¿Y si miramos a cada persona?"
              >
                Los dos repartos miran al país entero. <strong>¿Y si miramos a cada persona?</strong>
              </Respiro>
            )}

            {balanza && (
              <Escena
                indice={2}
                raiz={raiz}
                dosColumnas
                titulo="La ventaja de China crece, y caen tanto el empate como Estados Unidos"
                frases={[
                  <>
                    Cada persona contesta por las dos potencias, así que se puede restar dentro del
                    caso. En {primeraOla} y {penultimaOla} <strong>manda el empate</strong>:{' '}
                    {porcentaje(balanza.filas[0].valores[1], 1)} y{' '}
                    {porcentaje(balanza.filas[1].valores[1], 1)} les tienen la misma confianza a las dos.
                  </>,
                  <>
                    En {ultimaOla} quienes <strong>confían más en China</strong> saltan a{' '}
                    {porcentaje(balanza.filas[balanza.filas.length - 1].valores[2], 1)}. El empate cae{' '}
                    {decimal(Math.abs(caeElEmpate?.diferencia ?? 0))} puntos y Estados Unidos{' '}
                    {decimal(Math.abs(caeEeuu?.diferencia ?? 0))}: los dos pasan el contraste.
                  </>,
                ]}
                figura={(activo, reducido) => (
                  <Divergente
                    categorias={balanza.categorias}
                    filas={balanza.filas}
                    extremo={balanza.extremo}
                    // **El mismo redondeo que la frase.** La frase cita 39,7 % y la barra decía
                    // 40: dos números para el mismo dato en la misma pantalla. Con el decimal
                    // puesto, el número que se lee arriba es el que está en la figura.
                    formato={(v) => decimal(v, 1)}
                    minimoRotulo={14}
                    altoFila={30}
                    anchoEtiqueta="2.6rem"
                    // La última oleada entra en el segundo paso: es donde ocurre el salto, y verlo
                    // aparecer es el cambio visible que ese paso se gana.
                    visible={(clave) => reducido || activo >= 1 || clave !== `balanza-${ultimaOla}`}
                    enfatizar={(fila, cat) => !reducido && activo >= 1 && fila.clave === `balanza-${ultimaOla}` && cat.lado === 1}
                    unidadEje="Cada persona contesta por las dos potencias, así que la comparación va dentro del caso. «La misma» queda a caballo del cero."
                    titulo={(fila, categoria, valor) =>
                      `${fila.etiqueta} · ${categoria.etiqueta}: ${decimal(valor, 1)} % (n = ${numero(fila.base)})`}
                  />
                )}
                nota={(
                  <p className="text-xs leading-snug text-gray-500">
                    Sobre quienes contestaron las dos preguntas: {balanza.filas.map((f) => numero(f.base)).join(', ')} personas.
                    Las tres categorías suman 100, así que lo que gana una es lo que pierden las otras
                    dos: la figura no dice que las mismas personas hayan cambiado de lado. Entre{' '}
                    {primeraOla} y {ultimaOla}, Estados Unidos {eeuuSerieBalanza && eeuuSerieBalanza.p >= 0.05 ? 'queda parejo' : `cambia ${decimal(eeuuSerieBalanza?.diferencia ?? 0)} puntos`}.
                  </p>
                )}
              />
            )}

            {/* **La tercera pausa.** Acá el recorrido cambia de pregunta, no solo de figura: hasta
                la escena 4 mide opiniones (cuánto te gusta un país, cuánto confías en él) y la 5
                pregunta qué debería hacer Chile. Es el salto más grande del relato y no puede
                ocurrir en el mismo gesto en que cambia la frase.

                La primera mitad cierra lo que quedó establecido y la segunda abre lo que viene,
                que es el patrón de los otros tres respiros. **Y cierra por el método, no por el
                resultado**: «confiar más en un país» describe la comparación dentro de la persona
                que acaba de hacer la escena 4, sin repetir ninguna de sus cifras, que es lo que
                evita arrastrar una afirmación de un tramo al otro. */}
            <Respiro
              raiz={raiz}
              indice={-4}
              titulo="Una cosa es confiar más en un país. ¿Con cuál debería alinearse Chile?"
            >
              Una cosa es confiar más en un país. <strong>¿Con cuál debería alinearse Chile?</strong>
            </Respiro>

            {/*
              * **La escena 5, rehecha el 08-09-2026.** Antes afirmaba que el no alineamiento se
              * erosiona «y lo que pierde se va a China», con tres paneles apilados. Salió por tres
              * razones medidas, no por gusto:
              *
              *  - **La aritmética no daba.** El no alineamiento pierde 5,0 puntos y China gana
              *    8,0: no puede venir todo de ahí.
              *  - **Ninguna de las dos categorías del no alineamiento se mueve sola** en ningún
              *    par de oleadas. El hallazgo dependía de sumarlas y de mirar solo las puntas, y
              *    hay una prueba que lo deja escrito (`scripts/contrastes.test.mjs`).
              *  - **No cabía.** Bajo 640 px la grilla de tres columnas colapsa y los paneles se
              *    apilan: 1.088 px de escena contra 857 de pantalla, con el tercer panel y la nota
              *    entera bajo el borde.
              *
              * Lo que quedó es el hallazgo firme de la pregunta: el vuelco. Las tres oleadas pasan
              * el contraste, dos hacia Estados Unidos y la última hacia China, así que la línea
              * base no es una oleada suelta.
              */}
            <Escena
              indice={3}
              raiz={raiz}
              // Una figura sola, así que en escritorio va el relato a un lado y la figura al otro.
              dosColumnas
              // **El titular se comprueba antes de escribirse.** Si una oleada nueva deja el vuelco
              // sin sustento, el título cambia solo en vez de quedar contradiciendo a su figura.
              titulo={titularP26}
              frases={[
                <>
                  En {primeraOla} y {penultimaOla} <strong>ganaba Estados Unidos</strong>:{' '}
                  {porcentaje(proEeuu.at(0)?.valor ?? 0, 1)} y{' '}
                  {porcentaje(proEeuu.at(1)?.valor ?? 0, 1)} contra{' '}
                  {porcentaje(proChina.at(0)?.valor ?? 0, 1)} y{' '}
                  {porcentaje(proChina.at(1)?.valor ?? 0, 1)}. La gran mayoría no elige a ninguno.
                </>,
                <>
                  <strong>En {ultimaOla} se da vuelta:</strong> China llega a{' '}
                  {porcentaje(proChina.at(-1)?.valor ?? 0, 1)} y Estados Unidos baja a{' '}
                  {porcentaje(proEeuu.at(-1)?.valor ?? 0, 1)}.
                  {bajaNoAlineamiento && noAlineamiento && <> Quienes no eligen siguen siendo mayoría, pero bajan {decimal(Math.abs(noAlineamiento.diferencia))} puntos desde {primeraOla}.</>}
                </>,
              ]}
              figura={(activo, reducido) => (
                <BarrasPosicionamiento
                  olas={encuesta.olas}
                  reparto={repartoP26}
                  mostrarUltima={activo >= 1}
                  reducido={reducido}
                />
              )}
              nota={(
                <p className="text-xs leading-snug text-gray-500">
                  Porcentaje de respuestas a cómo debería posicionarse Chile. Bases por oleada:{' '}
                  {proChina.map((p) => numero(p.base)).join(', ')} personas; sin respuestas faltantes.
                </p>
              )}
            />
              </>
            )}

            {/* **El cierre**, decidido en `laboratorio/cierre-recorrido.html` el 15-09-2026: repite
                conclusiones, no escenas. Cada historia cierra con las suyas, y un titular que no se
                sostiene no entra (el de la escena 3 de «Entre dos potencias» solo con el vuelco). */}
            {parte === 'mirada'
              ? (
                <Cierre
                  raiz={raiz}
                  titulo="La mirada"
                  frases={[
                    { escena: 1, texto: titularTermometro },
                    ...(conExperimento ? [{ escena: 2, texto: 'La posición política no ordena la opinión sobre China' }] : []),
                    ...(trumpSube ? [{ escena: conExperimento && regresion ? 3 : 2, texto: titularPalabras }] : []),
                  ]}
                />
                )
              : (
                <Cierre
                  raiz={raiz}
                  titulo="Entre dos potencias"
                  frases={[
                    { escena: 1, texto: titularConfianza },
                    ...(balanza ? [{ escena: 2, texto: 'La ventaja de China crece, y caen tanto el empate como Estados Unidos' }] : []),
                    ...(vuelcoP26 ? [{ escena: 3, texto: titularP26 }] : []),
                  ]}
                />
                )}
          </>
        )}
      </CapaRecorrido>
    </>
  )
}


export function HistoriaMirada ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  return <Recorrido encuesta={encuesta} abierta={abierta} parte="mirada" />
}

export function HistoriaEntrePotencias ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
  return <Recorrido encuesta={encuesta} abierta={abierta} parte="potencias" />
}
