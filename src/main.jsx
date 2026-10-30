import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './theme.jsx'
import App from './App.jsx'
import MusicPlayer from './components/MusicPlayer.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <MusicPlayer />
    </ThemeProvider>
  </React.StrictMode>
)
