import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// CSS global lebih dulu supaya CSS komponen (diimpor lewat App) menang pada spesifisitas yang sama.
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
