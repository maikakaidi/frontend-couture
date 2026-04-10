// src/services/clientService.js
import { initDB, execute, query } from "./db";
import api from "../api";

/* ============================================================
   🔹 Lecture locale
   ============================================================ */
export const getClientsLocal = async () => {
  await initDB();
  const rows = await query("SELECT * FROM clients ORDER BY datetime(createdAt) DESC");

  return rows.map((r) => ({
    ...r,
    synced: r.synced || 0,
    serverId: r.serverId || null,
  }));
};

/* ============================================================
   🔹 Ajouter / mettre à jour localement
   ============================================================ */
export const upsertClientLocal = async (client) => {
  await initDB();

  await execute(
    `INSERT OR REPLACE INTO clients 
      (_id, nom, telephone, adresse, atelierId, serverId, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client._id,
      client.nom,
      client.telephone || "",
      client.adresse || "",
      client.atelierId || null,
      client.serverId || null,
      client.synced || 0,
      client.createdAt || new Date().toISOString(),
      client.updatedAt || new Date().toISOString(),
    ]
  );
};

/* ============================================================
   🔹 Supprimer localement
   ============================================================ */
export const deleteClientLocal = async (id) => {
  await initDB();
  await execute("DELETE FROM clients WHERE _id = ?", [id]);
};

/* ============================================================
   🔹 Sync backend → SQLite
   ============================================================ */
export const fullSyncClients = async () => {
  await initDB();
  const localRows = await getClientsLocal();

  try {
    const res = await api.get("/clients");
    const serverRows = res.data?.data || res.data || [];

    await execute("DELETE FROM clients WHERE _id NOT LIKE 'local-%'");

    for (const c of serverRows) {
      await upsertClientLocal({
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
