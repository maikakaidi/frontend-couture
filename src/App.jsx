import React, { useState, useEffect } from "react";
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
 
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpIcon from "@mui/icons-material/Help";

import { startAutoSync, syncAll, syncPendingChanges } from "./services/syncService";
import { initDB } from "./services/db";
import { useTranslation } from "./hooks/useTranslation";

// ====================== IMPORTS DIRECTS (TOUT EN DIRECT - PLUS DE LAZY) ======================
import SplashScreen from "./pages/SplashScreen";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccueilPage from "./pages/AccueilPage";
import EmployeesPage from "./pages/EmployeesPage";
import ClientsPage from "./pages/ClientsPage";
import CommandesPage from "./pages/CommandesPage";
import ArticlesPage from "./pages/ArticlesPage";
import ClientMesuresPage from "./pages/ClientMesuresPage";
import ParametresPage from "./pages/ParametresPage";
import FinancesPage from "./pages/FinancesPage";
import AbonnementPage from "./pages/AbonnementPage";
import GaleriePage from "./pages/GaleriePage";
import AidePage from "./pages/AidePage";
import VentesPage from "./pages/VentesPage";
import DepensesPage from "./pages/DepensesPage";
import DashboardAdmin from "./pages/DashboardAdmin";
import AdminParametresPage from "./pages/AdminParametresPage";

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

function AppContent() {
  const { t } = useTranslation();
  const location = useLocation();
  const publicPaths = ["/", "/login", "/register"];

  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [value, setValue] = useState(0);

  // Initialisation DB + Sync
  useEffect(() => {
    const startDB = async () => {
      await initDB();
      console.log("✅ DB initialisée");
    };
    startDB();
  }, []);

  useEffect(() => {
    startAutoSync();
    syncAll();
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setRole(localStorage.getItem("role"));
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage setRole={setRole} setToken={setToken} />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* USER ROUTES */}
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

        {/* SUPER ADMIN ROUTES */}
        <Route path="/dashboard-admin" element={<PrivateSuperAdminRoute role={role}><DashboardAdmin /></PrivateSuperAdminRoute>} />
        <Route path="/admin/parametres" element={<PrivateSuperAdminRoute role={role}><AdminParametresPage /></PrivateSuperAdminRoute>} />
      </Routes>

      {/* Navigation USER */}
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

      {/* Navigation SUPER ADMIN */}
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
