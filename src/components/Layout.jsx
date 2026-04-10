// src/components/Layout.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.className = darkMode ? "light" : "dark";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className={`app-container ${darkMode ? "dark" : "light"}`}>
      {/ Sidebar /}
      <aside className="sidebar">
        <h2>Couture App</h2>
        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/clients">Clients</Link></li>
          </ul>
        </nav>
        <div className="sidebar-actions">
          <button onClick={toggleTheme}>
            {darkMode ? "☀️ Mode clair" : "🌙 Mode sombre"}
          </button>
          <button onClick={handleLogout}>🚪 Déconnexion</button>
        </div>
      </aside>

      {/ Contenu principal /}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
