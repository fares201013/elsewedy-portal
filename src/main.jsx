import './storage-shim.js';
import './sync.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Intro from './intro/Intro.jsx';
import CopperCable from './fun/CopperCable.jsx';
import Volt from './fun/Volt.jsx';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';
import './theme/base.css';
import './theme/volt.css';

// Volt's welcome plays on every full load; the app mounts underneath as it dissolves
function Root() {
  const [showApp, setShowApp] = React.useState(false);
  const [showIntro, setShowIntro] = React.useState(true);
  return (
    <>
      {showApp && <App />}
      {showApp && <Volt />}
      <CopperCable />
      {showIntro && (
        <Intro
          onExit={() => { window.__voltIntroPlayed = true; setShowApp(true); }}
          onDone={() => setShowIntro(false)}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
