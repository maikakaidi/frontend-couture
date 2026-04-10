import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper, IconButton, InputAdornment, Link } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../api";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useTranslation } from "../hooks/useTranslation";

function RegisterPage() {
  const { t } = useTranslation();

  const [atelier, setAtelier] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!atelier || !telephone || !motDePasse) {
      return alert(t("Tous les champs sont obligatoires", "All fields are required", "جميع الحقول مطلوبة") + " ❌");
    }
    if (motDePasse.length < 6) {
      return alert(t("Mot de passe trop court (min 6 caractères)", "Password too short (min 6 characters)", "كلمة المرور قصيرة جدًا (حد أدنى 6 أحرف)") + " ❌");
    }

    try {
      // ✅ Nettoyer le numéro avant envoi
      const cleanTelephone = `+${telephone.replace(/\s+/g, "").replace(/-/g, "")}`;

      const res = await api.post("/auth/register", {
        nom: atelier,
        telephone: cleanTelephone,
        motDePasse,
      });

      console.log("Réponse backend register:", res.data);

      alert(t("Inscription réussie", "Registration successful", "تم التسجيل بنجاح") + " ✅");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || t("Erreur inscription", "Registration error", "خطأ في التسجيل") + " ❌");
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" gutterBottom>
          {t("Inscription", "Registration", "التسجيل")}
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TextField
          label={t("Nom de l'atelier", "Workshop Name", "اسم الورشة")}
          fullWidth
          sx={{ mb: 2 }}
          value={atelier}
          onChange={(e) => setAtelier(e.target.value)}
        />

        {/* ✅ Champ téléphone avec choix du pays (Niger par défaut) */}
        <PhoneInput
          country={"ne"}
          value={telephone}
          onChange={setTelephone}
          inputStyle={{ width: "100%", marginBottom: "16px" }}
          enableSearch
          placeholder={t("Numéro de téléphone", "Phone number", "رقم الهاتف")}
        />

        <TextField
          label={t("Mot de passe", "Password", "كلمة المرور")}
          type={showPassword ? "text" : "password"}
          fullWidth
          sx={{ mb: 2 }}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button variant="contained" fullWidth onClick={handleRegister}>
          {t("S’inscrire", "Sign Up", "تسجيل")}
        </Button>

        <Typography sx={{ mt: 2, textAlign: "center" }}>
          {t("Déjà inscrit ?", "Already registered?", "مسجل مسبقًا؟")}{" "}
          <Link href="/login" underline="hover">
            {t("Se connecter", "Log in", "تسجيل الدخول")}
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default RegisterPage;
