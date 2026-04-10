// src/services/userService.js
import api from "../api";
import { initDB, execute, query } from "./db";

/* ============================================================
   🔹 Récupérer le user depuis SQLite (pour login offline)
   ============================================================ */
export const getUserLocal = async (telephone) => {
  await initDB();
  const rows = await query("SELECT * FROM users WHERE telephone = ?", [telephone]);
  return rows.length > 0 ? rows[0] : null;
};

/* ============================================================
   🔹 Enregistrer / mettre à jour un user en local
   ============================================================ */
export const upsertUserLocal = async (user) => {
  await initDB();

  await execute(
    `INSERT OR REPLACE INTO users 
      (_id, nom, telephone, motDePasse, role, statut, atelierId, abonnement, dateInscription, langue, trialExpiresAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user._id,
      user.nom,
      user.telephone,
      user.motDePasse, // hashé côté backend
      user.role,
      user.statut,
      user.atelierId?._id || user.atelierId,
      user.abonnement?._id || user.abonnement,
      user.dateInscription,
      user.langue,
      user.trialExpiresAt,
      user.createdAt,
      user.updatedAt,
    ]
  );
};

/* ============================================================
   🔹 Récupérer le user depuis le backend
   ============================================================ */
export const getUserOnline = async () => {
  const res = await api.get("/auth/me");
  const user = res.data?.user || res.data;

  // Mise à jour locale pour login offline
  await upsertUserLocal(user);

  return user;
};

/* ============================================================
   🔹 Mettre à jour le profil utilisateur
   ============================================================ */
export const updateUserProfile = async (data) => {
  const res = await api.put("/users/update-profile", data);
  const user = res.data?.user || res.data;

  // Sync local
  await upsertUserLocal(user);

  return user;
};

/* ============================================================
   🔹 Changer le mot de passe
   ============================================================ */
export const updatePassword = async (oldPass, newPass) => {
  const res = await api.put("/users/update-password", {
    oldPassword: oldPass,
    newPassword: newPass,
  });

  return res.data;
};

/* ============================================================
   🔹 Vérifier l’abonnement / statut
   ============================================================ */
export const checkSubscriptionStatus = async () => {
  const res = await api.get("/users/check-subscription");
  return res.data; // { active: true/false, expiresAt: ... }
};

/* ============================================================
   🔹 Récupérer les infos de l’atelier
   ============================================================ */
export const getAtelierInfo = async () => {
  const res = await api.get("/atelier/me");
  return res.data?.atelier || res.data;
};

/* ============================================================
   🔹 Déconnexion propre
   ============================================================ */
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("atelierId");
};
