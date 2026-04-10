import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useTranslation } from "../hooks/useTranslation";

function AdminParametresPage() {
  const { t } = useTranslation();

  const [messageDefilant, setMessageDefilant] = useState("");
  const [imagesDefilantes, setImagesDefilantes] = useState([]);
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    fetchParametres();
  }, []);

  const fetchParametres = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/admin-parametres`);
    if (res.data) {
      setMessageDefilant(res.data.messageDefilant || "");
      setImagesDefilantes(res.data.imagesDefilantes || []);
    }
  };

  const handleImageUpload = async () => {
    if (!newImage) return;

    const formData = new FormData();
    formData.append("image", newImage);

    const res = await axios.post(
      `${API_BASE_URL}/api/admin-parametres/upload`,
      formData
    );

    setImagesDefilantes((prev) => [...prev, res.data.image]);
    setNewImage(null);
  };

  const deleteImage = (index) => {
    const updated = [...imagesDefilantes];
    updated.splice(index, 1);
    setImagesDefilantes(updated);
  };

  const handleSave = async () => {
    await axios.post(`${API_BASE_URL}/api/admin-parametres/save`, {
      messageDefilant,
      imagesDefilantes,
    });

    alert(t("Paramètres sauvegardés", "Settings saved", "تم حفظ الإعدادات") + " ✅");
  };

  return (
    <Box sx={{ p: 3, pb: 12 }}>
      <Typography variant="h4">
        ⚙️ {t("Paramètres Admin", "Admin Settings", "إعدادات الإدارة")}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">
          {t("Message promotion", "Promotional message", "رسالة ترويجية")}
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={2}
          value={messageDefilant}
          onChange={(e) => setMessageDefilant(e.target.value)}
          placeholder={t(
            "Entrez le message qui défilera...",
            "Enter the scrolling message...",
            "أدخل الرسالة التي ستظهر بالتناوب..."
          )}
        />
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">
          {t("Images promotionnelles", "Promotional images", "الصور الترويجية")}
        </Typography>

        <Button variant="contained" component="label">
          {t("Choisir image", "Choose image", "اختر صورة")}
          <input
            type="file"
            hidden
            onChange={(e) => setNewImage(e.target.files[0])}
          />
        </Button>

        <Button
          variant="contained"
          sx={{ ml: 2 }}
          onClick={handleImageUpload}
          disabled={!newImage}
        >
          {t("Upload", "Upload", "رفع")}
        </Button>

        <Box sx={{ mt: 2 }}>
          {imagesDefilantes.map((img, index) => (
            <Paper key={index} sx={{ p: 1, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <img
                src={`( {API_BASE_URL}/ ){img}`}
                alt={t("Image promotionnelle", "Promotional image", "صورة ترويجية")}
                style={{
                  width: "15%",
                  height: 100,
                  objectFit: "cover",
                }}
              />

              <Button
                color="error"
                onClick={() => deleteImage(index)}
              >
                {t("Supprimer", "Delete", "حذف")}
              </Button>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          background: "#fff",
          pt: 2
        }}
      >
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSave}
        >
          {t("Sauvegarder", "Save", "حفظ")}
        </Button>
      </Box>
    </Box>
  );
}

export default AdminParametresPage;
