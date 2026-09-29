/**
 * El nombre de un gráfico, dentro de su `<figure>`.
 *
 * **Dice qué se está mirando; el titular de la escena dice qué significa.** Son dos voces distintas
 * y no se repiten: el titular afirma un hallazgo («En 2025 China pasa a Estados Unidos») y el
 * rótulo nombra la medida y su base («Simpatía media por cada país»).
 *
 * **Por qué existe como componente y no como una clase copiada.** Hasta el 29-09-2026 el rótulo se
 * escribía a mano en la escena, y había dos formas distintas de escribirlo (11 px en versalitas en
 * `territorio` y en las palabras de `mirada`; 14 px en negrita en los buses de `china-cotidiana`)
 * sobre diecisiete figuras que no lo llevaban. Un dato, un lugar.
 *
 * **Es `<figcaption>` y va dentro del `<figure>`**, no un `<p>` encima: así el nombre viaja con la
 * figura en cualquier composición, y un lector de pantalla lo anuncia como su leyenda en vez de
 * como un párrafo suelto que casualmente está antes.
 *
 * El texto se escribe en minúsculas en su idioma y las versalitas las pone el CSS: guardado en
 * mayúsculas de verdad, el inglés y el chino quedan mal y algunos lectores de pantalla lo deletrean.
 */
export default function RotuloFigura ({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <figcaption className="rotulo-figura mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
      {children}
    </figcaption>
  )
}
