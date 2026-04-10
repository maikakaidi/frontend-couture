import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,           // ← ajouté pour la flèche
} from "@mui/material";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // ← ajouté
import { useNavigate } from "react-router-dom"; // ← ajouté

function VentesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate(); // ← ajouté pour la flèche retour

  const [ventes, setVentes] = useState([]);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // Charger toutes les ventes
  useEffect(() => {
    api.get("/ventes")
      .then(res => setVentes(res.data))
      .catch(err => console.error("❌ Erreur chargement ventes:", err));
  }, []);

  // ✅ Recherche
  const handleSearch = async () => {
    try {
      const res = await api.get(`/ventes/search/${search}`);
      setVentes(res.data);
    } catch (err) {
      console.error("❌ Erreur recherche vente:", err.response?.data || err.message);
    }
  };

  // ✅ Historique par mois
  const handleHistorique = async () => {
    try {
      const res = await api.get(`/ventes/historique/( {year}/ ){month}`);
      setVentes(res.data);
    } catch (err) {
      console.error("❌ Erreur historique ventes:", err.response?.data || err.message);
    }
  };

  // ✅ Calcul du chiffre d’affaires total
  const totalVentes = ventes.reduce((acc, v) => acc + v.prixTotal, 0);

  return (
    <Box sx={{ p: 3, position: "relative" }}>
      {/* Flèche retour en haut à gauche */}
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

      {/* Titre + emoji centré au milieu */}
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
        📊 {t("Ventes", "Sales", "المبيعات")}
      </Typography>

      {/* Recherche */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label={t("Rechercher par article ou catégorie", "Search by item or category", "البحث حسب المادة أو الفئة")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="contained" onClick={handleSearch}>
          🔍 {t("Rechercher", "Search", "بحث")}
        </Button>
      </Box>

      {/* Historique par mois */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label={t("Année", "Year", "السنة")}
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
        <TextField
          label={t("Mois", "Month", "الشهر")}
          type="number"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        />
        <Button variant="contained" onClick={handleHistorique}>
          📅 {t("Historique", "History", "السجل")}
        </Button>
      </Box>

      {/* Liste des ventes */}
      {ventes.length === 0 ? (
        <Typography>
          {t("Aucune vente trouvée", "No sales found", "لم يتم العثور على مبيعات")}
        </Typography>
      ) : (
        ventes.map((vente) => (
          <Paper key={vente._id} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{vente.nom}</Typography>
            <Typography>
              {t("Catégorie", "Category", "الفئة")}: {vente.categorie}
            </Typography>
            <Typography>
              💰 {t("Prix unitaire", "Unit price", "سعر الوحدة")}: {vente.prixUnitaire} FCFA
            </Typography>
            <Typography>
              ✅ {t("Quantité vendue", "Quantity sold", "الكمية المباعة")}: {vente.vendu}
            </Typography>
            <Typography>
              💵 {t("Total", "Total", "الإجمالي")}: {vente.prixTotal} FCFA
            </Typography>
            <Typography>
              📅 {t("Date", "Date", "التاريخ")}:{" "}
              {vente.dateAjout
                ? new Date(vente.dateAjout).toLocaleDateString()
                : t("Non disponible", "Not available", "غير متوفر")}
            </Typography>
          </Paper>
        ))
      )}

      <Typography variant="h5" sx={{ mt: 3 }}>
        📈 {t("Chiffre d’affaires global", "Total turnover", "إجمالي الأرباح")}: {totalVentes} FCFA
      </Typography>
    </Box>
  );
}

export default VentesPage;
