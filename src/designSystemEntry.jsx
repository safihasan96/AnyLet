/**
 * Standalone entry for the design-system showcase — mounts ONLY the primitives
 * with ThemeProvider + Router, bypassing Firebase/Auth so the system can be
 * previewed in isolation (visit /design-system.html). Not shipped in the app
 * bundle; the in-app route lives at /design-system.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import DesignSystem from './pages/DesignSystem';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <DesignSystem />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
