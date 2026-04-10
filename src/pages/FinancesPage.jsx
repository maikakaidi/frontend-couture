import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,           // ← ajouté pour la flèche
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // ← ajouté
import { useNavigate } from "react-router-dom"; // ← ajouté

function FinancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate(); // ← ajouté pour la flèche retour

  const [finances, setFinances] = useState({
    periode: "mois",
    recettes: 0,
    valeurStock: 0,
    chiffreAffaires: 0,
    totalDepenses: 0,
    masseSalariale: 0,
    totalAvancesEmployes: 0,
    totalCommandes: 0,
    totalAcomptesCommandes: 0,
    beneficeNet: 0,
  });
  const [periode, setPeriode] = useState("mois");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/finances?periode=${periode}`);
        setFinances(res.data);
      } catch (err) {
        console.error(
          t("Erreur chargement finances", "Error loading finances", "خطأ تحميل البيانات المالية"),
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [periode, t]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(t("Rapport Financier", "Financial Report", "تقرير مالي"), 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [[t("Statistique", "Statistic", "الإحصائية"), t("Montant (FCFA)", "Amount (FCFA)", "المبلغ (فرنك سيفا)")]],
      body: [
        [`( {t("Recettes", "Revenue", "الإيرادات")} ( ){periode})`, finances.recettes],
        [t("Valeur du stock restant", "Remaining stock value", "قيمة المخزون المتبقي"), finances.valeurStock],
        [t("Chiffre d’affaires global", "Total turnover", "إجمالي الدوران"), finances.chiffreAffaires],
        [t("Total des dépenses", "Total expenses", "إجمالي المصروفات"), finances.totalDepenses],
        [t("Masse salariale", "Payroll", "كتلة الأجور"), finances.masseSalariale],
        [t("Avances employés", "Employee advances", "سلف الموظفين"), finances.totalAvancesEmployes],
        [t("Total des commandes", "Total orders", "إجمالي الطلبات"), finances.totalCommandes],
        [t("Acomptes commandes", "Order deposits", "دفعات الطلبات"), finances.totalAcomptesCommandes],
        [t("Bénéfice net", "Net profit", "الربح الصافي"), finances.beneficeNet],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [33, 150, 243] },
    });

    doc.save("rapport_financier.pdf");
  };

  // Données pour graphiques (noms traduits)
  const barData = [
    { name: t("Recettes", "Revenue", "الإيرادات"), montant: finances.recettes },
    { name: t("Dépenses", "Expenses", "المصروفات"), montant: finances.totalDepenses },
    { name: t("Salaires", "Salaries", "الرواتب"), montant: finances.masseSalariale },
    { name: t("Avances employés", "Employee advances", "سلف الموظفين"), montant: finances.totalAvancesEmployes },
    { name: t("Commandes", "Orders", "الطلبات"), montant: finances.totalCommandes },
    { name: t("Acomptes commandes", "Order deposits", "دفعات الطلبات"), montant: finances.totalAcomptesCommandes },
    { name: t("Bénéfice net", "Net profit", "الربح الصافي"), montant: finances.beneficeNet },
  ];

  const pieData = [
    { name: t("Recettes", "Revenue", "الإيرادات"), value: finances.recettes },
    { name: t("Dépenses", "Expenses", "المصروفات"), value: finances.totalDepenses },
    { name: t("Salaires", "Salaries", "الرواتب"), value: finances.masseSalariale },
    { name: t("Avances employés", "Employee advances", "سلف الموظفين"), value: finances.totalAvancesEmployes },
  ];

  const COLORS = ["#4CAF50", "#F44336", "#2196F3", "#FF9800"];

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
        💰 {t("Finances", "Finances", "المالية")}
      </Typography>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          📊 {t("Statistiques", "Statistics", "الإحصائيات")}
        </Typography>

        <FormControl fullWidth sx={{ mb: 3, maxWidth: 200 }}>
          <InputLabel>{t("Période", "Period", "الفترة")}</InputLabel>
          <Select
            value={periode}
            label={t("Période", "Period", "الفترة")}
            onChange={(e) => setPeriode(e.target.value)}
          >
            <MenuItem value="jour">{t("Jour", "Day", "يوم")}</MenuItem>
            <MenuItem value="semaine">{t("Semaine", "Week", "أسبوع")}</MenuItem>
            <MenuItem value="mois">{t("Mois", "Month", "شهر")}</MenuItem>
            <MenuItem value="annee">{t("Année", "Year", "سنة")}</MenuItem>
          </Select>
        </FormControl>

        {loading ? (
          <Typography color="text.secondary">
            {t("Chargement des données...", "Loading data...", "جاري تحميل البيانات...")}
          </Typography>
        ) : (
          <>
            <Typography>
              {t("Recettes", "Revenue", "الإيرادات")} ({periode}) : {finances.recettes} {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
            <Typography>
              {t("Valeur du stock restant", "Remaining stock value", "قيمة المخزون المتبقي")} :{" "}
              {finances.valeurStock} {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
            <Typography>
              {t("Chiffre d’affaires global", "Total turnover", "إجمالي الدوران")} :{" "}
              {finances.chiffreAffaires} {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
            <Typography>
              {t("Total des dépenses", "Total expenses", "إجمالي المصروفات")} :{" "}
              {finances.totalDepenses} {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
            <Typography>
              {t("Masse salariale", "Payroll", "كتلة الأجور")} : {finances.masseSalariale}{" "}
              {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
            <Typography>
              {t("Avances employés", "Employee advances", "سلف الموظفين")} :{" "}
              {finances.totalAvancesEmployes} {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
            <Typography>
              {t("Total des commandes", "Total orders", "إجمالي الطلبات")} :{" "}
              {finances.totalCommandes} {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
            <Typography>
              {t("Acomptes commandes", "Order deposits", "دفعات الطلبات")} :{" "}
              {finances.totalAcomptesCommandes} {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
            <Typography fontWeight="bold" color={finances.beneficeNet >= 0 ? "success.main" : "error.main"}>
              {t("Bénéfice net", "Net profit", "الربح الصافي")} : {finances.beneficeNet}{" "}
              {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>

            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="contained" onClick={handleExportPDF}>
                📄 {t("Exporter PDF", "Export PDF", "تصدير PDF")}
              </Button>
              <Button variant="outlined" onClick={() => window.print()}>
                🖨️ {t("Imprimer", "Print", "طباعة")}
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          📈 {t("Graphiques", "Charts", "الرسوم البيانية")} ({periode})
        </Typography>

        <Box sx={{ height: 350, mb: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip formatter={(value) => `${value} ${t("FCFA", "FCFA", "فرنك سيفا")}`} />
              <Legend />
              <Bar dataKey="montant" fill="#2196F3" name={t("Montant", "Amount", "المبلغ")} />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} ${t("FCFA", "FCFA", "فرنك سيفا")}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}

export default FinancePage;
