import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";

// 🔥 Services SQLite (comme dans EmployeesPage)
import {
  getClientsLocal,
  fullSyncClients,
  upsertClientLocal,
  deleteClientLocal,
} from "../services/clientService";
import { addPendingChange } from "../services/pendingService";
import { syncAll } from "../services/syncService";

function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [newClient, setNewClient] = useState({ nom: "", telephone: "", adresse: "" });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Chargement initial (exactement comme EmployeesPage)
  useEffect(() => {
    const fetchClients = async () => {
      try {
        if (navigator.onLine) {
          const list = await fullSyncClients();
          setClients(list);
          setAllClients(list);
        } else {
          const localList = await getClientsLocal();
          setClients(localList);
          setAllClients(localList);
        }
      } catch (err) {
        console.warn("Erreur chargement clients :", err.message);
        const localList = await getClientsLocal();
        setClients(localList);
        setAllClients(localList);
      }
    };

    fetchClients();

    const handleOnline = () => {
      console.log("🌐 Repassé en ligne - sync + reload");
      syncAll();
      fetchClients();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Ajout client (logique identique à handleAddEmp)
  const handleAddClient = async () => {
    if (!newClient.nom.trim() || !newClient.telephone.trim()) {
      alert(t("Nom et téléphone obligatoires", "Name and phone are required", "الاسم ورقم الهاتف مطلوبان"));
      return;
    }

    try {
      // Tentative backend
      const payload = { ...newClient, atelierId: localStorage.getItem("atelierId") };
      const res = await api.post("/clients", payload);
      const client = res.data?.client || res.data;

      await upsertClientLocal(client);

      const newList = [client, ...clients];
      setClients(newList);
      setAllClients(newList);

      setNewClient({ nom: "", telephone: "", adresse: "" });
      setShowForm(false);
    } catch (err) {
      console.warn("Backend inaccessible, ajout offline…", err.message);

      const tempId = "local-" + Date.now();
      const client = {
        _id: tempId,
        ...newClient,
        atelierId: localStorage.getItem("atelierId"),
        createdAt: new Date().toISOString(),
      };

      await upsertClientLocal(client);
      await addPendingChange("clients", "POST", "/clients", { ...newClient, atelierId: localStorage.getItem("atelierId") });

      const newList = [client, ...clients];
      setClients(newList);
      setAllClients(newList);

      setNewClient({ nom: "", telephone: "", adresse: "" });
      setShowForm(false);
    }
  };

  // Suppression
  const handleDeleteClient = async (id) => {
    if (!window.confirm(t("Voulez-vous vraiment supprimer ce client ?", "Do you really want to delete this client?", "هل تريد حقًا حذف هذا العميل؟")))
      return;

    try {
      await api.delete(`/clients/${id}`);
      await deleteClientLocal(id);

      const newList = clients.filter((c) => c._id !== id);
      setClients(newList);
      setAllClients(newList);
    } catch (err) {
      console.error("Erreur suppression client :", err);
      await deleteClientLocal(id);
      await addPendingChange("clients", "DELETE", `/clients/${id}`, { _id: id });

      const newList = clients.filter((c) => c._id !== id);
      setClients(newList);
      setAllClients(newList);
    }
  };

  // Recherche
  const filteredClients = allClients.filter(
    (c) =>
      (c.nom && c.nom.toLowerCase().includes(search.toLowerCase().trim())) ||
      (c.telephone && c.telephone.includes(search.trim()))
  );

  return (
    <Box sx={{ p: 0 }}>
      <AppBar position="static" sx={{ backgroundColor: "#0D47A1" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6">👥 {t("Clients", "Clients", "العملاء")}</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {!showForm ? (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, alignItems: "center" }}>
              <TextField
                fullWidth
                label={t("Rechercher", "Search", "بحث")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mr: 2 }}
              />

              <Button
                variant="contained"
                sx={{ backgroundColor: "#E65100" }}
                onClick={() => setShowForm(true)}
              >
                ➕ {t("Ajouter", "Add", "إضافة")}
              </Button>
            </Box>

            {filteredClients.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                {search ? "Aucun client trouvé" : "Aucun client enregistré"}
              </Typography>
            ) : (
              filteredClients.map((client) => {
                const cid = client._id;
                return (
                  <Paper key={cid} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6">
                      {client.nom} {!client._id?.startsWith("local-") ? "" : " 📴"}
                    </Typography>
                    <Typography>📞 {client.telephone}</Typography>
                    {client.adresse && <Typography>📍 {client.adresse}</Typography>}

                    <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button variant="outlined" onClick={() => navigate(`/clients/${cid}/mesures`)}>
                        {t("Voir mesures", "Measurements", "المقاييس")}
                      </Button>
                      <Button variant="outlined" onClick={() => navigate(`/commandes/${cid}`)}>
                        {t("Voir commandes", "Orders", "الطلبات")}
                      </Button>

                      <Button 
                        color="error" 
                        variant="outlined" 
                        onClick={() => handleDeleteClient(cid)}
                      >
                        {t("Supprimer", "Delete", "حذف")}
                      </Button>
                    </Box>
                  </Paper>
                );
              })
            )}
          </>
        ) : (
          <Paper sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
            <Typography variant="h6">➕ {t("Nouveau client", "New client", "عميل جديد")}</Typography>

            <TextField fullWidth margin="normal" label={t("Nom", "Name", "الاسم")} value={newClient.nom} onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })} />
            <TextField fullWidth margin="normal" label={t("Téléphone", "Phone", "الهاتف")} value={newClient.telephone} onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })} />
            <TextField fullWidth margin="normal" label={t("Adresse (optionnel)", "Address (optional)", "العنوان (اختياري)")} value={newClient.adresse || ""} onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })} />

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button variant="contained" sx={{ backgroundColor: "#E65100" }} onClick={handleAddClient}>
                {t("Enregistrer", "Save", "حفظ")}
              </Button>
              <Button variant="outlined" onClick={() => setShowForm(false)}>
                {t("Annuler", "Cancel", "إلغاء")}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default ClientsPage;
