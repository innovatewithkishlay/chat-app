import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
// After a deploy, a tab that is still open references chunk files that no
// longer exist; reload once to pick up the new build instead of crashing.
window.addEventListener("vite:preloadError", (event) => {
  const key = "touki:chunk-reload";
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});
// Clear the guard once the new build has been running for a while, so a
// later deploy can trigger another reload (but a permanently missing chunk
// can't cause a reload loop).
setTimeout(() => {
  try {
    sessionStorage.removeItem("touki:chunk-reload");
  } catch {
    // ignore
  }
}, 30_000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
