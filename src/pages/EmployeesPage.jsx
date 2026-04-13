import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
} from "@mui/material";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import jsPDF from "jspdf";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";
import { useNavigate } from "react-router-dom";           // ← Ajouté ici
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // ← Ajouté ici

// 🔹 Services Offline (SQLite)
import {
  getEmployeesLocal,
  fullSyncEmployees,
  upsertEmployeeLocal,
  deleteEmployeeLocal,
} from "../services/employeeService";

import { addPendingChange } from "../services/pendingService";

function EmployeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();     // ← Ajouté ici

  const [employes, setEmployes] = useState([]);
  const [allEmployes, setAllEmployes] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [avance, setAvance] = useState({});
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [newEmp, setNewEmp] = useState({
    nom: "",
    poste: "",
    telephone: "",
    salaire: "",
  });

  // 🔹 Chargement initial : backend → SQLite → UI
useEffect(() => {
  const loadEmployees = async () => {
    try {
      if (navigator.onLine) {
        // 🔹 Backend + SQLite
        const list = await fullSyncEmployees();
        setEmployes(list);
        setAllEmployes(list);
      } else {
        // 🔹 Lecture directe SQLite
        const localList = await getEmployeesLocal();
        setEmployes(localList);
        setAllEmployes(localList);
      }
    } catch (err) {
      console.warn("Erreur chargement employés :", err.message);
      const localList = await getEmployeesLocal();
      setEmployes(localList);
      setAllEmployes(localList);
    }
  };

  loadEmployees();
}, [t]);


  // 🔹 Ajouter un employé
  const handleAddEmp = async () => {
  if (!newEmp.nom.trim() || !newEmp.salaire) {
    alert(t("Nom et salaire obligatoires", "Name and salary are required", "الاسم والراتب مطلوبان"));
    return;
  }

  try {
    // 🔹 Tentative backend
    const res = await api.post("/employes", newEmp);
    const emp = res.data.emp;

    // 🔹 Sauvegarde locale
    await upsertEmployeeLocal(emp);

    const newList = [emp, ...employes];
    setEmployes(newList);
    setAllEmployes(newList);

    setNewEmp({ nom: "", poste: "", telephone: "", salaire: "" });
    setShowForm(false);
  } catch (err) {
    console.warn("Backend inaccessible, ajout offline…", err.message);

    // 🔹 Création d’un ID temporaire
    const tempId = "local-" + Date.now();
    const emp = {
      _id: tempId,
      ...newEmp,
      advances: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 🔹 Sauvegarde locale immédiate
    await upsertEmployeeLocal(emp);

    // 🔹 Ajout dans la file d’attente offline
    await addPendingChange("employes", "POST", "/employes", newEmp);

    const newList = [emp, ...employes];
    setEmployes(newList);
    setAllEmployes(newList);

    setNewEmp({ nom: "", poste: "", telephone: "", salaire: "" });
    setShowForm(false);
  }
};

  // 🔹 Recherche
  const handleSearch = (q) => {
    setSearch(q);
    if (q.trim() === "") {
      setEmployes(allEmployes);
      return;
    }

    const filtered = allEmployes.filter(
      (emp) =>
        emp.nom?.toLowerCase().includes(q.toLowerCase().trim()) ||
        emp.poste?.toLowerCase().includes(q.toLowerCase().trim()) ||
        (emp.telephone && emp.telephone.includes(q.trim()))
    );
    setEmployes(filtered);
  };

  // 🔹 Ajouter une avance
  const handleAddAvance = async (id) => {
    const amount = Number(avance[id] || 0);
    if (amount <= 0) {
      alert(t("Montant avance invalide", "Invalid advance amount", "مبلغ السلفة غير صالح"));
      return;
    }

    try {
      const res = await api.put(`/employes/${id}/avance`, { amount });
      const updated = res.data.emp;

      // 🔹 Mise à jour locale
      await upsertEmployeeLocal(updated);

      setEmployes(
        employes.map((e) => (e._id === id ? updated : e))
      );
      setAvance({ ...avance, [id]: "" });
    } catch (err) {
      console.error(
        t("Erreur ajout avance", "Error adding advance", "خطأ إضافة سلفة"),
        err.response?.data || err.message
      );
    }
  };

  // 🔹 Supprimer un employé
  const handleDeleteEmp = async (id) => {
    if (
      !window.confirm(
        t("Confirmer suppression employé ?", "Confirm employee deletion?", "تأكيد حذف الموظف؟")
      )
    )
      return;

    try {
      await api.delete(`/employes/${id}`);
      await deleteEmployeeLocal(id);

      const newList = employes.filter((e) => e._id !== id);
      setEmployes(newList);
      setAllEmployes(newList);
    } catch (err) {
      console.error(
        t("Erreur suppression employé", "Error deleting employee", "خطأ حذف موظف"),
        err.response?.data || err.message
      );
    }
  };

  // 🔹 Filtrer les avances par mois
  const filterAvancesByMonth = (advances) => {
    if (!advances || !Array.isArray(advances)) return [];
    return advances.filter((a) => {
      const d = new Date(a.date);
      return (
        d.getMonth() === selectedMonth.getMonth() &&
        d.getFullYear() === selectedMonth.getFullYear()
      );
    });
  };

  // 🔹 Générer un reçu PDF
  const generateReceipt = (emp, avance) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(t("Reçu de paiement", "Payment Receipt", "إيصال الدفع"), 20, 20);

    doc.setFontSize(12);
    doc.text(`${t("Employé", "Employee", "الموظف")}: ${emp.nom}`, 20, 40);
    doc.text(`${t("Poste", "Position", "المنصب")}: ${emp.poste || "-"}`, 20, 50);
    doc.text(`${t("Montant payé", "Amount paid", "المبلغ المدفوع")}: ${avance.amount} CFA`, 20, 60);
    doc.text(`${t("Date", "Date", "التاريخ")}: ${new Date(avance.date).toLocaleDateString()}`, 20, 70);

    const totalAvances = filterAvancesByMonth(emp.advances).reduce(
      (sum, a) => sum + a.amount,
      0
    );
    const salaireRestant = emp.salaire - totalAvances;

    doc.text(`${t("Salaire brut", "Gross salary", "الراتب الإجمالي")}: ${emp.salaire} CFA`, 20, 80);
    doc.text(`${t("Salaire restant", "Remaining salary", "الراتب المتبقي")}: ${salaireRestant} CFA`, 20, 90);

    doc.save(`recu_${emp.nom.replace(/\s+/g, "_")}.pdf`);
  };


