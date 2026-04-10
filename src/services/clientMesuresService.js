// src/services/clientMesuresService.js
import { initDB, query, execute } from "./db";
import api from "../api";

/* ============================================================
   🔹 Lecture locale
   ============================================================ */
export const getMesuresLocal = async (clientId) => {
  await initDB();
  const rows = await query("SELECT * FROM mesures WHERE clientId = ? ORDER BY datetime(createdAt) DESC", [clientId]);

  return rows.map((r) => ({
    ...r,
    synced: r.synced || 0,
    serverId: r.serverId || null,
  }));
};

/* ============================================================
   🔹 Ajouter / mettre à jour localement
   ============================================================ */
export const upsertMesureLocal = async (mesure) => {
  await initDB();

  await execute(
    `INSERT OR REPLACE INTO mesures 
      (_id, clientId, type, valeur, atelierId, serverId, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mesure._id,
      mesure.clientId,
      mesure.type || "",
      mesure.valeur || "",
      mesure.atelierId || null,
      mesure.serverId || null,
      mesure.synced || 0,
      mesure.createdAt || new Date().toISOString(),
      mesure.updatedAt || new Date().toISOString(),
    ]
  );
};

/* ============================================================
   🔹 Supprimer localement
   ============================================================ */
export const deleteMesureLocal = async (id) => {
  await initDB();
  await execute("DELETE FROM mesures WHERE _id = ?", [id]);
};

/* ============================================================
   🔹 Sync backend → SQLite
   ============================================================ */
export const fullSyncMesures = async (clientId) => {
  await initDB();
  const localRows = await getMesuresLocal(clientId);

  try {
    const res = await api.get(`/mesures/${clientId}`);
    const serverRows = res.data?.mesures || res.data || [];

    await execute("DELETE FROM mesures WHERE clientId = ? AND _id NOT LIKE 'local-%'", [clientId]);

    for (const m of serverRows) {
      await upsertMesureLocal({
        ...m,
        serverId: m._id,
        synced: 1,
      });
    }

    return [
      ...serverRows,
      ...localRows.filter((m) => m._id.startsWith("local-")),
    ];
  } catch (err) {
    console.warn("Backend KO, retour local :", err.message);
    return localRows;
  }
};
