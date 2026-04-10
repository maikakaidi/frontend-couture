// src/services/syncService.js
import { getPendingChanges, removePendingChange } from "./pendingService";
import api from "../api";

// Services locaux (SQLite)
import { upsertEmployeeLocal, deleteEmployeeLocal } from "./employeeService";
import { upsertClientLocal, deleteClientLocal } from "./clientService";
import { upsertCommandeLocal, deleteCommandeLocal } from "./commandeService";
import { upsertArticleLocal, deleteArticleLocal } from "./articleService";
import { upsertDepenseLocal, deleteDepenseLocal } from "./depenseService";
import { upsertMesureLocal, deleteMesureLocal } from "./clientMesuresService";
import { upsertGalerieLocal, deleteGalerieLocal } from "./galerieService";

let autoSyncStarted = false;

/* ============================================================
   🔥 Vérification connexion
   ============================================================ */
export const isOnline = () => navigator.onLine;

/* ============================================================
   🔄 Synchronisation d’une action
   ============================================================ */
const syncOne = async (item) => {
  const { id, entity, method, url, payload } = item;

  // 1️⃣ API CALL
  let res;
  if (method === "POST") res = await api.post(url, payload);
  if (method === "PUT") res = await api.put(url, payload);
  if (method === "DELETE") res = await api.delete(url);

  // 2️⃣ Récupération de la réponse serveur
  const data = res?.data?.data || res?.data?.client || res?.data?.emp || res?.data;

  // 3️⃣ Mise à jour locale selon entité
  switch (entity) {
    case "employes":
      if (method === "DELETE") await deleteEmployeeLocal(payload._id);
      else {
        if (payload._id?.startsWith("local-")) await deleteEmployeeLocal(payload._id);
        await upsertEmployeeLocal(data);
      }
      break;

    case "clients":
      if (method === "DELETE") await deleteClientLocal(payload._id);
      else {
        if (payload._id?.startsWith("local-")) await deleteClientLocal(payload._id);
        await upsertClientLocal(data);
      }
      break;

    case "commandes":
      if (method === "DELETE") await deleteCommandeLocal(payload._id);
      else {
        if (payload._id?.startsWith("local-")) await deleteCommandeLocal(payload._id);
        await upsertCommandeLocal(data);
      }
      break;

    case "articles":
      if (method === "DELETE") await deleteArticleLocal(payload._id);
      else {
        if (payload._id?.startsWith("local-")) await deleteArticleLocal(payload._id);
        await upsertArticleLocal(data);
      }
      break;

    case "depenses":
      if (method === "DELETE") await deleteDepenseLocal(payload._id);
      else {
        if (payload._id?.startsWith("local-")) await deleteDepenseLocal(payload._id);
        await upsertDepenseLocal(data);
      }
      break;

    case "mesures":
      if (method === "DELETE") await deleteMesureLocal(payload._id);
      else {
        if (payload._id?.startsWith("local-")) await deleteMesureLocal(payload._id);
        await upsertMesureLocal(data);
      }
      break;

    case "galerie":
      if (method === "DELETE") await deleteGalerieLocal(payload._id);
      else {
        if (payload._id?.startsWith("local-")) await deleteGalerieLocal(payload._id);
        await upsertGalerieLocal(data);
      }
      break;

    default:
      console.warn("⚠️ Entité inconnue :", entity);
  }

  // 4️⃣ Suppression de la file d’attente
  await removePendingChange(id);
};

/* ============================================================
   🔄 SYNC DES ACTIONS OFFLINE
   ============================================================ */
export const syncPendingChanges = async () => {
  const queue = await getPendingChanges();
  if (queue.length === 0) {
    console.log("📭 Aucune action offline à synchroniser");
    return;
  }

  console.log(`🔄 Synchronisation des actions offline (${queue.length})…`);

  for (const item of queue) {
    try {
      await syncOne(item);
      console.log("✅ Action synchronisée :", item);
    } catch (err) {
      console.warn("❌ Action échouée, conservée :", item, err.message);
      return; // stop si erreur réseau
    }
  }

  console.log("🎉 Toutes les actions offline ont été synchronisées");
};

/* ============================================================
   🔄 Sync global
   ============================================================ */
export const syncAll = async () => {
  if (!isOnline()) {
    console.log("📴 Offline — syncAll annulé");
    return;
  }

  console.log("🔄 Début synchronisation globale…");

  await syncPendingChanges();

  console.log("✅ Synchronisation globale terminée");
};

/* ============================================================
   ⚡ Auto-sync quand internet revient
   ============================================================ */
export const startAutoSync = () => {
  if (autoSyncStarted) return;
  autoSyncStarted = true;

  window.addEventListener("online", () => {
    console.log("🌐 Connexion rétablie → syncAll()");
    syncAll();
  });

  console.log("⚡ Auto-sync activé");
};
