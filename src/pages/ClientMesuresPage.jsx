import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";

// 🔥 Services SQLite (comme EmployeesPage)
import {
  getMesuresLocal,
  fullSyncMesures,
  upsertMesureLocal,
  deleteMesureLocal,
} from "../services/clientMesuresService";
import { addPendingChange } from "../services/pendingService";
import { syncAll } from "../services/syncService";

function ClientMesuresPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clientId } = useParams();

  const [client, setClient] = useState(null);
  const [mesures, setMesures] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [newMesure, setNewMesure] = useState({
    type: "",
    valeur: "",
  });

  // Chargement initial (exactement comme EmployeesPage)
  useEffect(() => {
    if (!clientId) return;

    const fetchMesures = async () => {
      try {
        if (navigator.onLine) {
          const serverList = await fullSyncMesures(clientId);
          setMesures(serverList);

          // Charger les infos du client
          const res = await api.get(`/clients/${clientId}`);
          setClient(res.data || null);
        } else {
          const localList = await getMesuresLocal(clientId);
          setMesures(localList);

          const savedClient = localStorage.getItem(`client_${clientId}`);
          if (savedClient) setClient(JSON.parse(savedClient));
        }
      } catch (err) {
        console.warn("Erreur chargement mesures :", err.message);
        const localList = await getMesuresLocal(clientId);
        setMesures(localList);
      }
    };

    fetchMesures();

    const handleOnline = () => {
      console.log("🌐 Repassé en ligne → sync + reload");
      syncAll();
      fetchMesures();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [clientId]);

  // Ajout / Modification (logique identique à handleAddEmp)
  const handleSaveMesure = async () => {
    if (!newMesure.type.trim() || !newMesure.valeur.trim()) {
      alert(t("Type et valeur obligatoires", "Type and value are required", "النوع والقيمة مطلوبان"));
      return;
    }

    try {
      const mesureToSave = { ...newMesure, clientId };

      if (editId) {
        // Mise à jour
        const res = await api.put(`/mesures/${editId}`, mesureToSave);
        const updated = res.data.mesure || res.data;
        await upsertMesureLocal(updated);

        setMesures((prev) =>
          prev.map((m) => (m._id === editId ? updated : m))
        );
      } else {
        // Création
        const res = await api.post(`/mesures/${clientId}`, mesureToSave);
        const newMes = res.data.mesure || res.data;
        await upsertMesureLocal(newMes);

        setMesures((prev) => [newMes, ...prev]);
      }

      setNewMesure({ type: "", valeur: "" });
      setShowForm(false);
      setEditId(null);
    } catch (err) {
      console.warn("Backend inaccessible, sauvegarde offline…", err.message);

      const tempId = editId || "local-" + Date.now();
      const mesureToSave = {
        _id: tempId,
        ...newMesure,
        clientId,
        createdAt: new Date().toISOString(),
      };

      await upsertMesureLocal(mesureToSave);
      await addPendingChange(
        "mesures",
        editId ? "PUT" : "POST",
        editId ? `/mesures/( {editId}` : `/mesures/ ){clientId}`,
        mesureToSave
      );

      setMesures((prev) =>
        editId
          ? prev.map((m) => (m._id === editId ? mesureToSave : m))
          : [mesureToSave, ...prev]
      );

      setNewMesure({ type: "", valeur: "" });
      setShowForm(false);
      setEditId(null);
    }
  };

  // Suppression
  const handleDeleteMesure = async (id) => {
    if (!window.confirm(t("Confirmer la suppression ?", "Confirm deletion?", "تأكيد الحذف؟"))) return;

    try {
      await api.delete(`/mesures/${id}`);
      await deleteMesureLocal(id);

      setMesures((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Erreur suppression mesure :", err);
      await deleteMesureLocal(id);
      await addPendingChange("mesures", "DELETE", `/mesures/${id}`, { _id: id });

      setMesures((prev) => prev.filter((m) => m._id !== id));
    }
  };

  const handleEditMesure = (m) => {
    setNewMesure({ type: m.type || "", valeur: m.valeur || "" });
    setEditId(m._id);
    setShowForm(true);
  };

  return (
    <Box sx={{ p: 3, position: "relative" }}>
      <IconButton
        onClick={() => navigate(-1)}
        sx={{ position: "absolute", top: 16, left: 16, zIndex: 1000, bgcolor: "background.paper", boxShadow: 2 }}
      >
        <ArrowBackIcon />
      </IconButton>

      {client && (
        <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
          📏 {t("Mesures de", "Measurements of", "مقاييس")} {client.nom}
        </Typography>
      )}

      {!showForm ? (
        <>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button variant="contained" onClick={() => setShowForm(true)}>
              ➕ {t("Ajouter une mesure", "Add measurement", "إضافة مقياس")}
            </Button>
          </Box>

          <Paper sx={{ p: 2 }}>
            {mesures.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                {t("Aucune mesure enregistrée", "No measurements recorded", "لا توجد مقاييس مسجلة")}
              </Typography>
            ) : (
              mesures.map((m) => (
                <Paper key={m._id} sx={{ p: 2, mb: 2 }}>
                  <Typography fontWeight="bold">{m.type}</Typography>
                  <Typography>{m.valeur} cm</Typography>

                  <Box sx={{ mt: 2 }}>
                    <Button onClick={() => handleEditMesure(m)}>
                      ✏️ {t("Modifier", "Edit", "تعديل")}
                    </Button>
                    <Button
                      color="error"
                      sx={{ ml: 2 }}
                      onClick={() => handleDeleteMesure(m._id)}
                    >
                      🗑️ {t("Supprimer", "Delete", "حذف")}
                    </Button>
                  </Box>
                </Paper>
              ))
            )}
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editId
              ? t("Modifier mesure", "Edit measurement", "تعديل")
              : t("Nouvelle mesure", "New measurement", "مقياس جديد")}
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            label={t("Type", "Type", "النوع")}
            value={newMesure.type}
            onChange={(e) => setNewMesure({ ...newMesure, type: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            type="number"
            label={t("Valeur (cm)", "Value (cm)", "القيمة (سم)")}
            value={newMesure.valeur}
            onChange={(e) => setNewMesure({ ...newMesure, valeur: e.target.value })}
          />

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleSaveMesure}>
              {t("Enregistrer", "Save", "حفظ")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setNewMesure({ type: "", valeur: "" });
              }}
            >
              {t("Annuler", "Cancel", "إلغاء")}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default ClientMesuresPage;
