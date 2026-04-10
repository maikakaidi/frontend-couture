import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
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

// 🔥 Nouveau système offline
import { addPendingChange } from "../services/pendingService";
import { startAutoSync, syncAll } from "../services/syncService";

// 🔹 Services Dépenses (SQLite + backend)
import {
  getDepensesLocal,
  fullSyncDepenses,
  upsertDepenseLocal,
  deleteDepenseLocal,
} from "../services/depenseService";

function DepensesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [depenses, setDepenses] = useState([]);
  const [allDepenses, setAllDepenses] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newDepense, setNewDepense] = useState({ titre: "", montant: "", categorie: "" });
  const [editDepense, setEditDepense] = useState(null);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [depenseToDelete, setDepenseToDelete] = useState(null);

  /* ============================================================
     1️⃣ CHARGEMENT INITIAL
     ============================================================= */
  useEffect(() => {
    const fetchDepenses = async () => {
      try {
        if (navigator.onLine) {
          const list = await fullSyncDepenses();
          setDepenses(list);
          setAllDepenses(list);
        } else {
          const localList = await getDepensesLocal();
          setDepenses(localList);
          setAllDepenses(localList);
        }
      } catch (err) {
        console.warn("Erreur chargement dépenses :", err.message);
        const localList = await getDepensesLocal();
        setDepenses(localList);
        setAllDepenses(localList);
      }
    };

    fetchDepenses();

    const handleOnline = () => {
      console.log("🌐 Repassé en ligne → sync + reload");
      syncAll();       // rejoue les actions offline
      fetchDepenses(); // recharge les dépenses
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  /* ============================================================
     2️⃣ SAUVEGARDE LOCALE
     ============================================================= */
  const saveLocalDepenses = (list) => {
    setDepenses(list);
    setAllDepenses(list);
    localStorage.setItem("depenses", JSON.stringify(list));
  };

  /* ============================================================
     3️⃣ AJOUTER UNE DÉPENSE
     ============================================================= */
  const handleAddDepense = async () => {
    if (!newDepense.titre.trim() || !newDepense.montant) {
      alert(t("Titre et montant obligatoires", "Title and amount are required", "العنوان والمبلغ مطلوبان"));
      return;
    }

    const tempId = "local-" + Date.now();
    const depenseToSave = { ...newDepense, _id: tempId };

    saveLocalDepenses([depenseToSave, ...depenses]);
    setNewDepense({ titre: "", montant: "", categorie: "" });
    setShowForm(false);

    if (navigator.onLine) {
      try {
        const res = await api.post("/depenses", newDepense);
        const serverDepense = res.data;
        const updated = depenses.map((d) =>
          d._id === tempId ? serverDepense : d
        );
        saveLocalDepenses(updated);
      } catch (err) {
        console.error("Erreur API ajout dépense:", err);
        await addPendingChange("depenses", "POST", "/depenses", depenseToSave);
      }
    } else {
      await addPendingChange("depenses", "POST", "/depenses", depenseToSave);
    }
  };

  /* ============================================================
     4️⃣ MODIFIER UNE DÉPENSE
     ============================================================= */
  const handleUpdateDepense = async () => {
    if (!editDepense) return;

    const updatedList = depenses.map((d) =>
      d._id === editDepense._id ? editDepense : d
    );
    saveLocalDepenses(updatedList);
    setEditDepense(null);

    if (navigator.onLine) {
      try {
        await api.put(`/depenses/${editDepense._id}`, editDepense);
      } catch (err) {
        console.error("Erreur API update dépense:", err);
        await addPendingChange("depenses", "PUT", `/depenses/${editDepense._id}`, editDepense);
      }
    } else {
      await addPendingChange("depenses", "PUT", `/depenses/${editDepense._id}`, editDepense);
    }
  };

  /* ============================================================
     5️⃣ SUPPRIMER UNE DÉPENSE
     ============================================================= */
  const confirmDeleteDepense = async () => {
    if (!depenseToDelete) return;

    const newList = depenses.filter((d) => d._id !== depenseToDelete._id);
    saveLocalDepenses(newList);

    if (navigator.onLine && !depenseToDelete._id.startsWith("local-")) {
      try {
        await api.delete(`/depenses/${depenseToDelete._id}`);
      } catch (err) {
        console.error("Erreur API delete dépense:", err);
        await addPendingChange("depenses", "DELETE", `/depenses/${depenseToDelete._id}`, { _id: depenseToDelete._id });
      }
    } else {
      await addPendingChange("depenses", "DELETE", `/depenses/${depenseToDelete._id}`, { _id: depenseToDelete._id });
    }

    setOpenConfirm(false);
    setDepenseToDelete(null);
  };

  /* ============================================================
     6️⃣ RECHERCHE
     ============================================================= */
  const filteredDepenses = allDepenses.filter(
    (d) =>
      (d.titre && d.titre.toLowerCase().includes(search.toLowerCase().trim())) ||
      (d.categorie && d.categorie.toLowerCase().includes(search.toLowerCase().trim()))
  );


  // ============================
  // 7️⃣ RENDER
  // ============================
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
        💸 {t("Dépenses", "Expenses", "المصروفات")}
      </Typography>

      <TextField
        fullWidth
        margin="normal"
        label={t("Rechercher une dépense", "Search an expense", "البحث عن مصروف")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {!showForm ? (
        <Button variant="contained" sx={{ mb: 3 }} onClick={() => setShowForm(true)}>
          ➕ {t("Ajouter une dépense", "Add an expense", "إضافة مصروف")}
        </Button>
      ) : (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1">
            {t("Nouvelle dépense", "New expense", "مصروف جديد")}
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            label={t("Titre", "Title", "العنوان")}
            value={newDepense.titre}
            onChange={(e) => setNewDepense({ ...newDepense, titre: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("Montant (FCFA)", "Amount (FCFA)", "المبلغ (فرنك سيفا)")}
            type="number"
            value={newDepense.montant}
            onChange={(e) =>
              setNewDepense({ ...newDepense, montant: e.target.value === "" ? "" : Number(e.target.value) })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("Catégorie", "Category", "الفئة")}
            value={newDepense.categorie}
            onChange={(e) => setNewDepense({ ...newDepense, categorie: e.target.value })}
            helperText={t("Ex: Fournitures, Loyer, Électricité...", "Ex: Supplies, Rent, Electricity...", "مثال: مستلزمات، إيجار، كهرباء...")}
          />

          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleAddDepense}>
              {t("Enregistrer", "Save", "حفظ")}
            </Button>
            <Button sx={{ ml: 2 }} onClick={() => setShowForm(false)}>
              {t("Annuler", "Cancel", "إلغاء")}
            </Button>
          </Box>
        </Paper>
      )}

      {filteredDepenses.length === 0 ? (
        <Typography color="text.secondary">
          {search.trim()
            ? t("Aucune dépense trouvée", "No expense found", "لم يتم العثور على مصروف")
            : t("Aucune dépense enregistrée", "No expenses recorded", "لا توجد مصروفات مسجلة")}
        </Typography>
      ) : (
        filteredDepenses.map((depense) => (
          <Paper key={depense._id} sx={{ p: 2, mb: 2 }}>
            {editDepense && editDepense._id === depense._id ? (
              <>
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("Titre", "Title", "العنوان")}
                  value={editDepense.titre}
                  onChange={(e) => setEditDepense({ ...editDepense, titre: e.target.value })}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("Montant (FCFA)", "Amount (FCFA)", "المبلغ (فرنك سيفا)")}
                  type="number"
                  value={editDepense.montant}
                  onChange={(e) =>
                    setEditDepense({ ...editDepense, montant: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("Catégorie", "Category", "الفئة")}
                  value={editDepense.categorie}
                  onChange={(e) => setEditDepense({ ...editDepense, categorie: e.target.value })}
                />
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleUpdateDepense}>
                    {t("Sauvegarder", "Save", "حفظ")}
                  </Button>
                  <Button sx={{ ml: 2 }} onClick={() => setEditDepense(null)}>
                    {t("Annuler", "Cancel", "إلغاء")}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="h6">{depense.titre}</Typography>
                <Typography>
                  💰 {t("Montant", "Amount", "المبلغ")}: {depense.montant} {t("FCFA", "FCFA", "فرنك سيفا")}
                </Typography>
                <Typography>
                  📂 {t("Catégorie", "Category", "الفئة")}:{" "}
                  {depense.categorie || t("Non spécifiée", "Not specified", "غير محدد")}
                </Typography>
                <Typography>
                  📅 {t("Date", "Date", "التاريخ")}:{" "}
                  {new Date(depense.dateDepense).toLocaleDateString()}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Button sx={{ mr: 2 }} onClick={() => setEditDepense(depense)}>
                    ✏️ {t("Modifier", "Edit", "تعديل")}
                  </Button>
                  <Button
                    color="error"
                    onClick={() => {
                      setDepenseToDelete(depense);
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

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>{t("Confirmation", "Confirmation", "تأكيد")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("Es-tu sûr de vouloir supprimer la dépense", "Are you sure you want to delete the expense", "هل أنت متأكد من حذف المصروف")}{" "}
            <b>{depenseToDelete?.titre}</b> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>
            {t("Annuler", "Cancel", "إلغاء")}
          </Button>
          <Button color="error" onClick={confirmDeleteDepense}>
            {t("Supprimer", "Delete", "حذف")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DepensesPage;
