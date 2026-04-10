// src/services/employeeService.js
import { initDB, execute, query } from "./db";
import api from "../api";

/* ============================================================
   🔹 Lecture locale
   ============================================================ */
export const getEmployeesLocal = async () => {
  await initDB();
  const rows = await query("SELECT * FROM employes ORDER BY datetime(createdAt) DESC");

  return rows.map((r) => ({
    ...r,
    advances: r.advances ? JSON.parse(r.advances) : [],
    synced: r.synced || 0,
    serverId: r.serverId || null,
  }));
};

/* ============================================================
   🔹 Ajouter / mettre à jour localement
   ============================================================ */
export const upsertEmployeeLocal = async (emp) => {
  await initDB();

  await execute(
    `INSERT OR REPLACE INTO employes 
      (_id, nom, telephone, poste, salaire, advances, atelierId, serverId, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      emp._id,
      emp.telephone || "",
      emp.nom,
      emp.poste,
      emp.salaire,
      JSON.stringify(emp.advances || []),
      emp.atelierId || null,
      emp.serverId || null,
      emp.synced || 0,
      emp.createdAt || new Date().toISOString(),
      emp.updatedAt || new Date().toISOString(),
    ]
  );
};

/* ============================================================
   🔹 Supprimer localement
   ============================================================ */
export const deleteEmployeeLocal = async (id) => {
  await initDB();
  await execute("DELETE FROM employes WHERE _id = ?", [id]);
};

/* ============================================================
   🔹 Sync backend → SQLite
   ============================================================ */
export const fullSyncEmployees = async () => {
  await initDB();

  const localRows = await getEmployeesLocal();

  try {
    const res = await api.get("/employes");
    const serverRows = res.data?.data || res.data || [];

    await execute("DELETE FROM employes WHERE _id NOT LIKE 'local-%'");

    for (const emp of serverRows) {
      await upsertEmployeeLocal({
        ...emp,
        serverId: emp._id,
        synced: 1,
      });
    }

    return [
      ...serverRows,
      ...localRows.filter((e) => e._id.startsWith("local-")),
    ];
  } catch (err) {
    console.warn("Backend KO, retour local :", err.message);
    return localRows;
  }
};
