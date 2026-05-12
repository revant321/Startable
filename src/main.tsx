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

// Try to lock orientation to portrait. Works on Android/Chrome PWAs and
// browsers that support the Screen Orientation API. iOS Safari ignores
// this — the manifest's orientation: portrait-primary handles iOS PWAs
// (only when launched from the home screen), and the CSS overlay in
// globals.css gives users a rotate-back hint for any case where iOS
// still lets the app turn.
function tryLockPortrait() {
  const orientation = (screen as Screen & {
    orientation?: ScreenOrientation & { lock?: (o: string) => Promise<void> };
  }).orientation;
  if (orientation && typeof orientation.lock === 'function') {
    orientation.lock('portrait').catch(() => {});
  }
}
tryLockPortrait();
window.addEventListener('orientationchange', tryLockPortrait);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/Startable">
      <App />
    </BrowserRouter>
  </StrictMode>,
);
