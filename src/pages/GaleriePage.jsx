import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Alert,
  Divider,
  IconButton,
} from "@mui/material";
import api from "../api";
import { getImageUrl } from "../config";
import { useTranslation } from "../hooks/useTranslation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

// 🔥 Nouveau système offline
import { addPendingChange } from "../services/pendingService";
import {  syncAll } from "../services/syncService";

// 🔹 Services Galerie (SQLite + backend)
import {
  getGalerieLocal,
  fullSyncGalerie,
  upsertGalerieLocal,
  deleteGalerieLocal,
} from "../services/galerieService";

function GaleriePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [categorie, setCategorie] = useState("");
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* ============================================================
     1️⃣ CHARGEMENT INITIAL
     ============================================================= */
  const fetchImages = useCallback(async (cat = "") => {
    try {
      if (navigator.onLine) {
        const list = await fullSyncGalerie(cat);
        setImages(list);
      } else {
        const localData = await getGalerieLocal(cat);
        setImages(localData);
      }
    } catch (err) {
      console.warn("Erreur chargement galerie :", err.message);
      const localData = await getGalerieLocal(cat);
      setImages(localData);
    }
  }, []);

  useEffect(() => {
    fetchImages();

    const handleOnline = () => {
      console.log("🌐 Repassé en ligne → sync + reload");
      syncAll();       // rejoue les actions offline
      fetchImages();   // recharge la galerie
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [fetchImages]);

  /* ============================================================
     2️⃣ UPLOAD
     ============================================================= */
  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("imageGalerie", file);
    formData.append("categorie", categorie || t("Divers", "Miscellaneous", "متنوع"));

    if (navigator.onLine) {
      try {
        const res = await api.post("/galerie/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const serverImage = res.data;
        await upsertGalerieLocal(serverImage);
        await fetchImages(categorie);
      } catch (err) {
        console.error("Erreur upload galerie:", err);
        setUploadError(t("Échec de l'upload", "Upload failed", "فشل الرفع"));
      }
    } else {
      // Offline → impossible d’uploader, mais on peut mettre en file d’attente
      await addPendingChange("galerie", "POST", "/galerie/upload", {
        categorie,
        fileName: file.name,
      });
      setUploadError(
        t("Upload enregistré hors connexion", "Upload queued offline", "تم تسجيل الرفع بدون اتصال")
      );
    }

    setUploading(false);
  };

  /* ============================================================
     3️⃣ SUPPRESSION
     ============================================================= */
  const handleDelete = async (id) => {
    const newList = images.filter((img) => img._id !== id);
    setImages(newList);

    if (navigator.onLine && !id.startsWith("local-")) {
      try {
        await api.delete(`/galerie/${id}`);
        await deleteGalerieLocal(id);
      } catch (err) {
        console.error("Erreur API delete image:", err);
        await addPendingChange("galerie", "DELETE", `/galerie/${id}`, { _id: id });
      }
    } else {
      await addPendingChange("galerie", "DELETE", `/galerie/${id}`, { _id: id });
    }

    setConfirmDelete(null);
  };

  /* ============================================================
     4️⃣ GROUPING
     ============================================================= */
  const groupedImages = () => {
    if (categorie) return { [categorie]: images };

    return images.reduce((acc, img) => {
      const cat = img.categorie || t("Divers", "Miscellaneous", "متنوع");
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(img);
      return acc;
    }, {});
  };

  const groups = groupedImages();

  const categories = [
    { value: "", label: t("Toutes les catégories", "All categories", "جميع الفئات") },
    { value: "Mariage", label: t("Mariage", "Wedding", "زفاف") },
    { value: "Mode", label: t("Mode", "Fashion", "أزياء") },
    { value: "Divers", label: t("Divers", "Miscellaneous", "متنوع") },
  ];

  /* ============================================================
     5️⃣ UI (inchangé)
     ============================================================ */
  return (
    <Box sx={{ p: 3, position: "relative" }}>
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

      <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
        🖼️ {t("Galerie", "Gallery", "المعرض")}
      </Typography>

      {uploadError && <Alert severity="error" sx={{ mb: 3 }}>{uploadError}</Alert>}

      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Select
          value={categorie}
          onChange={(e) => {
            setCategorie(e.target.value);
            fetchImages(e.target.value);
          }}
          displayEmpty
          sx={{ minWidth: 220 }}
        >
          {categories.map((cat) => (
            <MenuItem key={cat.value} value={cat.value}>
              {cat.label}
            </MenuItem>
          ))}
        </Select>

        <Button variant="contained" component="label" sx={{ ml: "auto" }} disabled={uploading}>
          {uploading ? "Uploading..." : "+ " + t("Ajouter une image", "Add image", "إضافة صورة")}
          <input hidden type="file" accept="image/*" onChange={handleUpload} />
        </Button>
      </Box>

      {Object.keys(groups).length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {categorie
            ? t("Aucune image dans cette catégorie", "No images in this category", "لا توجد صور في هذه الفئة")
            : t("Aucune image dans la galerie", "No images in the gallery", "لا توجد صور في المعرض")}
        </Alert>
      ) : (
        Object.entries(groups).map(([cat, imgs]) => (
          <Box key={cat} sx={{ mb: 6 }}>
            <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
              {cat}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {imgs.map((img) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={img._id}>
                  <Paper elevation={2} sx={{ p: 1, textAlign: "center", borderRadius: 2, overflow: "hidden" }}>
                    <img
                      src={getImageUrl(img.filename || img.url || img.image)}
                      alt={img.titre || "Photo"}
                      style={{
                        width: "100%",
                        height: 160,
                        objectFit: "cover",
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                      onClick={() => setSelectedImage(img)}
                      onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
                      onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300?text=Photo+introuvable";
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                      {img.titre || t("Sans titre", "Untitled", "بدون عنوان")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(img.createdAt).toLocaleDateString()}
                    </Typography>

                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setConfirmDelete(img)}
                      sx={{ mt: 1, width: "100%" }}
                    >
                      {t("Supprimer", "Delete", "حذف")}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}

      {/* Dialogs */}
      {selectedImage && (
        <Dialog open onClose={() => setSelectedImage(null)} maxWidth="lg" fullWidth>
          <DialogTitle>{selectedImage.titre || t("Photo", "Photo", "صورة")}</DialogTitle>
          <DialogContent dividers>
            <img
              src={getImageUrl(selectedImage.filename || selectedImage.url || selectedImage.image)}
              alt={selectedImage.titre || "Photo"}
              style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedImage(null)}>{t("Fermer", "Close", "إغلاق")}</Button>
          </DialogActions>
        </Dialog>
      )}

      {confirmDelete && (
        <Dialog open onClose={() => setConfirmDelete(null)}>
          <DialogTitle>{t("Confirmation")}</DialogTitle>
          <DialogContent>
            {t(
              "Voulez-vous vraiment supprimer cette image ?",
              "Do you really want to delete this image?",
              "هل تريد حقًا حذف هذه الصورة؟"
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)}>{t("Annuler")}</Button>
            <Button color="error" onClick={() => handleDelete(confirmDelete._id)}>
              {t("Supprimer")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

export default GaleriePage;
