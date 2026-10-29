import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
  User,
  UserPlus,
} from "lucide-react";
import AuthLayout from "./AuthLayout.jsx";

/**
 * Création d'un compte administrateur.
 *
 * Contexte métier : Signaleo est une application d'entreprise. Le compte
 * administrateur de référence est créé directement en base par le
 * développeur (commande `create_admin`). Cette page existe uniquement pour
 * la démonstration portfolio : elle exige un code de validation remis
 * sur demande par le développeur.
 */
const AdminRegister = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    validation_code: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}admin-register/`, formData);
      setSuccess("Compte créé. Redirection vers la connexion…");
      setFormData({ username: "", password: "", validation_code: "" });
      setTimeout(() => navigate("/admin-login"), 1200);
    } catch (err) {
      const message =
        err.response?.status === 429
          ? "Trop de tentatives. Patientez avant de réessayer."
          : err.response?.data?.error ||
            "Création impossible. Vérifiez le code de validation.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      Icon={ShieldCheck}
      role="Administrateur"
      title="Créer un compte admin"
      subtitle="Réservé aux personnes disposant du code de validation remis par le développeur."
      panelTitle="Compte administrateur"
      panelText="Signaleo est déployé pour une entreprise : les comptes sont créés par le développeur. Ce formulaire permet d'explorer les fonctions d'administration sur la version de démonstration."
      points={[
        "Code de validation remis sur demande",
        "Accès complet au tableau de bord",
        "Gestion des techniciens et des pannes",
      ]}
      accent="accent-soft"
    >
      <form className="auth__form" onSubmit={handleSubmit}>
        <div className="auth__field">
          <label className="sig-label" htmlFor="reg-username">
            <User size={15} aria-hidden="true" />
            Nom d'utilisateur
          </label>
          <input
            id="reg-username"
            type="text"
            name="username"
            autoComplete="username"
            className="sig-input"
            placeholder="Ex. admin.rakoto"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth__field">
          <label className="sig-label" htmlFor="reg-password">
            Mot de passe
          </label>
          <div className="auth__pass">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              className="sig-input"
              placeholder="8 caractères minimum"
              minLength={8}
              value={formData.password}
              onChange={handleChange}
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

        <div className="auth__field">
          <label className="sig-label" htmlFor="reg-code">
            <ShieldCheck size={15} aria-hidden="true" />
            Code de validation
          </label>
          <input
            id="reg-code"
            type="text"
            name="validation_code"
            autoComplete="one-time-code"
            className="sig-input"
            placeholder="Code remis par le développeur"
            maxLength={32}
            value={formData.validation_code}
            onChange={handleChange}
            required
          />
          <span className="sig-hint">
            Code fourni par le développeur, sur demande à{" "}
            <a href="mailto:zomahefaranaivo@gmail.com">
              zomahefaranaivo@gmail.com
            </a>
            .
          </span>
        </div>

        {error && (
          <p className="auth__error" role="alert">
            <TriangleAlert size={16} aria-hidden="true" />
            {error}
          </p>
        )}

        {success && (
          <p className="auth__error auth__error--ok" role="status">
            <ShieldCheck size={16} aria-hidden="true" />
            {success}
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
            <UserPlus size={18} aria-hidden="true" />
          )}
          {loading ? "Création…" : "Créer le compte"}
        </button>
      </form>

      <p className="auth__switch">
        Déjà un compte ?{" "}
        <Link to="/admin-login">Se connecter</Link>
      </p>
    </AuthLayout>
  );
};

export default AdminRegister;
