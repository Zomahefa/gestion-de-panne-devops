import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ChartColumn,
  CircleCheck,
  CircleHelp,
  Camera,
  LoaderCircle,
  MapPin,
  Send,
  ShieldCheck,
  TriangleAlert,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import SignaleoLogo from "./SignaleoLogo.jsx";
import "./ClientForm.css";

const EMPTY_FORM = {
  client_name: "",
  contact: "",
  quartier: "",
  lot: "",
  localisation: "",
  description: "",
};

const ClientForm = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedImage, setSelectedImage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    setGeoError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        setFormData((prev) => ({ ...prev, localisation: coords }));
        setLocating(false);
      },
      () => {
        setGeoError(
          "Position indisponible. Saisissez votre adresse manuellement.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setSelectedImage(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      data.append("status", "pending");
      if (selectedImage) {
        data.append("image", selectedImage);
      }

      await axios.post(`${process.env.REACT_APP_API_URL}todos/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await axios.post(`${process.env.REACT_APP_API_URL}notify-admin/`, {
        message: `Nouvelle panne signalée par ${formData.client_name} à ${formData.localisation}`,
      });

      setSuccess(true);
      setError("");
      setGeoError("");
      setFormData(EMPTY_FORM);
      setSelectedImage(null);
      e.target.reset();
    } catch (err) {
      console.error("Erreur envoi :", err);
      setError("L'envoi a échoué. Vérifiez votre connexion puis réessayez.");
      setSuccess(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sig-shell">
      <header className="sig-header">
        <div className="sig-header__inner">
          <Link to="/" className="sig-brand" aria-label="Signaleo, accueil">
            <SignaleoLogo size={30} />
          </Link>

          <nav className="sig-nav" aria-label="Navigation principale">
            <Link to="/suivi" className="sig-nav__link">
              <ChartColumn size={17} aria-hidden="true" />
              Suivi
            </Link>
            <Link to="/help" className="sig-nav__link">
              <CircleHelp size={17} aria-hidden="true" />
              Aide
            </Link>
            <Link to="/login" className="sig-nav__link">
              <Wrench size={17} aria-hidden="true" />
              Technicien
            </Link>
            <Link
              to="/admin-login"
              className="sig-nav__link sig-nav__link--strong"
            >
              <ShieldCheck size={17} aria-hidden="true" />
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="sig-page sig-page--form">
        <div className="cf-hero">
          <span className="sig-eyebrow">
            <Zap size={15} aria-hidden="true" />
            Signalement en ligne
          </span>
          <h1 className="sig-title">Signaler une panne</h1>
          <p className="sig-sub">
            Décrivez la panne en quelques secondes. Un technicien est prévenu
            immédiatement et vous pouvez suivre l'intervention en temps réel.
          </p>
        </div>

        <form className="sig-card sig-card--pad sig-card--lift cf-form" onSubmit={handleSubmit}>
          <div className="sig-card__head">
            <h2 className="sig-card__title">
              <Zap size={19} aria-hidden="true" />
              Nouvelle déclaration
            </h2>
            <span className="cf-form__note">Tous les champs marqués * sont requis</span>
          </div>

          {success && (
            <div className="sig-alert sig-alert--ok cf-form__banner" role="status">
              <CircleCheck size={19} aria-hidden="true" />
              <span>
                Signalement envoyé. Un technicien est prévenu, vous pouvez suivre
                l'intervention dans l'onglet « Suivi ».
              </span>
            </div>
          )}

          {error && (
            <div className="sig-alert sig-alert--error cf-form__banner" role="alert">
              <TriangleAlert size={19} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="sig-grid">
            <div className="sig-field">
              <label className="sig-label" htmlFor="client_name">
                <User size={15} aria-hidden="true" />
                Nom du client *
              </label>
              <input
                id="client_name"
                className="sig-input"
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                placeholder="Ex. Rakoto Jean"
                autoComplete="name"
                required
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="contact">
                Téléphone *
              </label>
              <input
                id="contact"
                className="sig-input"
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Ex. 034 00 000 00"
                autoComplete="tel"
                required
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="quartier">
                <MapPin size={15} aria-hidden="true" />
                Quartier *
              </label>
              <input
                id="quartier"
                className="sig-input"
                type="text"
                name="quartier"
                value={formData.quartier}
                onChange={handleChange}
                placeholder="Ex. Analakely"
                required
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="lot">
                Lot / Bloc <span className="sig-label__optional">(optionnel)</span>
              </label>
              <input
                id="lot"
                className="sig-input"
                type="text"
                name="lot"
                value={formData.lot}
                onChange={handleChange}
                placeholder="Ex. Lot II M 45"
              />
            </div>

            <div className="sig-field sig-grid__full">
              <label className="sig-label" htmlFor="localisation">
                <MapPin size={15} aria-hidden="true" />
                Localisation précise *
              </label>
              <div className="sig-input-row">
                <input
                  id="localisation"
                  className="sig-input"
                  type="text"
                  name="localisation"
                  value={formData.localisation}
                  onChange={handleChange}
                  placeholder="Adresse ou coordonnées GPS"
                  required
                />
                <button
                  type="button"
                  className="sig-btn sig-btn--ghost"
                  onClick={detectLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <LoaderCircle size={17} className="sig-spin" aria-hidden="true" />
                  ) : (
                    <MapPin size={17} aria-hidden="true" />
                  )}
                  Ma position
                </button>
              </div>
              <span className="sig-hint">
                Saisissez une adresse, ou utilisez votre position actuelle pour la
                remplir automatiquement.
              </span>
              {geoError && (
                <span className="sig-hint cf-hint--error">{geoError}</span>
              )}
            </div>

            <div className="sig-field sig-grid__full">
              <label className="sig-label" htmlFor="description">
                Description de la panne *
              </label>
              <textarea
                id="description"
                className="sig-textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex. Coupure totale depuis ce matin, aucun compteur voisin n'est touché."
                required
              />
            </div>

            <div className="sig-field sig-grid__full">
              <span className="sig-label">
                <Camera size={15} aria-hidden="true" />
                Photo de la panne <span className="sig-label__optional">(optionnel)</span>
              </span>
              <label className="sig-file" htmlFor="image">
                <span className="sig-file__icon">
                  <Camera size={19} aria-hidden="true" />
                </span>
                <span className="sig-file__text">
                  <span className="sig-file__title">
                    {selectedImage
                      ? selectedImage.name
                      : "Ajouter une photo ou une capture"}
                  </span>
                  <span className="sig-file__sub">
                    JPG ou PNG, aide le technicien à identifier la panne
                  </span>
                </span>
                <input
                  id="image"
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <div className="cf-actions">
            <button
              type="submit"
              className="sig-btn sig-btn--accent cf-submit"
              disabled={sending}
            >
              {sending ? (
                <LoaderCircle size={18} className="sig-spin" aria-hidden="true" />
              ) : (
                <Send size={18} aria-hidden="true" />
              )}
              {sending ? "Envoi en cours…" : "Envoyer le signalement"}
            </button>
            <Link to="/help" className="sig-btn sig-btn--ghost">
              <CircleHelp size={17} aria-hidden="true" />
              Besoin d'aide ?
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ClientForm;
