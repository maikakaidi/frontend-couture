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
} from "@mui/material";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import jsPDF from "jspdf";
import api from "../api";
import { getImageUrl } from "../config";
import { useTranslation } from "../hooks/useTranslation";

function CommandesPage() {
  const { t } = useTranslation();
  const { clientId } = useParams();

  const [commandes, setCommandes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [notif, setNotif] = useState({ message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

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

  // Charger les commandes
  useEffect(() => {
    const fetchCommandes = async () => {
      try {
        const res = await api.get(`/commandes/${clientId}`);
        setCommandes(res.data);
      } catch (err) {
        console.error(
          t("Erreur chargement commandes", "Error loading orders", "خطأ تحميل الطلبات"),
          err.response?.data || err.message
        );
        setNotif({
          message: t("Impossible de charger les commandes", "Unable to load orders", "غير قادر على تحميل الطلبات"),
          severity: "error",
        });
      }
    };
    if (clientId) fetchCommandes();
  }, [clientId, t]); // ← t ajouté → warning parti

  const handleFileChange = (file) => {
    if (!file) return;
    setCurrentCommande((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const handleSaveCommande = async () => {
    if (!currentCommande.description.trim() || !currentCommande.montant || !currentCommande.rdv) {
      setNotif({
        message: t("Champs obligatoires manquants", "Required fields missing", "الحقول الإلزامية مفقودة"),
        severity: "warning",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("description", currentCommande.description);
      formData.append("montant", currentCommande.montant);
      formData.append("acompte", currentCommande.acompte || 0);
      formData.append("rdv", currentCommande.rdv);
      formData.append("clientId", clientId);
      formData.append("atelierId", user.atelierId);

      if (currentCommande.image) {
        formData.append("commandeImage", currentCommande.image);
      }

      let res;
      if (editId) {
        res = await api.put(`/commandes/${editId}`, formData);
        setCommandes((prev) =>
          prev.map((c) => (c._id === editId ? res.data : c))
        );
      } else {
        res = await api.post("/commandes", formData);
        setCommandes((prev) => [res.data, ...prev]);
      }

      setCurrentCommande({
        description: "",
        montant: "",
        acompte: "",
        rdv: "",
        image: null,
        preview: null,
      });
      setShowForm(false);
      setEditId(null);
      setNotif({
        message: t("Commande enregistrée", "Order saved", "تم حفظ الطلب"),
        severity: "success",
      });
    } catch (err) {
      console.error(
        t("Erreur sauvegarde", "Save error", "خطأ الحفظ"),
        err.response?.data || err.message
      );
      setNotif({
        message: t("Erreur lors de l'enregistrement", "Error during saving", "خطأ أثناء الحفظ"),
        severity: "error",
      });
    }
  };

  const handleDeleteCommande = async () => {
    try {
      await api.delete(`/commandes/${deleteDialog.id}`);
      setCommandes((prev) => prev.filter((c) => c._id !== deleteDialog.id));
      setDeleteDialog({ open: false, id: null });
      setNotif({
        message: t("Commande supprimée", "Order deleted", "تم حذف الطلب"),
        severity: "success",
      });
    } catch (err) {
      console.error(
        t("Erreur suppression", "Deletion error", "خطأ الحذف"),
        err.response?.data || err.message
      );
      setNotif({
        message: t("Erreur suppression", "Deletion error", "خطأ الحذف"),
        severity: "error",
      });
    }
  };

  const remaining = (c) => (Number(c.montant) || 0) - (Number(c.acompte) || 0);

  const handleWhatsApp = (num) => {
    if (num) window.open(`https://wa.me/${num}`, "_blank");
  };

  const handleCall = (num) => {
    if (num) window.location.href = `tel:${num}`;
  };

  const handleDownloadReceipt = (c) => {
    const doc = new jsPDF();
    doc.text(t("Reçu de paiement", "Payment Receipt", "إيصال الدفع"), 20, 20);
    doc.text(`${t("Client", "Client", "العميل")}: ${c.clientId?.nom || t("Inconnu", "Unknown", "غير معروف")}`, 20, 40);
    doc.text(`${t("Montant", "Amount", "المبلغ")}: ${c.montant} FCFA`, 20, 50);
    doc.text(`${t("Acompte", "Deposit", "الدفعة المقدمة")}: ${c.acompte} FCFA`, 20, 60);
    doc.text(`${t("Reste", "Remaining", "الباقي")}: ${remaining(c)} FCFA`, 20, 70);
    doc.text(`${t("RDV", "Appointment", "موعد")}: ${dayjs(c.rdv).format("DD/MM/YYYY")}`, 20, 80);
    doc.save(`recu_${c._id}.pdf`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t("Commandes", "Orders", "الطلبات")}
      </Typography>

            {/* Bouton Retour - Ajouté ici */}
      <Button 
        variant="outlined" 
        onClick={() => window.history.back()}
        sx={{ mb: 3, mr: 2 }}
      >
        ← {t("Retour", "Back", "رجوع")}
      </Button>


      {!showForm && !isSousUser && (
        <Button variant="contained" sx={{ mb: 3 }} onClick={() => setShowForm(true)}>
          + {t("Nouvelle commande", "New order", "طلب جديد")}
        </Button>
      )}

      <Snackbar
        open={!!notif.message}
        autoHideDuration={4000}
        onClose={() => setNotif({ message: "", severity: "success" })}
      >
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
                {c.clientId?.nom || t("Client inconnu", "Unknown client", "عميل غير معروف")}
              </Typography>

              <Typography>📝 {c.description}</Typography>
              <Typography>💰 {t("Total", "Total", "الإجمالي")}: {c.montant} {t("FCFA", "FCFA", "فرنك سيفا")}</Typography>
              <Typography>💸 {t("Acompte", "Deposit", "الدفعة المقدمة")}: {c.acompte} {t("FCFA", "FCFA", "فرنك سيفا")}</Typography>
              <Typography color="error">💳 {t("Reste", "Remaining", "الباقي")}: {remaining(c)} {t("FCFA", "FCFA", "فرنك سيفا")}</Typography>
              <Typography>📅 {t("RDV", "Appointment", "موعد")}: {dayjs(c.rdv).format("DD MMMM YYYY")}</Typography>

              {c.image && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <img
                    src={getImageUrl(c.image)}
                    alt={t("Image commande", "Order image", "صورة الطلب")}
                    style={{
                      width: "25%",
                      maxHeight: "90px",
                      objectFit: "cover",
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x180?text=Photo+introuvable";
                    }}
                  />
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<FaWhatsapp />}
                  onClick={() => handleWhatsApp(c.clientId?.telephone)}
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FaPhone />}
                  onClick={() => handleCall(c.clientId?.telephone)}
                >
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
                          preview: c.image ? getImageUrl(c.image) : null,
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

          <TextField
            fullWidth
            label={t("Description", "Description", "الوصف")}
            multiline
            rows={3}
            value={currentCommande.description}
            onChange={(e) =>
              setCurrentCommande({ ...currentCommande, description: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={t("Montant total (FCFA)", "Total amount (FCFA)", "المبلغ الإجمالي (فرنك سيفا)")}
            type="number"
            value={currentCommande.montant}
            onChange={(e) =>
              setCurrentCommande({ ...currentCommande, montant: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={t("Acompte (FCFA)", "Deposit (FCFA)", "الدفعة المقدمة (فرنك سيفا)")}
            type="number"
            value={currentCommande.acompte}
            onChange={(e) =>
              setCurrentCommande({ ...currentCommande, acompte: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={t("Date RDV", "Appointment date", "تاريخ الموعد")}
            type="date"
            InputLabelProps={{ shrink: true }}
            value={currentCommande.rdv}
            onChange={(e) =>
              setCurrentCommande({ ...currentCommande, rdv: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files[0])}
            style={{ marginBottom: 16, display: "block" }}
          />

          {currentCommande.preview && (
            <Box sx={{ mb: 2 }}>
              <img
                src={currentCommande.preview}
                alt={t("Aperçu", "Preview", "معاينة")}
                style={{
                  width: "100%",
                  maxHeight: 180,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleSaveCommande}>
              {t("Enregistrer", "Save", "حفظ")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
            >
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
