import axios from "axios";
import { Preferences } from "@capacitor/preferences";

// URL de base (Railway ou variable d'environnement)
const API_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://backend-couture-production.up.railway.app/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

/* ============================================================
   🔐 INTERCEPTEUR REQUÊTE
   - Ajoute automatiquement le token
   - Ajoute la langue
============================================================ */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const langue = localStorage.getItem("langue") || "fr";

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["Accept-Language"] = langue;

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   🔁 INTERCEPTEUR RÉPONSE
   - Gestion 401 → déconnexion
   - Cache local si serveur inaccessible
============================================================ */
api.interceptors.response.use(
  async (response) => {
    // Exemple : cache des utilisateurs
    if (response.config.url.includes("/users")) {
      await Preferences.set({
        key: "users_cache",
        value: JSON.stringify(response.data),
      });
    }

    return response;
  },
  async (error) => {
    // 🔐 Token expiré → déconnexion
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }

    // 🔌 Serveur inaccessible → fallback cache
    if (error.request && error.config.url.includes("/users")) {
      const { value } = await Preferences.get({ key: "users_cache" });
      if (value) {
        return { data: JSON.parse(value) };
      }
      alert("Serveur inaccessible et aucun cache disponible.");
    }

    return Promise.reject(error);
  }
);

/* ============================================================
   📸 UPLOAD IMAGE CLOUDINARY
============================================================ */
export const uploadImage = async (filePath) => {
  try {
    const res = await api.post("/upload", { filePath });
    return res.data.url;
  } catch (error) {
    console.error("Erreur upload image :", error);
    throw error;
  }
};

export default api;
