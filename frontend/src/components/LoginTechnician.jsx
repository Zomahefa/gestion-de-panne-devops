import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  TriangleAlert,
  User,
  Wrench,
} from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";

const LoginTechnician = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}token/`, {
        username,
        password,
      });
      localStorage.setItem("token", res.data.access);
      localStorage.setItem("username", username);
      navigate("/technicien");
    } catch (err) {
      setError("Nom d'utilisateur ou mot de passe incorrect.");
    } finally {
      setLoading(false);
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
    </AuthLayout>
  );
};

export default LoginTechnician;
