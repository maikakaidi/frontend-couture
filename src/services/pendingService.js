// src/services/pendingService.js
import { execute, query, initDB } from "./db";
import { v4 as uuidv4 } from "uuid";

/* ============================================================
   🔹 Ajouter une action offline
   ============================================================ */
export const addPendingChange = async (entity, method, url, payload = {}) => {
  await initDB();

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  await execute(
    `
      INSERT INTO pending_changes (id, entity, method, url, payload, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [id, entity, method, url, JSON.stringify(payload), createdAt]
  );

  console.log("📌 Action offline enregistrée :", { id, entity, method, url });
};

/* ============================================================
   🔹 Lire toutes les actions offline
   ============================================================ */
export const getPendingChanges = async () => {
  await initDB();

  const rows = await query(
    "SELECT * FROM pending_changes ORDER BY datetime(createdAt) ASC"
  );

  return rows.map((r) => ({
    ...r,
    payload: r.payload ? JSON.parse(r.payload) : {},
  }));
};

/* ============================================================
   🔹 Supprimer une action après succès
   ============================================================ */
export const removePendingChange = async (id) => {
  await initDB();
  await execute("DELETE FROM pending_changes WHERE id = ?", [id]);
};
