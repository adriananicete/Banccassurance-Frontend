import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted, so the app does not depend on reaching fonts.googleapis.com --
// corporate networks block it often enough that a bank and an insurer are the
// wrong place to find out. One variable file covers weights 100-900.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'
import { applyTheme, readTheme } from './lib/theme'

// Before the first render, so a dark-mode reload never flashes light.
applyTheme(readTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
