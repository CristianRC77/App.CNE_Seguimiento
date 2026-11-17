// StrictMode ayuda a detectar problemas potenciales durante el desarrollo.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Monta la aplicación React en el elemento raíz del documento HTML.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
