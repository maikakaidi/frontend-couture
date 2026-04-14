import React, { useState, useEffect, Suspense, lazy } from "react";
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

import { startAutoSync, syncAll, syncPendingChanges } from "./services/syncService";
import { initDB } from "./services/db";
import { useTranslation } from "./hooks/useTranslation";

// ====================== PAGES DIRECTES (IMPORTANT - PAS DE LAZY) ======================
import SplashScreen from "./pages/SplashScreen";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import EmployeesPage from "./pages/EmployeesPage";
import CommandesPage from "./pages/CommandesPage";
import ClientMesuresPage from "./pages/ClientMesuresPage";
import AdminParametresPage from "./pages/AdminParametresPage";

// ====================== LAZY (PAGES NON CRITIQUES) ======================
const AccueilPage = lazy(() => import("./pages/AccueilPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage"));
const ParametresPage = lazy(() => import("./pages/ParametresPage"));
const FinancesPage = lazy(() => import("./pages/FinancesPage"));
const AbonnementPage = lazy(() => import("./pages/AbonnementPage"));
const GaleriePage = lazy(() => import("./pages/GaleriePage"));
const AidePage = lazy(() => import("./pages/AidePage"));
const VentesPage = lazy(() => import("./pages/VentesPage"));
const DepensesPage = lazy(() => import("./pages/DepensesPage"));
const DashboardAdmin = lazy(() => import("./pages/DashboardAdmin"));

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
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "80vh",
    }}
  >
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

  // DB init
  useEffect(() => {
    const startDB = async () => {
      await initDB();
      console.log("✅ DB initialisée");
    };
    startDB();
  }, []);

  // Sync auto
  useEffect(() => {
    startAutoSync();
    syncAll();
  }, []);

  // Storage listener
  useEffect(() => {
    const handleStorage = () => {
      setRole(localStorage.getItem("role"));
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Online sync
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
      {/* 🔥 GLOBAL SUSPENSE (ANTI PAGE BLANCHE) */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage setRole={setRole} setToken={setToken} />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* USER */}
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

          {/* ADMIN */}
          <Route path="/dashboard-admin" element={<PrivateSuperAdminRoute role={role}><DashboardAdmin /></PrivateSuperAdminRoute>} />
          <Route path="/admin/parametres" element={<PrivateSuperAdminRoute role={role}><AdminParametresPage /></PrivateSuperAdminRoute>} />
        </Routes>
      </Suspense>

      {/* NAV USER */}
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

      {/* NAV ADMIN */}
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
