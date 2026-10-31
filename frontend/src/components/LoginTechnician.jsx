import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  Sparkles,
  TriangleAlert,
  User,
  Wrench,
} from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";
import { DEMO_TECHNICIAN } from "../utils/demoAccounts";

const LoginTechnician = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const navigate = useNavigate();

  const openSession = (data, usernameValue) => {
    localStorage.setItem("token", data.access);
    localStorage.setItem("username", usernameValue);
    navigate("/technicien");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}token/`, {
        username,
        password,
      });
      openSession(res.data, username);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Trop de tentatives de connexion. Patientez une minute puis réessayez."
          : "Nom d'utilisateur ou mot de passe incorrect.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setQuickLoading(true);
    setError("");
    setUsername(DEMO_TECHNICIAN.username);
    setPassword(DEMO_TECHNICIAN.password);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}token/`, {
        username: DEMO_TECHNICIAN.username,
        password: DEMO_TECHNICIAN.password,
      });
      openSession(res.data, DEMO_TECHNICIAN.username);
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
      Icon={Wrench}
      role="Technicien"
      title="Connexion technicien"
      subtitle="Consultez les pannes qui vous sont affectées et mettez à jour leur statut en temps réel."
      panelTitle="Interventions sur le terrain"
      panelText="Chaque panne affectée apparaît ici avec sa localisation, sa photo et son niveau d'urgence."
      accent="accent-soft"
      points={[
        "Liste des pannes affectées",
        "Mise à jour du statut en un clic",
        "Localisation et photos du terrain",
      ]}
    >
      <form className="auth__form" onSubmit={handleLogin}>
        <div className="auth__field">
          <label className="sig-label" htmlFor="tech-username">
            <User size={15} aria-hidden="true" />
            Nom d'utilisateur
          </label>
          <input
            id="tech-username"
            type="text"
            name="username"
            autoComplete="username"
            className="sig-input"
            placeholder="Ex. tech123"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="auth__field">
          <label className="sig-label" htmlFor="tech-password">
            Mot de passe
          </label>
          <div className="auth__pass">
            <input
              id="tech-password"
              type={showPassword ? "text" : "password"}
              name="password"
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
          Identifiant : <code>{DEMO_TECHNICIAN.username}</code>
        </p>
        <p className="auth__demo-line">
          Mot de passe : <code>{DEMO_TECHNICIAN.password}</code>
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
          {quickLoading ? "Connexion…" : "Entrer dans l'espace technicien"}
        </button>
      </div>
    </AuthLayout>
  );
};

export default LoginTechnician;
