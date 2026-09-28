import React from 'react'
import ReactDOM from 'react-dom/client'
// Antes que la app: el idioma se detecta (`?lng=`, lo guardado, el navegador) antes del primer dibujo.
import './i18n'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Falta #root en index.html')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
