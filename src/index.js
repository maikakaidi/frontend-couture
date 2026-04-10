import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ClientsProvider } from "./context/ClientsContext";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";

/* 🔹 SQLite Web */
import { defineCustomElements } from "jeep-sqlite/loader";
defineCustomElements(window);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ClientsProvider>
        <App />
      </ClientsProvider>
    </ThemeProvider>
  </React.StrictMode>
);

/* 🔹 Enregistrement du Service Worker pour la PWA */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("✅ Service Worker enregistré :", registration.scope);
      })
      .catch((error) => {
        console.error("❌ Échec de l’enregistrement du Service Worker :", error);
      });
  });
}
