'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registrar o service worker depois que a página carregar
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registrado com sucesso:', registration.scope)
          })
          .catch((error) => {
            console.log('Falha ao registrar o Service Worker:', error)
          })
      })
    }
  }, [])

  return null
}