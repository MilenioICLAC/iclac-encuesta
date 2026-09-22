/*
 * Las piezas visibles que comparten las historias: el año del paso y la leyenda de oleadas. La
 * lectura de los contrastes está en `lectura.ts`, aparte para que la recarga en caliente de Vite
 * siga funcionando (un archivo de componentes no exporta funciones sueltas).
 */

/**
 * El año del dato más nuevo que ya entró, en grande y arriba de la figura.
 *
 * Hace el trabajo que la leyenda sola no hace: dice de qué oleada habla **este** paso, sin mandar
 * la vista fuera de la figura y traerla de vuelta. Va fuera del lienzo porque flotando sobre los
 * puntos chocaba con la fila de arriba, que es la del país mejor evaluado.
 */
export function AnioDelPaso ({ olas, tonos, hasta }: { olas: number[], tonos: string[], hasta: number }) {
  return (
    <div className="mb-1 flex justify-end">
      <span
        className="font-display text-[34px] font-bold leading-none tracking-tight tabular-nums opacity-40 transition-colors duration-500"
        style={{ color: tonos[hasta] }}
        aria-hidden
      >
        {olas[hasta]}
      </span>
    </div>
  )
}

/**
 * Qué color es qué oleada, al pie de la figura y a la derecha.
 *
 * **La muestra es el punto, del mismo tamaño que tiene en la figura**, incluido el crecimiento por
 * oleada: la leyenda tiene que verse como lo que el lector está mirando. Con barras de color había
 * que traducir de barra a punto.
 */
export function LeyendaDeOleadas ({ olas, tonos }: { olas: number[], tonos: string[] }) {
  return (
    <ul className="ml-auto flex flex-wrap items-center justify-end gap-x-3.5 gap-y-1">
      {olas.map((ola, i) => (
        <li key={ola} className="flex items-center gap-1.5 text-[11px] tabular-nums text-gray-500">
          <span
            className="inline-block shrink-0 rounded-full"
            style={{ backgroundColor: tonos[i], width: 8 + i * 2, height: 8 + i * 2 }}
          />
          {ola}
        </li>
      ))}
    </ul>
  )
}
