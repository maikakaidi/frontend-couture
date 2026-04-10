// src/services/depenseService.js
import { initDB, query, execute } from "./db";
import api from "../api";

/* ============================================================
   🔹 Lecture locale
   ============================================================ */
export const getDepensesLocal = async () => {
  await initDB();
  const rows = await query("SELECT * FROM depenses");

  return rows.map((r) => ({
    ...r,
    montant: r.montant || 0,
    categorie: r.categorie || "",
    atelierId: r.atelierId || null,
    synced: r.synced || 0,
    serverId: r.serverId || null,
  }));
};

/* ============================================================
   🔹 Upsert local
   ============================================================ */
export const upsertDepenseLocal = async (depense) => {
  await initDB();

  await execute(
    `INSERT OR REPLACE INTO depenses 
      (_id, titre, montant, categorie,atelierId, serverId, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?,?, ?)`,
    [
      depense._id,
      depense.titre,
      depense.montant,
      depense.categorie || "",
      depense.atelierId,
      depense.serverId || null,
      depense.synced || 0,
      depense.createdAt || new Date().toISOString(),
      depense.updatedAt || new Date().toISOString(),
    ]
  );
};

/* ============================================================
   🔹 Delete local
   ============================================================ */
export const deleteDepenseLocal = async (id) => {
  await initDB();
  await execute("DELETE FROM depenses WHERE _id = ?", [id]);
};

/* ============================================================
   🔹 Sync backend → SQLite
   ============================================================ */
export const fullSyncDepenses = async () => {
  await initDB();
  const localRows = await getDepensesLocal();

  try {
    const res = await api.get("/depenses");
    const serverRows = res.data?.data || res.data || [];

    await execute("DELETE FROM depenses WHERE _id NOT LIKE 'local-%'");

    for (const d of serverRows) {
      await upsertDepenseLocal({
        ...d,
        atelierId: d.atelierId,
        serverId: d._id,
        synced: 1,
      });
    }

    return [
      ...serverRows,
      ...localRows.filter((d) => d._id.startsWith("local-")),
    ];
  } catch (err) {
    console.warn("Backend KO, retour local :", err.message);
    return localRows;
  }
};
