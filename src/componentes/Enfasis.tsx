import './Enfasis.css'

/**
 * La marca que señala el segmento del que habla el paso.
 *
 * **Dura todo el paso.** Reemplaza a la emanata de 700 ms, que medida en el navegador se pierde
 * mientras uno lee: el paso dura lo que tarda la frase, y un gesto que se apaga antes ya terminó
 * cuando la vista llega a la figura.
 *
 * Se monta **dentro** del segmento, que tiene que ser `position: relative`. No hace falta darle
 * ancho ni posición: los toma del segmento, así que sigue calzando si el dato cambia.
 */
export default function Enfasis () {
  return <span className="enfasis-barra" aria-hidden="true" />
}
