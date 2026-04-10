import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,           // ← ajouté pour la flèche
} from "@mui/material";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useTranslation } from "../hooks/useTranslation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // ← ajouté
import { useNavigate } from "react-router-dom"; // ← ajouté

function ParametresPage() {
  const { t } = useTranslation();
  const navigate = useNavigate(); // ← ajouté pour la flèche retour

  const [atelierNom, setAtelierNom] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [themeCouleur, setThemeCouleur] = useState("#0D47A1");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [whatsappMsg, setWhatsappMsg] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Charger paramètres
  useEffect(() => {
    const fetchParametres = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/parametres`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data) {
          setAtelierNom(res.data.atelierNom || "");
          setThemeCouleur(res.data.themeCouleur || "#0D47A1");
          setWhatsappMsg(res.data.whatsappMsg || "");
          if (res.data.logo) setLogoUrl(res.data.logo);
        }
      } catch (error) {
        console.error("Erreur chargement paramètres :", error);
        setErrorMsg(t("Erreur lors du chargement des paramètres", "Error loading settings", "خطأ في تحميل الإعدادات"));
      }
    };

    fetchParametres();
  }, [t]);

  // Upload logo handler
  const handleLogoUpload = (e) => {
    if (e.target.files?.length > 0) {
      setLogoFile(e.target.files[0]);
      // Preview immédiat
      setLogoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Sauvegarder tout
  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("atelierNom", atelierNom);
      formData.append("themeCouleur", themeCouleur);
      formData.append("whatsappMsg", whatsappMsg);
      if (logoFile) formData.append("logo", logoFile);

      const res = await axios.post(`${API_BASE_URL}/api/parametres/save`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.logo) setLogoUrl(res.data.logo);
      setSuccessMsg(t("Paramètres sauvegardés avec succès !", "Settings saved successfully!", "تم حفظ الإعدادات بنجاح!"));
    } catch (error) {
      console.error("Erreur sauvegarde :", error);
      setErrorMsg(
        error.response?.data?.message ||
          t("Erreur lors de la sauvegarde", "Error saving settings", "خطأ أثناء الحفظ")
      );
    } finally {
      setLoading(false);
    }
  };

  // Changer mot de passe
  const handleChangePassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword !== confirmNewPassword) {
      setErrorMsg(t("Les mots de passe ne correspondent pas", "Passwords do not match", "كلمات المرور غير متطابقة"));
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg(t("Le nouveau mot de passe doit faire au moins 6 caractères", "New password must be at least 6 characters", "يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل"));
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/parametres/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(t("Mot de passe changé avec succès !", "Password changed successfully!", "تم تغيير كلمة المرور بنجاح!"));
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Erreur changement mot de passe :", error);
      setErrorMsg(
        error.response?.data?.message ||
          t("Erreur lors du changement de mot de passe", "Error changing password", "خطأ في تغيير كلمة المرور")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, pb: { xs: "100px", md: 3 }, position: "relative" }}>
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#0D47A1", textAlign: "center" }}>
        ⚙️ {t("Paramètres de l’atelier", "Workshop Settings", "إعدادات الورشة")}
      </Typography>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

      <Grid container spacing={3}>
        {/* Nom atelier */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: themeCouleur, mb: 2 }}>
              🏷️ {t("Nom de l’atelier", "Workshop Name", "اسم الورشة")}
            </Typography>
            <TextField
              fullWidth
              value={atelierNom}
              onChange={(e) => setAtelierNom(e.target.value)}
              placeholder={t("Ex: Atelier Couture Élégance", "Ex: Elegance Tailoring Workshop", "مثال: ورشة تفصيل أنيقة")}
              variant="outlined"
              inputProps={{
                style: { fontSize: "2rem", fontWeight: "bold", textAlign: "center" },
                maxLength: 100,
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 2, border: `2px solid ${themeCouleur}` },
                backgroundColor: "#fafafa",
              }}
            />
          </Paper>
        </Grid>

        {/* Logo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("Logo de l’atelier", "Workshop Logo", "شعار الورشة")}
            </Typography>
            <Button variant="contained" component="label" sx={{ backgroundColor: themeCouleur, mb: 2 }}>
              {t("Choisir un logo", "Choose Logo", "اختر شعارًا")}
              <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
            </Button>

            {logoUrl && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  style={{ maxHeight: 100, maxWidth: "100%", objectFit: "contain", borderRadius: 8 }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Couleur thème */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("Couleur du thème", "Theme Color", "لون الثيم")}
            </Typography>
            <Select
              fullWidth
              value={themeCouleur}
              onChange={(e) => setThemeCouleur(e.target.value)}
              sx={{ mt: 1 }}
            >
              <MenuItem value="#0D47A1">{t("Bleu", "Blue", "أزرق")}</MenuItem>
              <MenuItem value="#FF5722">{t("Orange", "Orange", "برتقالي")}</MenuItem>
              <MenuItem value="#4CAF50">{t("Vert", "Green", "أخضر")}</MenuItem>
              {/* Tu peux en ajouter plus */}
            </Select>
          </Paper>
        </Grid>

        {/* Changer mot de passe */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔒 {t("Changer le mot de passe", "Change Password", "تغيير كلمة المرور")}
            </Typography>
            <TextField
              type="password"
              fullWidth
              label={t("Ancien mot de passe", "Old Password", "كلمة المرور القديمة")}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              type="password"
              fullWidth
              label={t("Nouveau mot de passe", "New Password", "كلمة المرور الجديدة")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              type="password"
              fullWidth
              label={t("Confirmer le nouveau mot de passe", "Confirm New Password", "تأكيد كلمة المرور الجديدة")}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              disabled={loading}
              onClick={handleChangePassword}
            >
              {loading ? <CircularProgress size={24} /> : t("Mettre à jour", "Update", "تحديث")}
            </Button>
          </Paper>
        </Grid>

        {/* Message WhatsApp / personnalisé */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: themeCouleur, mb: 2 }}>
              ✍️ {t("Message personnalisé (WhatsApp / Accueil)", "Custom Message (WhatsApp / Welcome)", "رسالة مخصصة (واتساب / ترحيب)")}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              value={whatsappMsg}
              onChange={(e) => setWhatsappMsg(e.target.value)}
              placeholder={t(
                "Écris ici ton message d’accueil, signature WhatsApp...",
                "Write your welcome message or WhatsApp signature here...",
                "اكتب رسالة الترحيب أو التوقيع على واتساب هنا..."
              )}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                backgroundColor: "#fafafa",
              }}
            />
            <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
              {t(
                "Astuce : emojis, sauts de ligne et texte long autorisés 🎉",
                "Tip: emojis, line breaks and long text allowed 🎉",
                "نصيحة: الرموز التعبيرية وفواصل الأسطر والنصوص الطويلة مسموحة 🎉"
              )}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: themeCouleur,
            fontSize: "1.1rem",
            fontWeight: "bold",
            px: 6,
            py: 3,
            minWidth: 280,
          }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t("Sauvegarder les paramètres", "Save Settings", "حفظ الإعدادات")
          )}
        </Button>
      </Box>
    </Box>
  );
}

export default ParametresPage;
