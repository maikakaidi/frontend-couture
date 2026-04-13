import React, {  } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Paper,
  Stack,
  IconButton,           // ← ajouté pour la flèche
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // ← ajouté
import { useNavigate } from "react-router-dom"; // ← ajouté
import { useTranslation } from "../hooks/useTranslation";

function AidePage() {
  const { t } = useTranslation();
  const navigate = useNavigate(); // ← ajouté pour la flèche retour

  return (
    <Box
      sx={{
        p: 3,
        pb: { xs: "100px", md: 3 }, // espace pour la barre mobile
        position: "relative", // ← nécessaire pour positionner la flèche
      }}
    >
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
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#0D47A1", textAlign: "center" }}
      >
        ❓ {t("Centre d’aide & Support", "Help Center & Support", "مركز المساعدة والدعم")}
      </Typography>

      {/* FAQ */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📌 {t("Foire aux questions (FAQ)", "Frequently Asked Questions (FAQ)", "الأسئلة الشائعة (FAQ)")}
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t("Comment changer mon mot de passe ?", "How to change my password?", "كيف أغير كلمة المرور؟")}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              {t(
                "Allez dans Paramètres → section \"Changer mot de passe\". Entrez l’ancien mot de passe puis le nouveau, et cliquez sur \"Mettre à jour\".",
                "Go to Settings → \"Change password\" section. Enter the old password then the new one, and click \"Update\".",
                "اذهب إلى الإعدادات → قسم \"تغيير كلمة المرور\". أدخل كلمة المرور القديمة ثم الجديدة، واضغط على \"تحديث\"."
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              {t("Comment mettre à jour le nom et le logo de mon atelier ?", "How to update my workshop name and logo?", "كيف أحدث اسم الورشة وشعارها؟")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              {t(
                "Dans Paramètres, modifiez le champ \"Nom de l’atelier\" et uploadez un nouveau logo. Cliquez sur \"Sauvegarder les paramètres\".",
                "In Settings, edit the \"Workshop name\" field and upload a new logo. Click \"Save settings\".",
                "في الإعدادات، عدّل حقل \"اسم الورشة\" وقم برفع شعار جديد. اضغط على \"حفظ الإعدادات\"."
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t("Que faire si mon abonnement expire ?", "What to do if my subscription expires?", "ماذا أفعل إذا انتهى اشتراكي؟")}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              {t(
                "Rendez-vous dans la section \"Abonnement\" pour renouveler votre plan. Vous verrez aussi les jours restants sur la page d’accueil.",
                "Go to the \"Subscription\" section to renew your plan. You will also see the remaining days on the home page.",
                "اذهب إلى قسم \"الاشتراك\" لتجديد خطتك. سترى أيضاً الأيام المتبقية في صفحة الرئيسية."
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Tutoriels */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎓 {t("Tutoriels rapides", "Quick tutorials", "دروس سريعة")}
        </Typography>

        <Typography sx={{ mb: 1 }}>
          👉 {t("Créer un employé :", "Create an employee:", "إنشاء موظف:")} {t("Employés → Ajouter → remplir les informations → sauvegarder.", "Employees → Add → fill in information → save.", "الموظفون → إضافة → ملء المعلومات → حفظ.")}
        </Typography>

        <Typography sx={{ mb: 1 }}>
          👉 {t("Ajouter un client :", "Add a client:", "إضافة عميل:")} {t("Clients → Nouveau client → entrer les informations → valider.", "Clients → New client → enter information → validate.", "العملاء → عميل جديد → إدخال المعلومات → تأكيد.")}
        </Typography>

        <Typography sx={{ mb: 1 }}>
          👉 {t("Gérer les finances :", "Manage finances:", "إدارة المالية:")} {t("Finance → consulter les rapports → ajouter dépenses.", "Finance → view reports → add expenses.", "المالية → عرض التقارير → إضافة مصروفات.")}
        </Typography>
      </Paper>

      {/* Support */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          📞 {t("Support & Assistance", "Support & Assistance", "الدعم والمساعدة")}
        </Typography>

        <Typography sx={{ mb: 2 }}>
          {t("Si vous avez besoin d’aide supplémentaire, contactez-nous :", "If you need further assistance, contact us:", "إذا كنت بحاجة إلى مساعدة إضافية، تواصل معنا:")}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Button
            fullWidth
            variant="contained"
            color="success"
            href="https://wa.me/22799293329"
            target="_blank"
          >
            📱 WhatsApp 99293329
          </Button>

          <Button
            fullWidth
            variant="contained"
            color="success"
            href="https://wa.me/22792666942"
            target="_blank"
          >
            📱 WhatsApp 92666942
          </Button>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mb: 2 }}
          href="mailto:barebarinformatique@gmail.com"
        >
          📧 {t("Email support", "Email support", "البريد الإلكتروني للدعم")}
        </Button>

        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          href="https://backend-couture-production.up.railway.app/docs/guide.pdf"
          target="_blank"
        >
          📖 {t("Documentation PDF", "PDF Documentation", "الوثائق PDF")}
        </Button>
      </Paper>
    </Box>
  );
}

export default AidePage;
