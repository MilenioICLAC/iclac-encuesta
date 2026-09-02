import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { leerLibroDeCodigos } from './dta.mjs'
import { parsearCsv, detectarSeparador } from './csv.mjs'

const libro2023 = leerLibroDeCodigos(readFileSync('data/sources/2023/data_stata.dta'))
const buscar = (n) => libro2023.variables.find((v) => v.nombre === n)

describe('libro de códigos del .dta 2023', () => {
  it('lee la cabecera del release 118', () => {
    expect(libro2023.release).toBe(118)
    expect(libro2023.codificacion).toBe('utf-8')
    expect(libro2023.casos).toBe(664)
    expect(libro2023.variables).toHaveLength(55)
  })

  // El relleno de los campos de ancho fijo trae basura del escritor: el primer nombre
  // ocupa "key\0ricalId\0...", con restos de numericalId después del terminador. Si el
  // corte en el NUL se hiciera después de decodificar, este nombre saldría contaminado.
  it('corta en el primer NUL y no arrastra la basura del relleno', () => {
    expect(libro2023.variables[0].nombre).toBe('key')
    expect(libro2023.variables[1].nombre).toBe('numericalId')
  })

  // Decodificar en latin-1 devolvería "Â¿Con quÃ© gÃ©nero", que es lo que entrega
  // pandas.read_stata al caer a su codificación de respaldo.
  it('decodifica los acentos en utf-8, sin mojibake', () => {
    expect(buscar('SEXO').enunciado).toBe('¿Con qué género te identificas?')
    expect(buscar('P4').categorias).toContainEqual({ codigo: 3, etiqueta: 'No voté / voté en blanco' })
    expect(libro2023.sospechas).toEqual([])
  })

  it('marca los enunciados que el .dta recortó a 80 bytes', () => {
    expect(buscar('P12').enunciadoTruncado).toBe(false)
    expect(buscar('P3').enunciadoTruncado).toBe(true)
    expect(buscar('P3').enunciado.endsWith('�')).toBe(false)
  })

  it('resuelve las categorías de respuesta y las deja ordenadas por código', () => {
    expect(buscar('SEXO').categorias).toEqual([
      { codigo: 1, etiqueta: 'Masculino' },
      { codigo: 2, etiqueta: 'Femenino' }
    ])
    // 16 regiones más el centinela 999 "No informada", que no tiene ningún caso.
    const region = buscar('REGION').categorias
    expect(region).toHaveLength(17)
    expect(region.at(-1)).toEqual({ codigo: 999, etiqueta: 'No informada' })
    expect(region.map((c) => c.codigo)).toEqual([...region.map((c) => c.codigo)].sort((a, b) => a - b))
  })

  // El .dta de 2024 no trae ni una sola etiqueta de respuesta, y sus enunciados son el
  // propio nombre de la columna. Es la razón de C9.
  it('no inventa documentación donde el archivo no la trae (2024)', () => {
    const libro2024 = leerLibroDeCodigos(readFileSync('data/sources/2024/data_stata.dta'))
    expect(Object.keys(libro2024.conjuntos)).toHaveLength(0)
    expect(libro2024.variables.every((v) => v.categorias === null)).toBe(true)
    expect(libro2024.variables.find((v) => v.nombre === 'sexo').enunciado).toBeNull()
  })
})

describe('parser de CSV', () => {
  it('respeta comas y comillas dentro del campo', () => {
    const filas = parsearCsv('a,b\n"uno, dos",tres\n"con ""comillas""",cuatro\n')
    expect(filas).toEqual([
      ['a', 'b'],
      ['uno, dos', 'tres'],
      ['con "comillas"', 'cuatro']
    ])
  })

  it('acepta saltos de línea dentro de un campo entrecomillado y finales CRLF', () => {
    expect(parsearCsv('a,b\r\n"dos\nlíneas",x\r\n')).toEqual([['a', 'b'], ['dos\nlíneas', 'x']])
  })

  it('detecta el punto y coma que escribe Excel en configuración española', () => {
    expect(detectarSeparador('a;b;c\n1;2;3')).toBe(';')
    expect(detectarSeparador('a,b,c\n1,2,3')).toBe(',')
  })
})

// El conjunto de etiquetas de comuna llegó con toda ocurrencia de "vi" borrada. Se
// documenta, no se parcha: reinsertarla exigiría una lista oficial de comunas que este
// repositorio no tiene, y sería una reparación con criterio, no una corrección
// determinista. Registro interno: C10.
describe('el defecto conocido de las etiquetas de comuna (2023)', () => {
  const comuna = buscar('COMUNA').categorias

  it('trae las 346 comunas más el centinela', () => {
    expect(comuna).toHaveLength(347)
  })

  it('no conserva ni una sola ocurrencia de "vi", teniendo otras "v"', () => {
    expect(comuna.filter((c) => /vi/i.test(c.etiqueta))).toHaveLength(0)
    expect(comuna.filter((c) => /v/i.test(c.etiqueta)).length).toBeGreaterThan(0)
  })

  it('perdió el nombre de las comunas que llevaban "vi"', () => {
    const etiquetas = comuna.map((c) => c.etiqueta)
    for (const [real, mutilada] of [
      ['Viña del Mar', 'ña del Mar'],
      ['Providencia', 'Prodencia'],
      ['San Vicente', 'San cente'],
      ['Valdivia', 'Valdia']
    ]) {
      expect(etiquetas).not.toContain(real)
      expect(etiquetas).toContain(mutilada)
    }
  })
})
