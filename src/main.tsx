import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { registerServiceWorker } from "./pwa/register";

createRoot(document.getElementById("root")!).render(<App />);

void registerServiceWorker(() => {
  window.dispatchEvent(new CustomEvent("sm:update-available"));
});
