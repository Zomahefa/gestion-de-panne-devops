import React, { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  ChartColumn,
  ClipboardList,
  Home,
  LogOut,
  UserCircle,
  Users,
} from "lucide-react";
import { clearAdminSession, isAdminAuthenticated } from "../utils/adminAuth";
import "./AdminShell.css";

const NAV = [
  { to: "/admin-dashboard", label: "Tableau de bord", Icon: ClipboardList, key: "dashboard" },
  { to: "/admin-technicians", label: "Techniciens", Icon: Users, key: "technicians" },
  { to: "/admin-chart", label: "Statistiques", Icon: ChartColumn, key: "chart" },
  { to: "/admin-profile", label: "Mon profil", Icon: UserCircle, key: "profile" },
];

const AdminShell = ({ title, subtitle, actions, children }) => {
  const navigate = useNavigate();

  // Aucune page d'administration ne doit s'afficher sans jeton : sans lui,
  // les appels API seraient refusés et l'écran resterait vide.
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin-login");
  };

  return (
    <div className="ashell">
      <aside className="ashell__side">
        <Link to="/admin-dashboard" className="ashell__brand">
          <img 
            src="/apple-touch-icon.png" 
            alt="Signaleo logo" 
            width="28" 
            height="28" 
            style={{ display: "block", borderRadius: "8px" }}
          />
          <span style={{ marginLeft: "8px", fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>Signaleo</span>
        </Link>

        <span className="ashell__badge">Administration</span>

        <nav className="ashell__nav" aria-label="Navigation administrateur">
          {NAV.map(({ to, label, Icon, key }) => (
            <NavLink
              key={key}
              to={to}
              className={({ isActive }) =>
                `ashell__link${isActive ? " ashell__link--active" : ""}`
              }
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ashell__bottom">
          <Link to="/suivi" className="ashell__link">
            <ArrowLeftRight size={17} aria-hidden="true" />
            Suivi client
          </Link>
          <Link to="/" className="ashell__link">
            <Home size={17} aria-hidden="true" />
            Site public
          </Link>
          <button type="button" className="ashell__logout" onClick={handleLogout}>
            <LogOut size={17} aria-hidden="true" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="ashell__main">
        <header className="ashell__topbar">
          <div className="ashell__heading">
            <h1 className="ashell__title">{title}</h1>
            {subtitle && <p className="ashell__sub">{subtitle}</p>}
          </div>
          {actions && <div className="ashell__actions">{actions}</div>}
        </header>

        <div className="ashell__content">{children}</div>
      </div>
    </div>
  );
};

export default AdminShell;