return (
    <Box sx={{ p: 3 }}>
      {/* ←←← Bouton retour + Titre (seule modification) */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}   // Retour à la page précédente
          sx={{ mr: 2 }}
        >
          {t("Retour", "Back", "رجوع")}
        </Button>

        <Typography variant="h4" sx={{ flex: 1, textAlign: "center" }}>
          👔 {t("Gestion des Employés", "Employee Management", "إدارة الموظفين")}
        </Typography>
      </Box>

      {!showForm ? (
        <>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              mb: 3,
              alignItems: { md: "center" },
            }}
          >
            <TextField
              fullWidth
              label={t("Rechercher un employé", "Search an employee", "البحث عن موظف")}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <Button variant="contained" onClick={() => setShowForm(true)}>
              ➕ {t("Ajouter un employé", "Add employee", "إضافة موظف")}
            </Button>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              views={["year", "month"]}
              label={t("Choisir un mois", "Select a month", "اختر شهرًا")}
              value={selectedMonth}
              onChange={(newValue) => setSelectedMonth(newValue || new Date())}
            />
          </LocalizationProvider>

          <Paper sx={{ p: 2, mt: 3 }}>
            <List>
              {employes.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  {t("Aucun employé trouvé", "No employee found", "لم يتم العثور على موظف")}
                </Typography>
              ) : (
                employes.map((emp) => {
                  const avancesDuMois = filterAvancesByMonth(emp.advances || []);
                  const totalAvances = avancesDuMois.reduce((sum, a) => sum + a.amount, 0);
                  const salaireRestant = (Number(emp.salaire) || 0) - totalAvances;

                  return (
                    <ListItem
                      key={emp._id}
                      divider
                      sx={{
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: { xs: "flex-start", md: "center" },
                        gap: 2,
                      }}
                    >
                      <ListItemText
                        sx={{ width: "100%" }}
                        primary={`${emp.nom} – ${emp.poste || "-"}`}
                        secondary={
                          <>
                            <div>
                              {t("Salaire brut", "Gross salary", "الراتب الإجمالي")}: {emp.salaire || 0} {t("CFA", "CFA", "فرنك سيفا")}
                            </div>
                            <div>
                              {t("Salaire restant ce mois", "Remaining salary this month", "الراتب المتبقي هذا الشهر")}:{" "}
                              <strong>{salaireRestant} {t("CFA", "CFA", "فرنك سيفا")}</strong>
                            </div>
                            <div>
                              {t("Avances du mois", "Advances this month", "سلف الشهر")} :{" "}
                              {avancesDuMois.length > 0 ? (
                                avancesDuMois.map((a, i) => (
                                  <div key={i}>
                                    {a.amount} {t("CFA", "CFA", "فرنك سيفا")} – {new Date(a.date).toLocaleDateString()}
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      sx={{ ml: 1, minWidth: 60 }}
                                      onClick={() => generateReceipt(emp, a)}
                                    >
                                      {t("Reçu", "Receipt", "إيصال")}
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <span> {t("Aucune avance ce mois", "No advance this month", "لا سلفة هذا الشهر")}</span>
                              )}
                            </div>
                          </>
                        }
                      />

                      <Box
                        sx={{
                          width: { xs: "100%", md: "auto" },
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          gap: 1,
                          mt: { xs: 2, md: 0 },
                        }}
                      >
                        <TextField
                          size="small"
                          fullWidth
                          label={t("Avance", "Advance", "سلفة")}
                          type="number"
                          value={avance[emp._id] || ""}
                          onChange={(e) =>
                            setAvance({
                              ...avance,
                              [emp._id]: e.target.value,
                            })
                          }
                          sx={{ minWidth: 120 }}
                        />

                        <Button
                          variant="contained"
                          onClick={() => handleAddAvance(emp._id)}
                        >
                          {t("Ajouter", "Add", "إضافة")}
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeleteEmp(emp._id)}
                        >
                          {t("Supprimer", "Delete", "حذف")}
                        </Button>
                      </Box>
                    </ListItem>
                  );
                })
              )}
            </List>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
          <Typography variant="h6" gutterBottom>
            ➕ {t("Nouvel employé", "New employee", "موظف جديد")}
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            label={t("Nom", "Name", "الاسم")}
            value={newEmp.nom}
            onChange={(e) => setNewEmp({ ...newEmp, nom: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("Poste", "Position", "المنصب")}
            value={newEmp.poste}
            onChange={(e) => setNewEmp({ ...newEmp, poste: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("Téléphone", "Phone", "الهاتف")}
            value={newEmp.telephone}
            onChange={(e) => setNewEmp({ ...newEmp, telephone: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("Salaire (CFA)", "Salary (CFA)", "الراتب (فرنك سيفا)")}
            type="number"
            value={newEmp.salaire}
            onChange={(e) => setNewEmp({ ...newEmp, salaire: e.target.value })}
          />

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleAddEmp}>
              {t("Enregistrer", "Save", "حفظ")}
            </Button>
            <Button variant="outlined" onClick={() => setShowForm(false)}>
              {t("Annuler", "Cancel", "إلغاء")}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );


}

export default EmployeesPage;
