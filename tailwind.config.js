/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        // Igual que en el repositorio de inversiones: Raleway solo en el encabezado,
        // que es lo que se compara contra iclac.cl. El cuerpo va en la fuente del
        // sistema porque esto es lectura densa, no una página institucional.
        display: ['Raleway', 'system-ui', 'sans-serif']
      },
      colors: {
        // brand      sobre control claro  -> con text-gray-900 (5,8:1)
        // brand-dark sobre control activo -> aguanta text-white (5,4:1)
        // text-white sobre `brand` da 2,96:1, bajo el AA de 4,5:1. No usar.
        brand: {
          DEFAULT: '#00A89C',
          dark: '#00776E'
        }
      }
    }
  },
  plugins: [],
  future: {
    // Los `hover:` solo con puntero fino (`@media (hover: hover) and (pointer: fine)`). En un
    // teléfono el toque dispara el hover y lo deja pegado hasta tocar otra cosa.
    hoverOnlyWhenSupported: true
  }
}
