import React, { useState, useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";

import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  CircularProgress,
  Box,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpIcon from "@mui/icons-material/Help";

// Services
import { startAutoSync, syncAll, syncPendingChanges } from "./services/syncService";
import { initDB } from "./services/db";
import { useTranslation } from "./hooks/useTranslation";

// ====================== IMPORTS DIRECTS (Pages critiques) ======================
import SplashScreen from "./pages/SplashScreen";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EmployeesPage from "./pages/EmployeesPage";
import CommandesPage from "./pages/CommandesPage";
import ClientMesuresPage from "./pages/ClientMesuresPage";
import AdminParametresPage from "./pages/AdminParametresPage";

// ====================== LAZY LOADING (Pages non critiques) ======================
const AccueilPage = React.lazy(() => import("./pages/AccueilPage"));
const ClientsPage = React.lazy(() => import("./pages/ClientsPage"));
const ArticlesPage = React.lazy(() => import("./pages/ArticlesPage"));
const ParametresPage = React.lazy(() => import("./pages/ParametresPage"));
const FinancesPage = React.lazy(() => import("./pages/FinancesPage"));
const AbonnementPage = React.lazy(() => import("./pages/AbonnementPage"));
const GaleriePage = React.lazy(() => import("./pages/GaleriePage"));
const AidePage = React.lazy(() => import("./pages/AidePage"));
const VentesPage = React.lazy(() => import("./pages/VentesPage"));
const DepensesPage = React.lazy(() => import("./pages/DepensesPage"));
const DashboardAdmin = React.lazy(() => import("./pages/DashboardAdmin"));

// ====================== GUARDS ======================
function PrivateSuperAdminRoute({ children, role }) {
  if (role !== "superadmin") return <Navigate to="/accueil" replace />;
  return children;
}

function PrivateUserRoute({ children, role }) {
  if (!role || !["user", "soususer", "adminatelier"].includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ====================== LOADER ======================
const PageLoader = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
    <CircularProgress />
  </Box>
);

function AppContent() {
  const { t } = useTranslation();
  const location = useLocation();
  const publicPaths = ["/", "/login", "/register"];

  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [value, setValue] = useState(0);

  // Initialisation DB
  useEffect(() => {
    const startDB = async () => {
      await initDB();
      console.log("✅ DB initialisée");
    };
    startDB();
  }, []);

  // Sync automatique
  useEffect(() => {
    startAutoSync();
    syncAll();
  }, []);

  // Écoute du storage
  useEffect(() => {
    const handleStorage = () => {
      setRole(localStorage.getItem("role"));
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Gestion du retour en ligne
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Internet revenu → synchronisation");
      syncPendingChanges();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <>
      {/* Suspense global pour éviter les pages blanches */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage setRole={setRole} setToken={setToken} />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes Utilisateur */}
          <Route path="/accueil" element={<PrivateUserRoute role={role}><AccueilPage /></PrivateUserRoute>} />
          <Route path="/employes" element={<PrivateUserRoute role={role}><EmployeesPage /></PrivateUserRoute>} />
          <Route path="/clients" element={<PrivateUserRoute role={role}><ClientsPage /></PrivateUserRoute>} />
          <Route path="/clients/:clientId/mesures" element={<PrivateUserRoute role={role}><ClientMesuresPage /></PrivateUserRoute>} />
          <Route path="/commandes" element={<PrivateUserRoute role={role}><CommandesPage /></PrivateUserRoute>} />
          <Route path="/commandes/:clientId" element={<PrivateUserRoute role={role}><CommandesPage /></PrivateUserRoute>} />
          <Route path="/articles" element={<PrivateUserRoute role={role}><ArticlesPage /></PrivateUserRoute>} />
          <Route path="/ventes" element={<PrivateUserRoute role={role}><VentesPage /></PrivateUserRoute>} />
          <Route path="/depenses" element={<PrivateUserRoute role={role}><DepensesPage /></PrivateUserRoute>} />
          <Route path="/parametres" element={<PrivateUserRoute role={role}><ParametresPage /></PrivateUserRoute>} />
          <Route path="/finances" element={<PrivateUserRoute role={role}><FinancesPage /></PrivateUserRoute>} />
          <Route path="/abonnement" element={<PrivateUserRoute role={role}><AbonnementPage /></PrivateUserRoute>} />
          <Route path="/galerie" element={<PrivateUserRoute role={role}><GaleriePage /></PrivateUserRoute>} />
          <Route path="/aide" element={<PrivateUserRoute role={role}><AidePage /></PrivateUserRoute>} />

          {/* Routes Super Admin */}
          <Route path="/dashboard-admin" element={<PrivateSuperAdminRoute role={role}><DashboardAdmin /></PrivateSuperAdminRoute>} />
          <Route path="/admin/parametres" element={<PrivateSuperAdminRoute role={role}><AdminParametresPage /></PrivateSuperAdminRoute>} />
        </Routes>
      </Suspense>

      {/* Navigation Utilisateur */}
      {token && role && ["user", "soususer", "adminatelier"].includes(role) && !publicPaths.includes(location.pathname) && (
        <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200 }} elevation={3}>
          <BottomNavigation value={value} onChange={(e, newValue) => setValue(newValue)} showLabels>
            <BottomNavigationAction label={t("Accueil", "Home", "الرئيسية")} icon={<HomeIcon sx={{ fontSize: 32 }} />} component={Link} to="/accueil" />
            <BottomNavigationAction label={t("Employés", "Employees", "الموظفون")} icon={<PeopleIcon sx={{ fontSize: 32 }} />} component={Link} to="/employes" />
            <BottomNavigationAction label={t("Clients", "Clients", "العملاء")} icon={<GroupIcon sx={{ fontSize: 32 }} />} component={Link} to="/clients" />
            <BottomNavigationAction label={t("Aide", "Help", "المساعدة")} icon={<HelpIcon sx={{ fontSize: 32 }} />} component={Link} to="/aide" />
            <BottomNavigationAction label={t("Paramètres", "Settings", "الإعدادات")} icon={<SettingsIcon sx={{ fontSize: 32 }} />} component={Link} to="/parametres" />
          </BottomNavigation>
        </Paper>
      )}

      {/* Navigation Super Admin */}
      {token && role === "superadmin" && !publicPaths.includes(location.pathname) && (
        <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200 }} elevation={3}>
          <BottomNavigation value={value} onChange={(e, newValue) => setValue(newValue)} showLabels>
            <BottomNavigationAction label={t("Dashboard", "Dashboard", "لوحة التحكم")} icon={<HomeIcon sx={{ fontSize: 32 }} />} component={Link} to="/dashboard-admin" />
            <BottomNavigationAction label={t("Paramètres Admin", "Admin Settings", "إعدادات الإدارة")} icon={<SettingsIcon sx={{ fontSize: 32 }} />} component={Link} to="/admin/parametres" />
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
