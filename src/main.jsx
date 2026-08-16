import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Service worker'i kaydet. Yol GORELI: GitHub Pages alt klasorunde
// (/7ler_Demo/) de calissin diye BASE_URL uzerinden kuruluyor.
// Kayit nesnesini saklyoruz; itme bildirimi izni alinirken FCM'e verilecek.
export let swKaydi = null

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL })
      .then((k) => { swKaydi = k })
      .catch((e) => console.warn('Service worker kaydedilemedi:', e))
  })
}
