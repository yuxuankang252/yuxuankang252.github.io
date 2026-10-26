import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './theme.jsx'
import Home from './pages/Home.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  </React.StrictMode>
)
