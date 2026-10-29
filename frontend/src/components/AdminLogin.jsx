import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}admin-login/`,
        { username, password },
      );
      localStorage.setItem("admin_token", res.data.token);
      // Identité du compte réellement connecté : indispensable pour que
      // « Mon profil » n'affiche pas un administrateur codé en dur.
      if (res.data.admin) {
        localStorage.setItem("admin_id", String(res.data.admin.id));
        localStorage.setItem("admin_username", res.data.admin.username);
      }
      navigate("/admin-dashboard");
    } catch (err) {
      setError("Identifiants incorrects. Vérifiez le nom et le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      Icon={ShieldCheck}
      role="Administrateur"
      title="Connexion administrateur"
      subtitle="Pilotez les signalements, affectez les techniciens et suivez les statistiques."
      panelTitle="Supervision des interventions"
      panelText="Un poste de pilotage unique pour suivre chaque panne, du signalement du client jusqu'à la résolution par le technicien."
      points={[
        "Tableau de bord temps réel",
        "Affectation au bon technicien",
        "Statistiques et historique",
      ]}
      accent="accent-soft"
    >
      <form className="auth__form" onSubmit={handleLogin}>
        <div className="auth__field">
          <label className="sig-label" htmlFor="admin-username">
            <Users size={15} aria-hidden="true" />
            Nom d'utilisateur
          </label>
          <input
            id="admin-username"
            type="text"
            name="username"
            autoComplete="username"
            className="sig-input"
            placeholder="Ex. admin123"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="auth__field">
          <label className="sig-label" htmlFor="admin-password">
            Mot de passe
          </label>
          <div className="auth__pass">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              className="sig-input"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth__pass-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="auth__error" role="alert">
            <TriangleAlert size={16} aria-hidden="true" />
            {error}
          </p>
        )}

        <button
          type="submit"
          className="sig-btn sig-btn--primary sig-btn--block"
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle size={18} className="sig-spin" aria-hidden="true" />
          ) : (
            <LogIn size={18} aria-hidden="true" />
          )}
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="auth__switch">
        Pas encore de compte ?{" "}
        <Link to="/admin-register">Créer un compte admin</Link>
      </p>
    </AuthLayout>
  );
};

export default AdminLogin;
