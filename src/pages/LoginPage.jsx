import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";

// ✅ Import des services (déjà existants)
import { getUserLocal, upsertUserLocal } from "../services/userService";

function LoginPage({ setRole, setToken }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    const telTrim = telephone.trim();
    const passTrim = motDePasse.trim();

    if (!telTrim || !passTrim) {
      setError(t("Tous les champs sont obligatoires", "All fields are required", "جميع الحقول مطلوبة"));
      setLoading(false);
      return;
    }

    try {
      if (navigator.onLine) {
        // ====================== MODE ONLINE ======================
        const res = await api.post("/auth/login", {
          telephone: telTrim,
          motDePasse: passTrim,
        });

        const { token: tkn, user } = res.data;

        // Stockage sécurisé
        localStorage.setItem("token", tkn);
        localStorage.setItem("role", user.role);
        localStorage.setItem("userId", user._id);
        localStorage.setItem("atelierId", user.atelierId?._id || user.atelierId);

        setToken(tkn);
        setRole(user.role);

        // ====================== SAUVEGARDE OFFLINE ======================
        // On sauvegarde le mot de passe EN CLAIR pour le mode hors-ligne
        const userForLocal = {
          ...user,
          motDePasse: passTrim, // ← important : on stocke le mot de passe en clair ici
        };

        await upsertUserLocal(userForLocal);

        // Redirection
        if (user.role === "superadmin") {
          navigate("/dashboard-admin");
        } else if (["adminatelier", "soususer"].includes(user.role)) {
          navigate("/accueil");
        } else {
          setError(t("Compte désactivé ou rôle inconnu", "Account disabled or unknown role", "الحساب معطل أو دور غير معروف"));
        }
      } else {
        // ====================== MODE OFFLINE ======================
        const user = await getUserLocal(telTrim);

        if (!user) {
          throw new Error(
            t(
              "Utilisateur non trouvé en local. Connectez-vous une fois en ligne.",
              "User not found locally. Please connect online once.",
              "المستخدم غير موجود محلياً. يرجى الاتصال بالإنترنت مرة واحدة."
            )
          );
        }

        if (user.motDePasse !== passTrim) {
          throw new Error(t("Mot de passe incorrect", "Incorrect password", "كلمة المرور غير صحيحة"));
        }

        if (user.statut === "disabled") {
          throw new Error(t("Compte désactivé", "Account disabled", "الحساب معطل"));
        }

        if (user.trialExpiresAt && new Date(user.trialExpiresAt) < new Date()) {
          throw new Error(t("Abonnement ou essai expiré", "Subscription or trial expired", "الاشتراك أو التجربة منتهية"));
        }

        // Connexion offline réussie
        localStorage.setItem("role", user.role);
        localStorage.setItem("userId", user._id);
        localStorage.setItem("atelierId", user.atelierId);

        setRole(user.role);

        if (user.role === "superadmin") {
          navigate("/dashboard-admin");
        } else {
          navigate("/accueil");
        }
      }
    } catch (err) {
      console.error("Erreur login:", err);
      setError(err.message || t("Identifiants invalides", "Invalid credentials", "بيانات الدخول غير صحيحة"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "grey.100",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 5,
          width: { xs: "90%", sm: 420 },
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
          {t("Connexion Atelier", "Atelier Login", "تسجيل الدخول للورشة")}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
            {error}
          </Alert>
        )}

        <TextField
          label={t("Téléphone", "Phone", "الهاتف")}
          fullWidth
          variant="outlined"
          sx={{ mb: 3 }}
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          autoFocus
          InputProps={{
            startAdornment: <InputAdornment position="start">📱</InputAdornment>,
          }}
        />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: -1,
            mb: 3,
            textAlign: "left",
            fontStyle: "italic",
          }}
        >
          {t(
            "Veuillez enlever les espaces entre les numéros pour vous connecter (ex: +22792666942)",
            "Please remove spaces between numbers to log in (e.g. +22792666942)",
            "يرجى إزالة المسافات بين الأرقام لتسجيل الدخول (مثال: 22792666942+)"
          )}
        </Typography>

        <TextField
          label={t("Mot de passe", "Password", "كلمة المرور")}
          type={showPassword ? "text" : "password"}
          fullWidth
          variant="outlined"
          sx={{ mb: 3 }}
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

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={handleLogin}
          disabled={loading}
          sx={{ py: 1.5, fontSize: "1.1rem" }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t("Se connecter", "Log in", "تسجيل الدخول")
          )}
        </Button>
      </Paper>
    </Box>
  );
}

export default LoginPage;
