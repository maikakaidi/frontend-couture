import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Select,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PeopleIcon from "@mui/icons-material/People";
import GroupIcon from "@mui/icons-material/Group";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BarChartIcon from "@mui/icons-material/BarChart";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import PhotoIcon from "@mui/icons-material/Photo";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import { Link } from "react-router-dom";
import api from "../api";
import { getImageUrl } from "../config";
import { useTranslation } from "../hooks/useTranslation";

function AccueilPage() {
  const { t, langue, setLangue } = useTranslation();

  const [atelierNom, setAtelierNom] = useState("Atelier Couture – Mon Atelier");
  const [logoUrl, setLogoUrl] = useState("");
  const [themeCouleur, setThemeCouleur] = useState("#0D47A1");
  const [messageDefilant, setMessageDefilant] = useState("");
  const [imagesPromo, setImagesPromo] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const sections = [
    { title: t("Employés", "Employees", "الموظفون"), path: "/employes", icon: <PeopleIcon sx={{ fontSize: 32 }} /> },
    { title: t("Clients", "Clients", "العملاء"), path: "/clients", icon: <GroupIcon sx={{ fontSize: 32 }} /> },
    { title: t("Articles", "Items", "المنتجات"), path: "/articles", icon: <ShoppingCartIcon sx={{ fontSize: 32 }} /> },
    { title: t("Finance", "Finances", "المالية"), path: "/finances", icon: <AttachMoneyIcon sx={{ fontSize: 32 }} /> },
    { title: t("Ventes", "Sales", "المبيعات"), path: "/ventes", icon: <BarChartIcon sx={{ fontSize: 32 }} /> },
    { title: t("Abonnement", "Subscription", "الاشتراك"), path: "/abonnement", icon: <SubscriptionsIcon sx={{ fontSize: 32 }} /> },
    { title: t("Galerie", "Gallery", "معرض الصور"), path: "/galerie", icon: <PhotoIcon sx={{ fontSize: 32 }} /> },
    { title: t("Dépenses", "Expenses", "المصروفات"), path: "/depenses", icon: <MoneyOffIcon sx={{ fontSize: 32 }} /> },
  ];

  useEffect(() => {
    const fetchParametres = async () => {
      try {
        const res = await api.get("/parametres");
        if (res.data) {
          setAtelierNom(res.data.atelierNom || t("Atelier Couture – Mon Atelier", "My Workshop – Atelier Couture", "ورشة الخياطة – ورشتي"));
          setThemeCouleur(res.data.themeCouleur || "#0D47A1");
          if (res.data.logo) setLogoUrl(getImageUrl(res.data.logo));
        }
      } catch (err) {
        console.error("Erreur paramètres :", err);
      }
    };

    const fetchAdminParametres = async () => {
      try {
        const res = await api.get("/admin-parametres");
        if (res.data) {
          setMessageDefilant(res.data.messageDefilant || "");
          setImagesPromo(res.data.imagesDefilantes || []);
        }
      } catch (err) {
        console.error("Erreur admin params :", err);
      }
    };

    fetchParametres();
    fetchAdminParametres();
  }, [langue, t]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev === 0 ? imagesPromo.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setSlideIndex((prev) => (prev === imagesPromo.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box sx={{ pb: 16 }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: themeCouleur }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <IconButton color="inherit" onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </IconButton>

          <Typography
            sx={{
              flexGrow: 1,
              textAlign: "center",
              fontWeight: 900,
              fontSize: { xs: "24px", sm: "30px", md: "38px", lg: "44px" },
              letterSpacing: "3px",
              textTransform: "uppercase",
              background: "linear-gradient(90deg,#FFD700,#FFF176,#FFD700,#FFC107)",
              backgroundSize: "300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "goldShine 6s linear infinite",
              fontFamily: "'Playfair Display','Times New Roman',serif",
              textShadow: "2px 2px 6px rgba(0,0,0,0.6)",
            }}
          >
            {atelierNom}
            <style>
              {`
                @keyframes goldShine {
                  0% { background-position: 0% }
                  100% { background-position: 300% }
                }
              `}
            </style>
          </Typography>

          {logoUrl && (
            <img
              src={logoUrl}
              alt={t("Logo", "Logo", "شعار")}
              style={{ height: 50, objectFit: "contain" }}
            />
          )}
        </Toolbar>
      </AppBar>

      {/* Message défilant */}
      {messageDefilant && (
        <Box sx={{ overflow: "hidden", backgroundColor: "#FFD54F", py: 1 }}>
          <Typography
            sx={{
              whiteSpace: "nowrap",
              display: "inline-block",
              pl: "100%",
              animation: "scrollText 40s linear infinite",
              fontWeight: "bold",
            }}
          >
            {messageDefilant}
          </Typography>
          <style>{`
            @keyframes scrollText {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
        </Box>
      )}

      {/* Drawer Menu */}
      <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <List sx={{ width: 250 }}>
          <ListItem button component={Link} to="/">
            <ListItemText primary={t("Accueil", "Home", "الرئيسية")} />
          </ListItem>
          <ListItem button component={Link} to="/parametres">
            <ListItemText primary={t("Paramètres", "Settings", "الإعدادات")} />
          </ListItem>
          <ListItem button onClick={handleLogout}>
            <ListItemText primary={t("Déconnexion", "Logout", "تسجيل الخروج")} />
          </ListItem>
          <ListItem>
            <ListItemText primary={t("Langue", "Language", "اللغة")} />
          </ListItem>
          <ListItem>
            <Select
              fullWidth
              value={langue}
              onChange={(e) => setLangue(e.target.value)}
              style={{ width: "100%", padding: "6px", borderRadius: "4px" }}
            >
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="ar">العربية</MenuItem>
            </Select>
          </ListItem>
        </List>
      </Drawer>

{/* Sections en deux cadrans */}
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {t("Choisis une section :", "Choose a section:", "اختر قسماً :")}
        </Typography>

        <Grid container spacing={2} justifyContent="center">
          {/* Premier cadran */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Grid container spacing={2}>
                {sections.slice(0, 4).map((section, index) => (
                  <Grid item xs={6} key={index}>
                    <Box
                      sx={{
                        textDecoration: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: "50%",
                          backgroundColor: themeCouleur,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          mb: 1,
                        }}
                      >
                        {section.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: "center",
                          fontWeight: "bold",
                          minHeight: 36,
                          lineHeight: 1.2,
                        }}
                      >
                        {section.title}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mt: 1, backgroundColor: "#E65100" }}
                        component={Link}
                        to={section.path}
                      >
                        {t("Aller", "Go", "ذهب")}
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Deuxième cadran */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Grid container spacing={2}>
                {sections.slice(4, 8).map((section, index) => (
                  <Grid item xs={6} key={index}>
                    <Box
                      sx={{
                        textDecoration: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: "50%",
                          backgroundColor: themeCouleur,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          mb: 1,
                        }}
                      >
                        {section.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: "center",
                          fontWeight: "bold",
                          minHeight: 36,
                          lineHeight: 1.2,
                        }}
                      >
                        {section.title}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mt: 1, backgroundColor: "#E65100" }}
                        component={Link}
                        to={section.path}
                      >
                        {t("Aller", "Go", "ذهب")}
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Slider promo */}
      {imagesPromo.length > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 56,
            width: "100%",
            bgcolor: "#fff",
            borderTop: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            p: 1,
            zIndex: 1200,
          }}
        >
          <IconButton onClick={prevSlide}>
            <ChevronLeftIcon />
          </IconButton>

          <Box sx={{ width: "80%", overflow: "hidden" }}>
            <Box
              sx={{
                display: "flex",
                transform: `translateX(-${slideIndex * 100}%)`,
                transition: "transform 0.5s ease",
              }}
            >
              {imagesPromo.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt={t("promotion", "promotion", "عرض ترويجي")}
                  style={{
                    width: "80%",
                    height: 100,
                    objectFit: "contain",
                    borderRadius: 6,
                    flexShrink: 0,
                    margin: "0 auto",
                  }}
                />
              ))}
            </Box>
          </Box>

          <IconButton onClick={nextSlide}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default AccueilPage;
