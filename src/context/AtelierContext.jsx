import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AtelierContext = createContext();

export function AtelierProvider({ children }) {
  const [atelier, setAtelier] = useState({
    nom: "",
    logo: "",
    theme: "#1976d2"
  });

  // Charger les paramètres une seule fois au démarrage
  useEffect(() => {
    axios.get("http://localhost:5000/api/settings")
      .then(res => setAtelier(res.data))
      .catch(err => console.error("❌ Erreur chargement settings:", err));
  }, []);

  return (
    <AtelierContext.Provider value={{ atelier, setAtelier }}>
      {children}
    </AtelierContext.Provider>
  );
}
