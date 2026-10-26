import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './theme.jsx'
import MusicPlayer from './components/MusicPlayer.jsx'
import Blog from './pages/Blog.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Blog />
      <MusicPlayer />
    </ThemeProvider>
  </React.StrictMode>
)
