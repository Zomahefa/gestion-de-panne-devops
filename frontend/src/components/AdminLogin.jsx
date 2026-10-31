import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";
import { DEMO_ADMIN } from "../utils/demoAccounts";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const navigate = useNavigate();

  const openSession = (data) => {
    localStorage.setItem("admin_token", data.token);
    // Identité du compte réellement connecté : indispensable pour que
    // « Mon profil » n'affiche pas un administrateur codé en dur.
    if (data.admin) {
      localStorage.setItem("admin_id", String(data.admin.id));
      localStorage.setItem("admin_username", data.admin.username);
      localStorage.setItem(
        "admin_is_super",
        data.admin.is_super_admin ? "1" : "0",
      );
    }
    navigate("/admin-dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}admin-login/`,
        { username, password },
      );
      openSession(res.data);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Trop de tentatives de connexion. Patientez une minute puis réessayez."
          : "Identifiants incorrects. Vérifiez le nom et le mot de passe.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setQuickLoading(true);
    setError("");
    setUsername(DEMO_ADMIN.username);
    setPassword(DEMO_ADMIN.password);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}admin-login/`,
        {
          username: DEMO_ADMIN.username,
          password: DEMO_ADMIN.password,
        },
      );
      openSession(res.data);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Trop de tentatives de connexion. Patientez une minute puis réessayez."
          : "La connexion rapide a échoué. Utilisez les champs ci-dessus.",
      );
    } finally {
      setQuickLoading(false);
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

      <div className="auth__demo">
        <p className="auth__demo-head">
          <Sparkles size={15} aria-hidden="true" />
          Connexion rapide — démo
        </p>
        <p className="auth__demo-line">
          Identifiant : <code>{DEMO_ADMIN.username}</code>
        </p>
        <p className="auth__demo-line">
          Mot de passe : <code>{DEMO_ADMIN.password}</code>
        </p>
        <button
          type="button"
          className="sig-btn sig-btn--ghost sig-btn--block auth__demo-btn"
          onClick={handleQuickLogin}
          disabled={quickLoading || loading}
        >
          {quickLoading ? (
            <LoaderCircle size={16} className="sig-spin" aria-hidden="true" />
          ) : (
            <LogIn size={16} aria-hidden="true" />
          )}
          {quickLoading ? "Connexion…" : "Entrer dans l'espace administrateur"}
        </button>
      </div>

      <p className="auth__switch">
        Pas encore de compte ?{" "}
        <Link to="/admin-register">Créer un compte admin</Link>
      </p>
    </AuthLayout>
  );
};

export default AdminLogin;
