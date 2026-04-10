import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

/* 🔥 Nouveau système offline */
import { addPendingChange } from "../services/pendingService";
import { startAutoSync, syncAll } from "../services/syncService";

/* Services Articles (SQLite + backend) */
import {
  getArticlesLocal,
  fullSyncArticles,
  upsertArticleLocal,
  deleteArticleLocal,
} from "../services/articleService";

function ArticlesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    nom: "",
    prix: "",
    categorie: "",
    stock: 0,
    vendu: 0,
  });
  const [editArticle, setEditArticle] = useState(null);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);

  /* ============================================================
     1️⃣ CHARGEMENT INITIAL
     ============================================================= */
  const loadArticles = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const list = await fullSyncArticles();
        setArticles(list);
        setAllArticles(list);
      } else {
        const localArticles = await getArticlesLocal();
        setArticles(localArticles);
        setAllArticles(localArticles);
      }
    } catch (err) {
      console.warn("Erreur chargement articles :", err.message);
      const localArticles = await getArticlesLocal();
      setArticles(localArticles);
      setAllArticles(localArticles);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadArticles();

      const handleOnline = () => {
        console.log("🌐 Repassé en ligne → sync + reload");
        syncAll();       // rejoue les actions offline
        loadArticles();  // recharge les articles
      };

      window.addEventListener("online", handleOnline);

      return () => window.removeEventListener("online", handleOnline);
    };

    init();
  }, [loadArticles]);

  /* ============================================================
     2️⃣ SAUVEGARDE LOCALE
     ============================================================= */
  const saveLocalArticles = (list) => {
    setArticles(list);
    setAllArticles(list);
    localStorage.setItem("articles", JSON.stringify(list));
  };

  /* ============================================================
     3️⃣ AJOUTER UN ARTICLE
     ============================================================= */
  const handleAddArticle = async () => {
    const tempId = "local-" + Date.now().toString();
    const articleToSave = { ...newArticle, _id: tempId };

    // Optimistic update
    const updatedList = [articleToSave, ...articles];
    saveLocalArticles(updatedList);

    setNewArticle({ nom: "", prix: "", categorie: "", stock: 0, vendu: 0 });
    setShowForm(false);

    if (navigator.onLine) {
      try {
        const res = await api.post("/articles", articleToSave);
        const serverArticle = res.data;
        const finalList = updatedList.map((a) =>
          a._id === tempId ? serverArticle : a
        );
        saveLocalArticles(finalList);
      } catch (err) {
        console.error("Erreur API ajout article:", err);
        await addPendingChange("articles", "POST", "/articles", articleToSave);
        alert("📴 Article enregistré hors connexion");
      }
    } else {
      await addPendingChange("articles", "POST", "/articles", articleToSave);
      alert("📴 Article enregistré hors connexion");
    }
  };

  /* ============================================================
     4️⃣ MODIFIER UN ARTICLE
     ============================================================= */
  const handleUpdateArticle = async () => {
    if (!editArticle) return;

    const updatedList = articles.map((a) =>
      a._id === editArticle._id ? editArticle : a
    );
    saveLocalArticles(updatedList);
    setEditArticle(null);

    if (navigator.onLine) {
      try {
        await api.put(`/articles/${editArticle._id}`, editArticle);
      } catch (err) {
        console.error("Erreur API update article:", err);
        await addPendingChange("articles", "PUT", `/articles/${editArticle._id}`, editArticle);
        alert("📴 Modification enregistrée hors connexion");
      }
    } else {
      await addPendingChange("articles", "PUT", `/articles/${editArticle._id}`, editArticle);
      alert("📴 Modification enregistrée hors connexion");
    }
  };

  /* ============================================================
     5️⃣ SUPPRIMER UN ARTICLE
     ============================================================= */
  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;

    const newList = articles.filter((a) => a._id !== articleToDelete._id);
    saveLocalArticles(newList);
    setOpenConfirm(false);
    setArticleToDelete(null);

    if (navigator.onLine && !articleToDelete._id.startsWith("local-")) {
      try {
        await api.delete(`/articles/${articleToDelete._id}`);
      } catch (err) {
        console.error("Erreur API delete article:", err);
        await addPendingChange("articles", "DELETE", `/articles/${articleToDelete._id}`, { _id: articleToDelete._id });
        alert("📴 Suppression enregistrée hors connexion");
      }
    } else {
      await addPendingChange("articles", "DELETE", `/articles/${articleToDelete._id}`, { _id: articleToDelete._id });
      alert("📴 Suppression enregistrée hors connexion");
    }
  };

  /* ============================================================
     6️⃣ MISE À JOUR STOCK
     ============================================================= */
  const updateStock = async (id, action) => {
    if (navigator.onLine) {
      try {
        const res = await api.put(`/articles/${id}/stock`, { action });
        const updated = articles.map((a) => (a._id === id ? res.data : a));
        saveLocalArticles(updated);
      } catch (err) {
        console.error("Erreur API stock:", err);
        await addPendingChange("articles", "PUT", `/articles/${id}/stock`, { action });
        alert("❌ Mise à jour stock mise en file d'attente");
      }
    } else {
      await addPendingChange("articles", "PUT", `/articles/${id}/stock`, { action });
      alert("📴 Mise à jour stock enregistrée hors connexion");
    }
  };

  /* ============================================================
     7️⃣ RECHERCHE
     ============================================================= */
  const filteredArticles = allArticles.filter((a) =>
    a.nom?.toLowerCase().includes(search.toLowerCase())
  );


  // ============================
  // 7️⃣ RENDER
  // ============================
  return (
    <Box sx={{ p: 3, position: "relative" }}>
      {/* Flèche retour */}
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          bgcolor: "background.paper",
          boxShadow: 2,
          "&:hover": { bgcolor: "grey.200" },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Titre */}
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
        🛒 {t("Articles", "Articles", "المقالات")}
      </Typography>

      {/* Recherche */}
      <TextField
        fullWidth
        margin="normal"
        label={t("Rechercher un article", "Search an article", "البحث عن مقال")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Bouton Ajouter */}
      {!showForm ? (
        <Button
          variant="contained"
          sx={{ mb: 3 }}
          onClick={() => setShowForm(true)}
        >
          ➕ {t("Ajouter un article", "Add an article", "إضافة مقال")}
        </Button>
      ) : (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1">
            {t("Nouvel article", "New article", "مقال جديد")}
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            label={t("Nom", "Name", "الاسم")}
            value={newArticle.nom}
            onChange={(e) =>
              setNewArticle({ ...newArticle, nom: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("Prix", "Price", "السعر")}
            type="number"
            value={newArticle.prix}
            onChange={(e) =>
              setNewArticle({
                ...newArticle,
                prix: Number(e.target.value) || "",
              })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("Catégorie", "Category", "الفئة")}
            value={newArticle.categorie}
            onChange={(e) =>
              setNewArticle({ ...newArticle, categorie: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("Stock initial", "Initial stock", "المخزون الأولي")}
            type="number"
            value={newArticle.stock}
            onChange={(e) =>
              setNewArticle({
                ...newArticle,
                stock: Number(e.target.value) || 0,
              })
            }
          />

          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleAddArticle}>
              {t("Enregistrer", "Save", "حفظ")}
            </Button>
            <Button sx={{ ml: 2 }} onClick={() => setShowForm(false)}>
              {t("Annuler", "Cancel", "إلغاء")}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Liste des articles */}
      {filteredArticles.length === 0 ? (
        <Typography>
          {t("Aucun article trouvé", "No article found", "لم يتم العثور على مقال")}
        </Typography>
      ) : (
        filteredArticles.map((article) => (
          <Paper key={article._id || article.localId} sx={{ p: 2, mb: 2 }}>
            {editArticle && editArticle._id === article._id ? (
              <>
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("Nom", "Name", "الاسم")}
                  value={editArticle.nom}
                  onChange={(e) =>
                    setEditArticle({ ...editArticle, nom: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("Prix", "Price", "السعر")}
                  type="number"
                  value={editArticle.prix}
                  onChange={(e) =>
                    setEditArticle({
                      ...editArticle,
                      prix: Number(e.target.value) || "",
                    })
                  }
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("Catégorie", "Category", "الفئة")}
                  value={editArticle.categorie}
                  onChange={(e) =>
                    setEditArticle({
                      ...editArticle,
                      categorie: e.target.value,
                    })
                  }
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("Stock", "Stock", "المخزون")}
                  type="number"
                  value={editArticle.stock}
                  onChange={(e) =>
                    setEditArticle({
                      ...editArticle,
                      stock: Number(e.target.value) || 0,
                    })
                  }
                />
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleUpdateArticle}>
                    {t("Sauvegarder", "Save", "حفظ")}
                  </Button>
                  <Button sx={{ ml: 2 }} onClick={() => setEditArticle(null)}>
                    {t("Annuler", "Cancel", "إلغاء")}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="h6">{article.nom}</Typography>
                <Typography>
                  {t("Catégorie", "Category", "الفئة")}: {article.categorie}
                </Typography>
                <Typography>
                  💰 {t("Prix", "Price", "السعر")}: {article.prix} {t("FCFA", "FCFA", "فرنك سيفا")}
                </Typography>
                <Typography>
                  {t("Stock restant", "Remaining stock", "المخزون المتبقي")}: {article.stock}
                </Typography>
                <Typography>
                  {t("Vendu", "Sold", "المباع")}: {article.vendu}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => updateStock(article._id, "decrement")}
                  >
                    ➖ {t("Vendre", "Sell", "بيع")}
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ ml: 2 }}
                    onClick={() => updateStock(article._id, "increment")}
                  >
                    ➕ {t("Ajouter", "Add", "إضافة")}
                  </Button>

                  <Button sx={{ ml: 2 }} onClick={() => setEditArticle(article)}>
                    ✏️ {t("Modifier", "Edit", "تعديل")}
                  </Button>
                  <Button
                    sx={{ ml: 2 }}
                    color="error"
                    onClick={() => {
                      setArticleToDelete(article);
                      setOpenConfirm(true);
                    }}
                  >
                    🗑️ {t("Supprimer", "Delete", "حذف")}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        ))
      )}

      {/* Dialog confirmation suppression */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>{t("Confirmation", "Confirmation", "تأكيد")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t(
              "Es-tu sûr de vouloir supprimer l’article",
              "Are you sure you want to delete the article",
              "هل أنت متأكد من حذف المقال"
            )}{" "}
            <b>{articleToDelete?.nom}</b> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>
            {t("Annuler", "Cancel", "إلغاء")}
          </Button>
          <Button color="error" onClick={confirmDeleteArticle}>
            {t("Supprimer", "Delete", "حذف")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ArticlesPage;
