import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import jsPDF from "jspdf";
import api from "../api";
import { getImageUrl } from "../config";
import { useTranslation } from "../hooks/useTranslation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Services (tes anciens fichiers, inchangés)
import {
  getCommandesLocal,
  fullSyncCommandes,
  upsertCommandeLocal,
  deleteCommandeLocal,
} from "../services/commandeService";
import { addPendingChange } from "../services/pendingService";
import { syncAll } from "../services/syncService";

// ====================== HELPERS IMAGE (localStorage) ======================
const saveImageBase64 = (commandeId, base64) => {
  if (base64) localStorage.setItem(`commande_image_${commandeId}`, base64);
};

const getImageBase64 = (commandeId) => {
  return localStorage.getItem(`commande_image_${commandeId}`);
};

const removeImageBase64 = (commandeId) => {
  localStorage.removeItem(`commande_image_${commandeId}`);
};

// ====================== COMPRESSION IMAGE (NOUVEAU) ======================
const compressImage = (file, maxWidth = 800, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertit en base64 compressé (JPEG)
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

function CommandesPage() {
  const { t } = useTranslation();
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [commandes, setCommandes] = useState([]);
  const [allCommandes, setAllCommandes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [notif, setNotif] = useState({ message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [clientNom, setClientNom] = useState("Client");

  const [currentCommande, setCurrentCommande] = useState({
    description: "",
    montant: "",
    acompte: "",
    rdv: "",
    image: null,
    preview: null,
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isSousUser = user?.role === "sous_user";

  useEffect(() => {
    if (!clientId) return;

    const fetchCommandes = async () => {
      try {
        let list = [];
        if (navigator.onLine) {
          list = await fullSyncCommandes(clientId);
        } else {
          list = await getCommandesLocal(clientId);
        }

        const enriched = list.map((c) => {
          const base64 = getImageBase64(c._id);
          if (base64) return { ...c, preview: base64 };
          return c;
        });

        setCommandes(enriched);
        setAllCommandes(enriched);
      } catch (err) {
        const localList = await getCommandesLocal(clientId);
        const enriched = localList.map((c) => {
          const base64 = getImageBase64(c._id);
          if (base64) return { ...c, preview: base64 };
          return c;
        });
        setCommandes(enriched);
        setAllCommandes(enriched);
      }

      const savedClient = localStorage.getItem(`client_${clientId}`);
      if (savedClient) {
        setClientNom(JSON.parse(savedClient).nom || "Client inconnu");
      }
    };

    fetchCommandes();

    const handleOnline = () => {
      fetchCommandes();
      syncAll();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [clientId]);

  const remaining = (c) => (Number(c.montant) || 0) - (Number(c.acompte) || 0);

  const handleWhatsApp = (num) => num && window.open(`https://wa.me/${num}`, "_blank");
  const handleCall = (num) => num && (window.location.href = `tel:${num}`);

  const handleDownloadReceipt = (c) => {
    const doc = new jsPDF();
    doc.text(t("Reçu de paiement", "Payment Receipt", "إيصال الدفع"), 20, 20);
    doc.text(`${t("Client", "Client", "العميل")}: ${clientNom}`, 20, 40);
    doc.text(`${t("Montant", "Amount", "المبلغ")}: ${c.montant} FCFA`, 20, 50);
    doc.text(`${t("Acompte", "Deposit", "الدفعة المقدمة")}: ${c.acompte} FCFA`, 20, 60);
    doc.text(`${t("Reste", "Remaining", "الباقي")}: ${remaining(c)} FCFA`, 20, 70);
    doc.text(`${t("RDV", "Appointment", "موعد")}: ${dayjs(c.rdv).format("DD/MM/YYYY")}`, 20, 80);
    doc.save(`recu_${c._id || "commande"}.pdf`);
  };

  // ==================== NOUVELLE FONCTION AVEC COMPRESSION ====================
  const handleFileChange = async (file) => {
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file, 800, 0.75); // 800px max, 75% qualité
      setCurrentCommande((prev) => ({
        ...prev,
        image: file,
        preview: compressedBase64,
      }));
    } catch (e) {
      console.error("Erreur compression image", e);
      alert("Impossible de compresser l'image");
    }
  };

  const handleSaveCommande = async () => {
    if (!currentCommande.description.trim() || !currentCommande.montant) {
      alert(t("Description et montant obligatoires", "Description and amount are required", "الوصف والمبلغ مطلوبان"));
      return;
    }

    try {
      // Mode en ligne (inchangé)
      const formData = new FormData();
      formData.append("description", currentCommande.description);
      formData.append("montant", currentCommande.montant);
      formData.append("acompte", currentCommande.acompte || 0);
      formData.append("rdv", currentCommande.rdv || "");
      formData.append("clientId", clientId);
      formData.append("atelierId", localStorage.getItem("atelierId"));

      if (currentCommande.image) {
        formData.append("commandeImage", currentCommande.image);
      }

      let serverCommande;
      if (editId) {
        const res = await api.put(`/commandes/${editId}`, formData);
        serverCommande = res.data;
      } else {
        const res = await api.post("/commandes", formData);
        serverCommande = res.data;
      }

      const commande = serverCommande.commande || serverCommande;
      await upsertCommandeLocal(commande);

      setCommandes((prev) => (editId ? prev.map((c) => (c._id === editId ? commande : c)) : [commande, ...prev]));
      setAllCommandes((prev) => (editId ? prev.map((c) => (c._id === editId ? commande : c)) : [commande, ...prev]));

      setNotif({ message: t("Commande enregistrée", "Order saved", "تم حفظ الطلب"), severity: "success" });
      resetForm();
    } catch (err) {
      // Mode hors connexion
      console.warn("Backend inaccessible, sauvegarde offline…", err.message);

      const tempId = editId || "local-" + Date.now();

      const commandeToSave = {
        _id: tempId,
        description: currentCommande.description,
        montant: currentCommande.montant,
        acompte: currentCommande.acompte || 0,
        rdv: currentCommande.rdv || null,
        clientId,
        clientNom,
        createdAt: new Date().toISOString(),
      };

      await upsertCommandeLocal(commandeToSave);
      await addPendingChange("commandes", editId ? "PUT" : "POST", editId ? `/commandes/${editId}` : "/commandes", commandeToSave);

      // Sauvegarde de l’image compressée
      if (currentCommande.preview) {
        saveImageBase64(tempId, currentCommande.preview);
      }

      const commandeWithImage = { ...commandeToSave, preview: currentCommande.preview };

      setCommandes((prev) => (editId ? prev.map((c) => (c._id === editId ? commandeWithImage : c)) : [commandeWithImage, ...prev]));
      setAllCommandes((prev) => (editId ? prev.map((c) => (c._id === editId ? commandeWithImage : c)) : [commandeWithImage, ...prev]));

      setNotif({ message: "📴 Commande enregistrée hors connexion", severity: "warning" });
      resetForm();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setCurrentCommande({ description: "", montant: "", acompte: "", rdv: "", image: null, preview: null });
  };

  const handleDeleteCommande = async () => {
    const id = deleteDialog.id;
    try {
      await api.delete(`/commandes/${id}`);
      await deleteCommandeLocal(id);
    } catch (err) {
      await deleteCommandeLocal(id);
      await addPendingChange("commandes", "DELETE", `/commandes/${id}`, { _id: id });
    } finally {
      removeImageBase64(id);
      setCommandes((prev) => prev.filter((c) => c._id !== id));
      setAllCommandes((prev) => prev.filter((c) => c._id !== id));
      setDeleteDialog({ open: false, id: null });
      setNotif({ message: t("Commande supprimée", "Order deleted", "تم حذف الطلب"), severity: "success" });
    }
  };

  const getCommandeImage = (c) => {
    if (c.preview) return c.preview;
    if (c.image && typeof c.image === "string") return getImageUrl(c.image);
    return null;
  };

  return (
    <Box sx={{ p: 3, position: "relative" }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{ position: "absolute", top: 16, left: 16, zIndex: 1000, bgcolor: "background.paper", boxShadow: 2 }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
        {t("Commandes", "Orders", "الطلبات")}
      </Typography>

      {!showForm && !isSousUser && (
        <Button variant="contained" sx={{ mb: 3, display: "block", mx: "auto" }} onClick={() => setShowForm(true)}>
          + {t("Nouvelle commande", "New order", "طلب جديد")}
        </Button>
      )}

      <Snackbar open={!!notif.message} autoHideDuration={4000} onClose={() => setNotif({ message: "", severity: "success" })}>
        <Alert severity={notif.severity} sx={{ width: "100%" }}>
          {notif.message}
        </Alert>
      </Snackbar>

      {!showForm ? (
        commandes.length === 0 ? (
          <Alert severity="info">
            {t("Aucune commande pour ce client", "No orders for this client", "لا توجد طلبات لهذا العميل")}
          </Alert>
        ) : (
          commandes.map((c) => (
            <Paper key={c._id} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                {c.clientNom || clientNom || c.clientId?.nom || t("Client inconnu", "Unknown client", "عميل غير معروف")}
              </Typography>
              <Typography>📝 {c.description}</Typography>
              <Typography>💰 {t("Total", "Total", "الإجمالي")}: {c.montant} FCFA</Typography>
              <Typography>💸 {t("Acompte", "Deposit", "الدفعة المقدمة")}: {c.acompte} FCFA</Typography>
              <Typography color="error">💳 {t("Reste", "Remaining", "الباقي")}: {remaining(c)} FCFA</Typography>
              <Typography>📅 {t("RDV", "Appointment", "موعد")}: {dayjs(c.rdv).format("DD MMMM YYYY")}</Typography>

              {/* Gestion image offline + online */}
              {c.preview ? (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <img src={c.preview} alt="Aperçu" style={{ width: "25%", maxHeight: "90px", objectFit: "cover", borderRadius: 12 }} />
                </Box>
              ) : c.image && typeof c.image === "string" ? (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <img src={getImageUrl(c.image)} alt="Image commande" style={{ width: "25%", maxHeight: "90px", objectFit: "cover", borderRadius: 12 }} />
                </Box>
              ) : (
                <Typography color="text.secondary">📸 Image enregistrée (visible une fois en ligne)</Typography>
              )}

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                <Button variant="outlined" startIcon={<FaWhatsapp />} onClick={() => handleWhatsApp(c.clientId?.telephone)}>
                  WhatsApp
                </Button>
                <Button variant="outlined" startIcon={<FaPhone />} onClick={() => handleCall(c.clientId?.telephone)}>
                  {t("Appeler", "Call", "اتصال")}
                </Button>

                {!isSousUser && (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditId(c._id);
                        setCurrentCommande({
                          description: c.description,
                          montant: c.montant,
                          acompte: c.acompte,
                          rdv: dayjs(c.rdv).format("YYYY-MM-DD"),
                          image: null,
                          preview: c.image && typeof c.image === "string" ? getImageUrl(c.image) : null,
                        });
                        setShowForm(true);
                      }}
                    >
                      {t("Modifier", "Edit", "تعديل")}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, id: c._id })}
                    >
                      {t("Supprimer", "Delete", "حذف")}
                    </Button>
                  </>
                )}

                <Button variant="contained" color="primary" onClick={() => handleDownloadReceipt(c)}>
                  {t("Télécharger reçu", "Download receipt", "تحميل الإيصال")}
                </Button>
              </Box>
            </Paper>
          ))
        )
      ) : (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {editId ? t("Modifier la commande", "Edit order", "تعديل الطلب") : t("Nouvelle commande", "New order", "طلب جديد")}
          </Typography>

          <TextField fullWidth label={t("Description", "Description", "الوصف")} multiline rows={3} value={currentCommande.description} onChange={(e) => setCurrentCommande({ ...currentCommande, description: e.target.value })} sx={{ mb: 2 }} />

          <TextField fullWidth label={t("Montant total (FCFA)", "Total amount (FCFA)", "المبلغ الإجمالي (فرنك سيفا)")} type="number" value={currentCommande.montant} onChange={(e) => setCurrentCommande({ ...currentCommande, montant: e.target.value })} sx={{ mb: 2 }} />

          <TextField fullWidth label={t("Acompte (FCFA)", "Deposit (FCFA)", "الدفعة المقدمة (فرنك سيفا)")} type="number" value={currentCommande.acompte} onChange={(e) => setCurrentCommande({ ...currentCommande, acompte: e.target.value })} sx={{ mb: 2 }} />

          <TextField fullWidth label={t("Date RDV", "Appointment date", "تاريخ الموعد")} type="date" InputLabelProps={{ shrink: true }} value={currentCommande.rdv} onChange={(e) => setCurrentCommande({ ...currentCommande, rdv: e.target.value })} sx={{ mb: 2 }} />

          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files[0])} style={{ marginBottom: 16, display: "block" }} />

          {currentCommande.preview && (
            <Box sx={{ mb: 2 }}>
              <img src={currentCommande.preview} alt="Aperçu" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8 }} />
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleSaveCommande}>
              {t("Enregistrer", "Save", "حفظ")}
            </Button>
            <Button variant="outlined" onClick={resetForm}>
              {t("Annuler", "Cancel", "إلغاء")}
            </Button>
          </Box>
        </Paper>
      )}

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>{t("Confirmer la suppression", "Confirm deletion", "تأكيد الحذف")}</DialogTitle>
        <DialogContent>
          {t("Êtes-vous sûr de vouloir supprimer cette commande ?", "Are you sure you want to delete this order?", "هل أنت متأكد من حذف هذا الطلب؟")}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            {t("Annuler", "Cancel", "إلغاء")}
          </Button>
          <Button color="error" onClick={handleDeleteCommande}>
            {t("Supprimer", "Delete", "حذف")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CommandesPage;
