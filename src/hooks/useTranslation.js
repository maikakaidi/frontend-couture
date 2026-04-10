// src/hooks/useTranslation.js
import { useState, useEffect, useCallback } from "react";

export const useTranslation = () => {
  const [langue, setLangue] = useState(localStorage.getItem("langue") || "fr");

  useEffect(() => {
    localStorage.setItem("langue", langue);
  }, [langue]);

  // Fonction t stable grâce à useCallback
  const t = useCallback((fr, en, ar) => {
    if (langue === "en") return en;
    if (langue === "ar") return ar;
    return fr;
  }, [langue]);

  return { t, langue, setLangue };
};
