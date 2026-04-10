import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function SplashScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ✅ Redirection automatique après 3 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/register");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "black", // ✅ fond noir
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
      }}
    >
      {/* ✅ Titre impactant en blanc */}
      <Typography
        variant="h2"
        sx={{ color: "white", fontWeight: "bold", mb: 3 }}
      >
        {t("GESTION COUTURE", "SEWING MANAGEMENT", "إدارة الخياطة")}
      </Typography>

      {/* ✅ Illustration machine à coudre */}
      <img
        src="/images/sewing-machine.png" // mets ton image dans public/images/
        alt={t("Machine à coudre", "Sewing machine", "ماكينة الخياطة")}
        style={{
          width: "220px",
          marginBottom: "30px",
          opacity: 0,
          animation: "fadeIn 2s ease-in forwards",
        }}
      />

      {/* ✅ Texte défilant en blanc */}
      <Typography
        variant="h6"
        sx={{
          color: "white",
          fontWeight: "600",
          fontSize: "20px",
          width: "80%",
          overflow: "hidden",
          whiteSpace: "nowrap",
          opacity: 0,
          animation: "fadeIn 3s ease-in forwards, scrollText 8s linear infinite",
        }}
      >
        {t(
          "Le logiciel qui simplifie la gestion de vos ateliers",
          "The software that simplifies the management of your workshops",
          "البرنامج الذي يبسط إدارة ورشكم"
        )}
      </Typography>

      {/* ✅ Signature en blanc */}
      <Typography variant="body2" sx={{ color: "white", mt: "auto" }}>
        {t("© BARÉBARI 2025", "© BARÉBARI 2025", "© باريباري 2025")}
      </Typography>

      {/* ✅ Animations CSS */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes scrollText {
            0% { transform: translateX(100%); }
            50% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </Box>
  );
}

export default SplashScreen;
