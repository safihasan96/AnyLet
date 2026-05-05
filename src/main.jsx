import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { registerSW } from 'virtual:pwa-register'
import { HelmetProvider } from 'react-helmet-async';
import './index.css'
import App from './App.jsx'

// Register service worker and auto-update on new content
registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      window.location.reload()
    }
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
