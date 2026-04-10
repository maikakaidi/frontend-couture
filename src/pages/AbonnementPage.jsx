import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Alert,
  Toolbar,
  AppBar,
  IconButton,           // ← ajouté pour la flèche
} from "@mui/material";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // ← ajouté
import { useNavigate } from "react-router-dom"; // ← ajouté

function AbonnementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate(); // ← ajouté pour la flèche retour

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [joursRestants, setJoursRestants] = useState(null);
  const [compteurUsers, setCompteurUsers] = useState(null);

  const [newUser, setNewUser] = useState({ nom: "", telephone: "", motDePasse: "" });
  const [feedback, setFeedback] = useState(null);

  const plans = [
    { id: "essai", label: t("Essai", "Trial", "تجربة"), prix: t("Gratuit", "Free", "مجاني"), desc: t("7 jours gratuits", "7 days free", "7 أيام مجانية") },
    { id: "3mois", label: t("3 mois", "3 months", "3 أشهر"), prix: "20 000 FCFA", desc: t("Abonnement trimestriel", "Quarterly subscription", "اشتراك ربع سنوي") },
    { id: "6mois", label: t("6 mois", "6 months", "6 أشهر"), prix: "40 000 FCFA", desc: t("Abonnement semestriel", "Semi-annual subscription", "اشتراك نصف سنوي") },
    { id: "1an", label: t("1 an", "1 year", "سنة واحدة"), prix: "60 000 FCFA", desc: t("Abonnement annuel", "Annual subscription", "اشتراك سنوي") },
  ];

  const contacts = {
    whatsapp: "99293329",
    email: "barebarinformatique@gmail.com"
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setMessage(t("Vous avez choisi le plan", "You have chosen the plan", "لقد اخترت الخطة") + ` ${plan.label} ✅`);
  };

  useEffect(() => {
    const fetchInfos = async () => {
      try {
        const res = await api.get("/abonnement/infos");
        setJoursRestants(res.data.joursRestants);
        setCompteurUsers(res.data.compteurUsers);
      } catch (err) {
        console.error("Erreur chargement infos abonnement:", err);
      }
    };
    fetchInfos();
  }, []);

  const ajouterUser = async () => {
    try {
      const res = await api.post("/abonnement/ajouter-user", newUser);
      setFeedback({ type: "success", text: res.data.message });
      setNewUser({ nom: "", telephone: "", motDePasse: "" });
    } catch (err) {
      console.error("Erreur ajout utilisateur:", err);
      setFeedback({ type: "error", text: t("Erreur lors de l’ajout de l’utilisateur", "Error adding user", "خطأ أثناء إضافة المستخدم") + " ❌" });
    }
  };

  return (
    <Box sx={{ pb: 8, position: "relative" }}>
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

      <AppBar position="static" sx={{ backgroundColor: "#0D47A1" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: "bold" }}>
            📦 {t("Abonnement", "Subscription", "الاشتراك")}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: "#fff" }}>
            📧 {contacts.email}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Titre principal + emoji centré au milieu */}
        <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
          {t("Choisir un abonnement", "Choose a subscription", "اختر اشتراكًا")}
        </Typography>

        {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

        {/* ✅ Affichage des deux compteurs */}
        {(joursRestants !== null || compteurUsers !== null) && (
          <Paper sx={{ p: 2, mb: 3 }}>
            {joursRestants !== null && (
              <>
                <Typography variant="h6">⏳ {t("Jours restants", "Days remaining", "الأيام المتبقية")}</Typography>
                <Typography>{joursRestants} {t("jour(s)", "day(s)", "يوم/أيام")}</Typography>
              </>
            )}
            {compteurUsers !== null && (
              <>
                <Typography variant="h6" sx={{ mt: 2 }}>👥 {t("Utilisateurs actifs", "Active users", "المستخدمون النشطون")}</Typography>
                <Typography>{compteurUsers}</Typography>
              </>
            )}
          </Paper>
        )}

        <Grid container spacing={2}>
          {plans.map(plan => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6">{plan.label}</Typography>
                <Typography variant="body2">{plan.desc}</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>{plan.prix}</Typography>
                <Button variant="contained" sx={{ mt: 1 }} onClick={() => handleSelectPlan(plan)}>
                  {t("Choisir", "Choose", "اختر")}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {selectedPlan && selectedPlan.id !== "essai" && (
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6">
              💳 {t("Paiement pour", "Payment for", "الدفع لـ")} {selectedPlan.label}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t("Veuillez choisir un moyen de paiement pour", "Please choose a payment method for", "يرجى اختيار وسيلة دفع لـ")} {selectedPlan.prix}.
            </Typography>

            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="outlined"
                  href={`https://wa.me/227( {contacts.whatsapp}?text=Bonjour,%20je%20souhaite%20payer%20mon%20abonnement%20 ){selectedPlan.label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📲 {t("Payer via WhatsApp", "Pay via WhatsApp", "الدفع عبر واتساب")}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  href={`mailto:( {contacts.email}?subject=Paiement%20Abonnement&body=Bonjour,%20je%20souhaite%20payer%20mon%20abonnement%20 ){selectedPlan.label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📧 {t("Payer via Email", "Pay via Email", "الدفع عبر البريد الإلكتروني")}
                </Button>
              </Grid>
            </Grid>

            <Typography variant="body2" sx={{ mt: 2 }}>
              {t("Moyens disponibles", "Available methods", "الوسائل المتاحة")}: Orange Money, Nita, Amana.
            </Typography>
          </Paper>
        )}

        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6">👥 {t("Ajouter un utilisateur", "Add a user", "إضافة مستخدم")} (20 000 FCFA)</Typography>
          {feedback && <Alert severity={feedback.type} sx={{ mb: 2 }}>{feedback.text}</Alert>}
          <TextField 
            label={t("Nom", "Name", "الاسم")} 
            value={newUser.nom} 
            onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} 
            fullWidth 
            sx={{ mb: 2 }} 
          />
          <TextField 
            label={t("Téléphone", "Phone", "الهاتف")} 
            value={newUser.telephone} 
            onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })} 
            fullWidth 
            sx={{ mb: 2 }} 
          />
          <TextField 
            label={t("Mot de passe", "Password", "كلمة المرور")} 
            type="password" 
            value={newUser.motDePasse} 
            onChange={(e) => setNewUser({ ...newUser, motDePasse: e.target.value })} 
            fullWidth 
            sx={{ mb: 2 }} 
          />
          <Button variant="contained" color="primary" onClick={ajouterUser}>
            ➕ {t("Ajouter utilisateur", "Add user", "إضافة مستخدم")}
          </Button>
        </Paper>

        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6">📞 {t("Support & Paiement", "Support & Payment", "الدعم والدفع")}</Typography>
          <Typography variant="body2">
            WhatsApp : <a href={`https://wa.me/227${contacts.whatsapp}`} target="_blank" rel="noopener noreferrer">{contacts.whatsapp}</a>
          </Typography>
          <Typography variant="body2">
            Email : <a href={`mailto:${contacts.email}`} target="_blank" rel="noopener noreferrer">{contacts.email}</a>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default AbonnementPage;
