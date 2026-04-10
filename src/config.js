// src/config.js

// URL de ton backend Railway (on en a encore besoin pour les requêtes API)
export const API_BASE_URL = "https://backend-couture-production.up.railway.app";

// Fonction pour afficher les images (logo, galerie, commandes, etc.)
export const getImageUrl = (imagePathOrUrl) => {
  // Cas 1 : pas d’image → placeholder neutre
  if (!imagePathOrUrl) {
    return "https://via.placeholder.com/300x300?text=Pas+d'image";
  }

  // Cas 2 : c’est déjà une URL complète (Cloudinary ou autre)
  // → on la renvoie telle quelle (c’est le cas pour toutes les nouvelles images)
  if (typeof imagePathOrUrl === 'string' && imagePathOrUrl.startsWith('http')) {
    return imagePathOrUrl;
  }

  // Cas 3 : ancien chemin local (ex: "/uploads/logos/xxx.jpg") → fallback
  // → on affiche un placeholder pour signaler que l’ancienne image n’est plus disponible
  return "https://via.placeholder.com/300x300?text=Ancienne+image";
};
