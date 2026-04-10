// src/services/articleService.js
import { initDB, query, execute } from "./db";
import api from "../api";

/* ============================================================
   🔹 Lecture locale
   ============================================================ */
export const getArticlesLocal = async () => {
  await initDB();
  const rows = await query("SELECT * FROM articles");

  return rows.map((r) => ({
    ...r,
    stock: r.stock || 0,
    vendu: r.vendu || 0,
     atelierId: r.atelierId || null,
    synced: r.synced || 0,
    serverId: r.serverId || null,
  }));
};

/* ============================================================
   🔹 Upsert local
   ============================================================ */
export const upsertArticleLocal = async (article) => {
  await initDB();

  await execute(
    `INSERT OR REPLACE INTO articles 
      (_id, nom, prix, categorie, stock, vendu,atelierId, serverId, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)`,
    [
      article._id,
      article.nom,
      article.prix,
      article.categorie,
      article.atelierId,
      article.stock || 0,
      article.vendu || 0,
      article.serverId || null,
      article.synced || 0,
      article.createdAt || new Date().toISOString(),
      article.updatedAt || new Date().toISOString(),
    ]
  );
};

/* ============================================================
   🔹 Delete local
   ============================================================ */
export const deleteArticleLocal = async (id) => {
  await initDB();
  await execute("DELETE FROM articles WHERE _id = ?", [id]);
};

/* ============================================================
   🔹 Sync backend → SQLite
   ============================================================ */
export const fullSyncArticles = async () => {
  await initDB();
  const localRows = await getArticlesLocal();

  try {
    const res = await api.get("/articles");
    const serverRows = res.data?.data || res.data || [];

    // Supprimer uniquement les entrées serveur
    await execute("DELETE FROM articles WHERE _id NOT LIKE 'local-%'");

    for (const a of serverRows) {
      await upsertArticleLocal({
        ...a,
        atelierId: a.atelierId,
        serverId: a._id,
        synced: 1,
      });
    }

    return [
      ...serverRows,
      ...localRows.filter((a) => a._id.startsWith("local-")),
    ];
  } catch (err) {
    console.warn("Backend KO, retour local :", err.message);
    return localRows;
  }
};
