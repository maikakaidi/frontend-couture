// src/services/galerieService.js
import { initDB, query, execute } from "./db";
import api from "../api";

/* ============================================================
   🔹 Lecture locale
   ============================================================ */
export const getGalerieLocal = async (categorie = "") => {
  await initDB();

  let rows;
  if (categorie) {
    rows = await query("SELECT * FROM galerie WHERE categorie = ?", [categorie]);
  } else {
    rows = await query("SELECT * FROM galerie");
  }

  return rows.map((r) => ({
    ...r,
    categorie: r.categorie || "Divers",
    synced: r.synced || 0,
    serverId: r.serverId || null,
  }));
};

/* ============================================================
   🔹 Upsert local
   ============================================================ */
export const upsertGalerieLocal = async (image) => {
  await initDB();

  await execute(
    `INSERT OR REPLACE INTO galerie 
      (_id, url, categorie, serverId, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      image._id,
      image.url,
      image.categorie || "Divers",
      image.serverId || null,
      image.synced || 0,
      image.createdAt || new Date().toISOString(),
      image.updatedAt || new Date().toISOString(),
    ]
  );
};

/* ============================================================
   🔹 Delete local
   ============================================================ */
export const deleteGalerieLocal = async (id) => {
  await initDB();
  await execute("DELETE FROM galerie WHERE _id = ?", [id]);
};

/* ============================================================
   🔹 Sync backend → SQLite
   ============================================================ */
export const fullSyncGalerie = async (categorie = "") => {
  await initDB();
  const localRows = await getGalerieLocal(categorie);

  try {
    const res = await api.get("/galerie", {
      params: categorie ? { categorie } : {},
    });

    const serverRows = res.data?.data || res.data || [];

    if (categorie) {
      await execute(
        "DELETE FROM galerie WHERE _id NOT LIKE 'local-%' AND categorie = ?",
        [categorie]
      );
    } else {
      await execute("DELETE FROM galerie WHERE _id NOT LIKE 'local-%'");
    }

    for (const img of serverRows) {
      await upsertGalerieLocal({
        ...img,
        serverId: img._id,
        synced: 1,
      });
    }

    return [
      ...serverRows,
      ...localRows.filter((img) => img._id.startsWith("local-")),
    ];
  } catch (err) {
    console.warn("Backend KO, retour local :", err.message);
    return localRows;
  }
};
