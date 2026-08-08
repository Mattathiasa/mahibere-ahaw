import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Leaflet ships its layout as CSS; without this the map panes stack and the
// tiles render as a scrambled column rather than a map.
import "leaflet/dist/leaflet.css";

/**
 * Recover from a stale tab after a deploy.
 *
 * Every route in App.tsx is lazily imported, and the built chunks carry a
 * content hash. After a new deploy the previous hashes no longer exist, so a
 * tab that was already open asks for a file that is gone and the navigation
 * dies with "Failed to fetch dynamically imported module" — most visibly on
 * the very first lazy route after signing in.
 *
 * Vite raises `vite:preloadError` for exactly this. Reloading pulls the new
 * index.html and its current chunks. The session guard means a genuinely
 * broken chunk shows the real error instead of reloading forever.
 */
const RELOAD_GUARD = 'chunk-reload-attempted';

window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem(RELOAD_GUARD)) return;
  sessionStorage.setItem(RELOAD_GUARD, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

// Cleared once the app has actually mounted, so a later deploy in the same tab
// can recover too.
window.addEventListener('load', () => {
  sessionStorage.removeItem(RELOAD_GUARD);
});

createRoot(document.getElementById("root")!).render(<App />);

/**
 * Retire the pre-boot splash from index.html now that React has painted.
 *
 * It sits beside #root rather than inside it, so it survives the first render
 * and can be crossfaded away: underneath is BrandedLoader on the same
 * background, which means the visitor sees one continuous loading screen
 * rather than a splash, a flash, and then a spinner.
 */
requestAnimationFrame(() => {
  const splash = document.getElementById('boot-splash');
  if (!splash) return;
  splash.classList.add('is-hiding');
  setTimeout(() => splash.remove(), 300);
});
