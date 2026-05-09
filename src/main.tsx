import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

function syncAppHeight() {
  document.documentElement.style.setProperty(
    '--app-height',
    `${window.innerHeight}px`,
  );
}
syncAppHeight();
window.addEventListener('resize', syncAppHeight);
window.addEventListener('orientationchange', syncAppHeight);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/Startable">
      <App />
    </BrowserRouter>
  </StrictMode>,
);
