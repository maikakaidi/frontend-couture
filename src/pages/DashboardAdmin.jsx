import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import LockResetIcon from "@mui/icons-material/LockReset";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageIcon from "@mui/icons-material/Language";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useTranslation } from "../hooks/useTranslation";

function DashboardAdmin() {
  const { t, langue, setLangue } = useTranslation(); // ← on prend langue et setLangue de TON hook
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [revenus, setRevenus] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("atelierId");
    navigate("/login");
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      const sorted = res.data.sort((a, b) => (a.role === "superadmin" ? -1 : 1));
      setUsers(sorted);
    } catch (err) {
      console.error(t("Erreur chargement utilisateurs", "Error loading users", "خطأ تحميل المستخدمين"), err);
      setError(t("Impossible de charger les utilisateurs", "Unable to load users", "غير قادر على تحميل المستخدمين"));
    }
  }, [t]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error(t("Erreur chargement stats", "Error loading stats", "خطأ تحميل الإحصائيات"), err);
    }
  }, [t]);

  const fetchMonthlyStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats/monthly");
      setMonthlyStats(res.data);
    } catch (err) {
      console.error(t("Erreur chargement stats mensuelles", "Error loading monthly stats", "خطأ تحميل الإحصائيات الشهرية"), err);
    }
  }, [t]);

  const fetchRevenus = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats/revenus");
      setRevenus(res.data.revenusTotaux || 0);
    } catch (err) {
      console.error(t("Erreur chargement revenus", "Error loading revenue", "خطأ تحميل الإيرادات"), err);
    }
  }, [t]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchUsers(), fetchStats(), fetchMonthlyStats(), fetchRevenus()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchUsers, fetchStats, fetchMonthlyStats, fetchRevenus]);

  const calculerJoursRestants = (dateFin) => {
    if (!dateFin) return null;
    const fin = new Date(dateFin);
    const aujourdHui = new Date();
    const diff = fin - aujourdHui;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  };

  const resetPassword = async (userId) => {
    if (!window.confirm(t("Réinitialiser le mot de passe à '123456' ?", "Reset password to '123456'?", "إعادة تعيين كلمة المرور إلى '123456'؟"))) return;

    try {
      await api.post(`/admin/users/reset-password/${userId}`, { newPassword: "123456" });
      alert(t("Mot de passe réinitialisé à 123456", "Password reset to 123456", "تم إعادة تعيين كلمة المرور إلى 123456"));
      fetchStats();
    } catch (err) {
      alert(t("Erreur lors de la réinitialisation", "Error during reset", "خطأ أثناء إعادة التعيين"));
    }
  };

  const supprimerUser = async (userId) => {
    if (!window.confirm(t("Supprimer définitivement cet utilisateur ?", "Permanently delete this user?", "حذف هذا المستخدم نهائيًا؟"))) return;

    try {
      await api.delete(`/admin/users/delete/${userId}`);
      alert(t("Utilisateur supprimé", "User deleted", "تم حذف المستخدم"));
      setUsers(users.filter((u) => u._id !== userId));
      fetchStats();
    } catch (err) {
      alert(t("Erreur suppression utilisateur", "Error deleting user", "خطأ حذف المستخدم"));
    }
  };

  const confirmerPaiement = async (userId, plan) => {
    if (!window.confirm(t(`Confirmer l'abonnement ${plan} pour cet atelier ?`, `Confirm ${plan} subscription for this workshop?`, `تأكيد اشتراك ${plan} لهذه الورشة؟`))) return;

    try {
      await api.put(`/admin/abonnements/activer/${userId}`, { type: plan });
      alert(t(`Abonnement ( {plan} confirmé`, ` ){plan} subscription confirmed`, `تم تأكيد اشتراك ${plan}`));
      fetchStats();
      fetchUsers();
    } catch (err) {
      alert(t("Erreur confirmation abonnement", "Error confirming subscription", "خطأ تأكيد الاشتراك"));
    }
  };

  const toggleUserStatus = async (userId, statut) => {
    try {
      await api.patch(`/admin/users/status/${userId}`, { statut });
      alert(t(`Utilisateur ${statut === "valide" ? "activé" : "désactivé"}`, `User ${statut === "valide" ? "activated" : "deactivated"}`, `تم ${statut === "valide" ? "تفعيل" : "تعطيل"} المستخدم`));
      setUsers(users.map((u) => (u._id === userId ? { ...u, statut } : u)));
      fetchStats();
    } catch (err) {
      alert(t("Erreur changement statut", "Error changing status", "خطأ تغيير الحالة"));
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nom?.toLowerCase().includes(search.toLowerCase().trim()) ||
      u.telephone?.includes(search.trim())
  );

  const barChartData = monthlyStats.map((item) => ({
    mois: item.mois,
    inscriptions: item.inscriptions,
    abonnements: item.abonnements,
  }));

  return (
    <Box sx={{ p: 3, pb: 10 }}>
      {/* === Bloc Langue + Déconnexion (visible et sans crash) === */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h4">
          👑 {t("Tableau de bord Superadmin", "Superadmin Dashboard", "لوحة تحكم السوبر أدمن")}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Choix de langue – avec TON hook */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LanguageIcon color="action" />
            <Select
              size="small"
              value={langue || "fr"}           // ← langue de ton hook
              onChange={(e) => setLangue(e.target.value)}  // ← setLangue de ton hook
              sx={{ minWidth: 80 }}
            >
              <MenuItem value="fr">FR</MenuItem>
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="ar">AR</MenuItem>
            </Select>
          </Box>

          {/* Bouton Déconnexion */}
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            size="medium"
          >
            {t("Déconnexion", "Logout", "تسجيل الخروج")}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TextField
        label={t("Rechercher un atelier (nom ou numéro)", "Search workshop (name or number)", "البحث عن ورشة (الاسم أو الرقم)")}
        variant="outlined"
        fullWidth
        sx={{ mb: 4 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <Box component="span">🔍</Box>,
        }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Statistiques globales */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              📊 {t("Statistiques globales", "Global Statistics", "الإحصائيات العامة")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={3}>
                <Typography variant="body2" color="text.secondary">
                  {t("Total utilisateurs", "Total users", "إجمالي المستخدمين")}
                </Typography>
                <Typography variant="h5">{stats.totalUsers || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <Typography variant="body2" color="text.secondary">
                  {t("Admins ateliers", "Workshop admins", "مديري الورش")}
                </Typography>
                <Typography variant="h5">{stats.totalAdmins || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <Typography variant="body2" color="text.secondary">
                  {t("Sous-users", "Sub-users", "المستخدمون الفرعيون")}
                </Typography>
                <Typography variant="h5">{stats.totalSousUsers || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <Typography variant="body2" color="text.secondary">
                  {t("Abonnements actifs", "Active subscriptions", "الاشتراكات النشطة")}
                </Typography>
                <Typography variant="h5">{stats.abonnementsActifs || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <Typography variant="body2" color="text.secondary">
                  {t("Abonnements inactifs", "Inactive subscriptions", "الاشتراكات غير النشطة")}
                </Typography>
                <Typography variant="h5">{stats.abonnementsInactifs || 0}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Revenus */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              💰 {t("Revenus estimés", "Estimated Revenue", "الإيرادات المتوقعة")}
            </Typography>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {revenus.toLocaleString()} {t("FCFA", "FCFA", "فرنك سيفا")}
            </Typography>
          </Paper>

          {/* Graphique mensuel */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              📈 {t("Inscriptions & Abonnements par mois", "Subscriptions & Registrations per month", "الاشتراكات والتسجيلات حسب الشهر")}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <XAxis dataKey="mois" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <RechartsTooltip formatter={(val) => `${val} ${t("utilisateurs", "users", "مستخدمين")}`} />
                <Bar dataKey="inscriptions" name={t("Inscriptions", "Registrations", "التسجيلات")} fill="#1976d2" />
                <Bar dataKey="abonnements" name={t("Abonnements", "Subscriptions", "الاشتراكات")} fill="#2e7d32" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Liste utilisateurs */}
          <Typography variant="h5" gutterBottom sx={{ mt: 6 }}>
            👥 {t("Utilisateurs internes", "Internal Users", "المستخدمون الداخليون")}
          </Typography>

          <Grid container spacing={3}>
            {filteredUsers.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">
                  {t("Aucun utilisateur trouvé", "No user found", "لم يتم العثور على مستخدم")}
                </Alert>
              </Grid>
            ) : (
              filteredUsers.map((user) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={user._id}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {user.nom || t("Sans nom", "No name", "بدون اسم")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📞 {user.telephone || "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {t("Rôle", "Role", "الدور")}: <strong>{user.role}</strong>
                    </Typography>

                    {user.role !== "superadmin" && user.abonnement && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          {t("Abonnement", "Subscription", "الاشتراك")}:{" "}
                          <strong>{user.abonnement?.type || t("Aucun", "None", "لا يوجد")}</strong> -{" "}
                          {user.abonnement?.actif ? (
                            <span style={{ color: "green" }}>Actif ✅</span>
                          ) : (
                            <span style={{ color: "red" }}>Inactif ❌</span>
                          )}
                        </Typography>

                        {user.abonnement?.actif ? (
                          <>
                            <Typography variant="body2" color="primary">
                              👥 {t("Compteur utilisateurs", "User counter", "عداد المستخدمين")}:{" "}
                              {user.abonnement?.compteur || 0}
                            </Typography>
                            <Typography variant="body2" color="secondary">
                              📅 {t("Jours restants", "Days remaining", "الأيام المتبقية")}:{" "}
                              {calculerJoursRestants(user.abonnement?.dateFin)} {t("jour(s)", "day(s)", "يوم/أيام")}
                            </Typography>
                          </>
                        ) : (
                          user.abonnement?.dateFin && (
                            <Typography variant="body2" color="primary">
                              ⏳ {t("Jours restants (essai)", "Days remaining (trial)", "الأيام المتبقية (تجربة)")} :{" "}
                              {calculerJoursRestants(user.abonnement.dateFin)} {t("jour(s)", "day(s)", "يوم/أيام")}
                            </Typography>
                          )
                        )}
                      </Box>
                    )}

                    <Box sx={{ mt: "auto", pt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                      <Tooltip title={t("Réinitialiser mot de passe", "Reset password", "إعادة تعيين كلمة المرور")}>
                        <IconButton
                          color="warning"
                          onClick={() => resetPassword(user._id)}
                        >
                          <LockResetIcon />
                        </IconButton>
                      </Tooltip>

                      {user.role === "superadmin" && (
                        <Tooltip title={t("Supprimer superadmin", "Delete superadmin", "حذف السوبر أدمن")}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteForeverIcon />}
                            onClick={() => supprimerUser(user._id)}
                          >
                            {t("Supprimer", "Delete", "حذف")}
                          </Button>
                        </Tooltip>
                      )}

                      {user.role === "adminatelier" && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => confirmerPaiement(user._id, "3mois")}
                          >
                            3 {t("mois", "months", "أشهر")}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => confirmerPaiement(user._id, "6mois")}
                          >
                            6 {t("mois", "months", "أشهر")}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => confirmerPaiement(user._id, "1an")}
                          >
                            1 {t("an", "year", "سنة")}
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => toggleUserStatus(user._id, "valide")}
                          >
                            {t("Activer", "Activate", "تفعيل")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => toggleUserStatus(user._id, "disabled")}
                          >
                            {t("Désactiver", "Deactivate", "تعطيل")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteForeverIcon />}
                            onClick={() => supprimerUser(user._id)}
                          >
                            {t("Supprimer", "Delete", "حذف")}
                          </Button>
                        </>
                      )}

                      {user.role === "soususer" && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => confirmerPaiement(user._id, "activation")}
                          >
                            {t("Confirmer activation (20k)", "Confirm activation (20k)", "تأكيد التفعيل (20 ألف)")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteForeverIcon />}
                            onClick={() => supprimerUser(user._id)}
                          >
                            {t("Supprimer", "Delete", "حذف")}
                          </Button>
                        </>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
        </>
      )}
    </Box>
  );
}

export default DashboardAdmin;
