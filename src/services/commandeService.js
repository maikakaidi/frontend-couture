// src/services/commandeService.js
import { initDB, query, execute } from "./db";
import api from "../api";

/* ============================================================
   🔹 Lecture locale (PAR CLIENT)
   ============================================================ */
export const getCommandesLocal = async (clientId) => {
  await initDB();
  // En mode web le filtrage est déjà fait dans db.js
  // En mode mobile on fait la vraie requête
  const rows = await query(
    "SELECT * FROM commandes WHERE clientId = ? ORDER BY datetime(createdAt) DESC",
    [clientId]
  );

  return rows.map((r) => ({
    ...r,
    produits: r.produits ? JSON.parse(r.produits) : [],
    synced: r.synced || 0,
    serverId: r.serverId || null,
  }));
};

/* ============================================================
   🔹 Ajouter / mettre à jour localement
   ============================================================ */
export const upsertCommandeLocal = async (commande) => {
  await initDB();

  await execute(
    `INSERT OR REPLACE INTO commandes 
      (_id, description, montant, acompte, rdv, produits, clientId, atelierId, serverId, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      commande._id,
      commande.description || "",
      commande.montant || 0,
      commande.acompte || 0,
      commande.rdv || null,
      JSON.stringify(commande.produits || []),
      commande.clientId,
      commande.atelierId || null,
      commande.serverId || null,
      commande.synced || 0,
      commande.createdAt || new Date().toISOString(),
      commande.updatedAt || new Date().toISOString(),
    ]
  );
};

/* ============================================================
   🔹 Supprimer localement
   ============================================================ */
export const deleteCommandeLocal = async (id) => {
  await initDB();
  await execute("DELETE FROM commandes WHERE _id = ?", [id]);
};

/* ============================================================
   🔹 Sync backend → SQLite (PAR CLIENT)
   ============================================================ */
export const fullSyncCommandes = async (clientId) => {
  await initDB();
  const localRows = await getCommandesLocal(clientId);

  try {
    const res = await api.get(`/commandes?clientId=${clientId}`);
    const serverRows = res.data?.commandes || res.data?.data || res.data || [];

    await execute("DELETE FROM commandes WHERE clientId = ? AND _id NOT LIKE 'local-%'", [clientId]);

    for (const c of serverRows) {
      await upsertCommandeLocal({
        ...c,
        serverId: c._id,
        synced: 1,
      });
    }

    return [
      ...serverRows,
      ...localRows.filter((c) => c._id.startsWith("local-")),
    ];
  } catch (err) {
    console.warn("Backend KO, retour local :", err.message);
    return localRows;
  }
};
