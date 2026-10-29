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
import "./ClientForm.css";

const API_URL = process.env.REACT_APP_API_URL;

// Validation rules
const VALIDATION_RULES = {
  client_name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÀ-ÿ\s\-'.]+$/,
    message:
      "Le nom doit contenir au moins 2 caractères et seulement des lettres, espaces, hyphens et apostrophes",
  },
  contact: {
    required: true,
    pattern: /^\d{9,15}$/,
    message: "Veuillez entrer un numéro de téléphone valide (9-15 chiffres)",
  },
  quartier: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÀ-ÿ\s\-'.]+$/,
    message: "Le quartier doit contenir au moins 2 caractères",
  },
  lot: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-./]+$/,
    message: "Le lot/bloc contient des caractères invalides",
  },
  localisation: {
    required: true,
    minLength: 5,
    maxLength: 200,
    message: "Veuillez entrer une adresse ou des coordonnées GPS valides",
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 2000,
    message:
      "La description doit contenir au moins 10 caractères (maximum 2000)",
  },
};

const EMPTY_FORM = {
  client_name: "",
  contact: "",
  quartier: "",
  lot: "",
  localisation: "",
  description: "",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

// Les gens écrivent souvent « 034 11 222 33 » : on ignore les séparateurs
// pour la validation et pour l'envoi, tout en gardant l'affichage saisi.
const normalizePhone = (value) => (value || "").replace(/[\s.-]/g, "");

const ClientForm = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    setGeoError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(
          5,
        )}, ${position.coords.longitude.toFixed(5)}`;
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

  const handleImageChange = (e) => {
    const file = e.target.files[0] || null;

    if (!file) {
      setSelectedImage(null);
      setImageError("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedImage(null);
      setImageError("Le fichier choisi n'est pas une image (JPG ou PNG).");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setSelectedImage(null);
      setImageError(
        `La photo est trop lourde (${(file.size / 1024 / 1024).toFixed(
          1,
        )} Mo). Maximum 5 Mo.`,
      );
      e.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImageError("");
  };

  const validateField = (name, value) => {
    const rule = VALIDATION_RULES[name];
    if (!rule) return "";

    const candidate = name === "contact" ? normalizePhone(value) : value;

    if (rule.required && (!candidate || candidate.trim() === "")) {
      return "Ce champ est requis";
    }

    if (!candidate || candidate.trim() === "") {
      return "";
    }

    if (rule.minLength && candidate.length < rule.minLength) {
      return rule.message || `Minimum ${rule.minLength} caractères requis`;
    }

    if (rule.maxLength && candidate.length > rule.maxLength) {
      return `Maximum ${rule.maxLength} caractères autorisés (actuellement ${candidate.length})`;
    }

    if (rule.pattern && !rule.pattern.test(candidate)) {
      return rule.message || "Format invalide";
    }

    return "";
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(VALIDATION_RULES).forEach((fieldName) => {
      const message = validateField(fieldName, formData[fieldName]);
      if (message) errors[fieldName] = message;
    });

    // Une adresse saisie à la main doit être suffisamment précise.
    if (formData.localisation && !formData.localisation.includes(",")) {
      if (formData.localisation.trim().length < 10) {
        errors.localisation =
          "Veuillez fournir une adresse plus complète ou utiliser la géolocalisation";
      }
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Le clic ne doit jamais rester « silencieux » : on affiche toutes les
      // erreurs, y compris celles des champs que l'utilisateur n'a pas touchés.
      setFieldErrors(errors);
      setTouchedFields(
        Object.keys(VALIDATION_RULES).reduce(
          (acc, field) => ({ ...acc, [field]: true }),
          {},
        ),
      );
      setError("Veuillez corriger les champs signalés avant d'envoyer.");
      setSuccess(false);

      const firstField = Object.keys(errors)[0];
      window.requestAnimationFrame(() => {
        document.getElementById(firstField)?.focus();
      });
      return;
    }

    setSending(true);
    setError("");
    setSuccess(false);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value ?? "");
      });
      // Le téléphone est envoyé sans espaces ni points.
      data.set("contact", normalizePhone(formData.contact));
      data.append("status", "pending");

      if (selectedImage) {
        data.append("image", selectedImage, selectedImage.name);
      }

      // 60 s : assez pour un réveil Render + un upload Cloudinary, mais le
      // formulaire ne peut plus tourner indéfiniment.
      await axios.post(`${API_URL}todos/`, data, { timeout: 60000 });

      // La notification est un bonus : son échec ne doit jamais faire croire
      // que le signalement n'a pas été enregistré.
      axios
        .post(
          `${API_URL}notify-admin/`,
          {
            message: `Nouvelle panne signalée par ${formData.client_name} à ${formData.localisation}`,
          },
          { timeout: 15000 },
        )
        .catch((notifyError) => {
          console.warn("Notification admin non envoyée :", notifyError);
        });

      setSuccess(true);
      setError("");
      setGeoError("");
      setImageError("");
      setFieldErrors({});
      setTouchedFields({});
      setFormData(EMPTY_FORM);
      setSelectedImage(null);

      const imageInput = document.getElementById("image");
      if (imageInput) imageInput.value = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erreur envoi :", err);

      let message =
        "L'envoi a échoué. Vérifiez votre connexion puis réessayez.";

      if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
        message =
          "Le serveur met trop de temps à répondre. Vérifiez votre connexion puis réessayez.";
      } else if (err.response?.status === 429) {
        message =
          "Trop de signalements envoyés depuis cette connexion. Patientez une minute puis réessayez.";
      } else if (err.response?.data) {
        const payload = err.response.data;
        if (typeof payload === "string") {
          message = payload;
        } else if (typeof payload === "object") {
          const firstMessage = Object.values(payload)
            .flat()
            .find((value) => typeof value === "string");
          if (firstMessage) message = firstMessage;
        }
      }

      setError(message);
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
            <img
              src="/apple-touch-icon.png"
              alt="Signaleo logo"
              width="30"
              height="30"
              style={{ display: "block", borderRadius: "8px" }}
            />
            <span
              style={{
                marginLeft: "8px",
                fontSize: "18px",
                fontWeight: "800",
                color: "#003366",
              }}
            >
              Signaleo
            </span>
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

        <form
          className="sig-card sig-card--pad sig-card--lift cf-form"
          onSubmit={handleSubmit}
          noValidate
          aria-describedby="form-help"
        >
          <div className="sig-card__head">
            <h2 className="sig-card__title">
              <Zap size={19} aria-hidden="true" />
              Nouvelle déclaration
            </h2>
            <span className="cf-form__note">
              Tous les champs marqués * sont requis
            </span>
          </div>

          {success && (
            <div
              className="sig-alert sig-alert--ok cf-form__banner"
              role="status"
              aria-live="polite"
            >
              <CircleCheck size={19} aria-hidden="true" />
              <div>
                <span>
                  Signalement envoyé. Un technicien est prévenu, vous pouvez
                  suivre l'intervention dans l'onglet « Suivi ».
                </span>
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    to="/suivi"
                    className="sig-btn sig-btn--primary sig-btn--sm"
                  >
                    Voir le suivi
                  </Link>
                  <button
                    type="button"
                    className="sig-btn sig-btn--ghost sig-btn--sm"
                    onClick={() => setSuccess(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              className="sig-alert sig-alert--error cf-form__banner"
              role="alert"
              aria-live="assertive"
            >
              <TriangleAlert size={19} aria-hidden="true" />
              <div>
                <span>{error}</span>
                <div style={{ marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="sig-btn sig-btn--ghost sig-btn--sm"
                    style={{
                      color: "inherit",
                      borderColor: "currentColor",
                    }}
                  >
                    Compris
                  </button>
                </div>
              </div>
            </div>
          )}

          <div id="form-help" className="sig-sr-only">
            Formulaire de signalement de panne. Tous les champs marqués d'un
            astérisque sont requis. Validation en temps réel activée.
          </div>

          <div className="sig-grid">
            <div className="sig-field">
              <label
                className="sig-label"
                htmlFor="client_name"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <User size={15} aria-hidden="true" />
                  Nom du client *
                </span>
                {touchedFields.client_name && fieldErrors.client_name && (
                  <span
                    className="sig-hint cf-hint--error"
                    style={{ fontWeight: "normal" }}
                  >
                    {fieldErrors.client_name}
                  </span>
                )}
              </label>
              <input
                id="client_name"
                className={`sig-input ${
                  touchedFields.client_name && fieldErrors.client_name
                    ? "sig-input--error"
                    : ""
                }`}
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                placeholder="Ex. Rakoto Jean"
                autoComplete="name"
                required
                aria-invalid={
                  !!(touchedFields.client_name && fieldErrors.client_name)
                }
                aria-describedby={
                  touchedFields.client_name && fieldErrors.client_name
                    ? "client_name_error"
                    : null
                }
              />
              {touchedFields.client_name && fieldErrors.client_name && (
                <div id="client_name_error" className="sig-hint cf-hint--error">
                  {fieldErrors.client_name}
                </div>
              )}
            </div>

            <div className="sig-field">
              <label
                className="sig-label"
                htmlFor="contact"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Téléphone *</span>
                {touchedFields.contact && fieldErrors.contact && (
                  <span
                    className="sig-hint cf-hint--error"
                    style={{ fontWeight: "normal" }}
                  >
                    {fieldErrors.contact}
                  </span>
                )}
              </label>
              <input
                id="contact"
                className={`sig-input ${
                  touchedFields.contact && fieldErrors.contact
                    ? "sig-input--error"
                    : ""
                }`}
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Ex. 034 00 000 00"
                autoComplete="tel"
                required
                aria-invalid={
                  !!(touchedFields.contact && fieldErrors.contact)
                }
                aria-describedby={
                  touchedFields.contact && fieldErrors.contact
                    ? "contact_error"
                    : null
                }
              />
              {touchedFields.contact && fieldErrors.contact && (
                <div id="contact_error" className="sig-hint cf-hint--error">
                  {fieldErrors.contact}
                </div>
              )}
            </div>

            <div className="sig-field">
              <label
                className="sig-label"
                htmlFor="quartier"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <MapPin size={15} aria-hidden="true" />
                  Quartier *
                </span>
                {touchedFields.quartier && fieldErrors.quartier && (
                  <span
                    className="sig-hint cf-hint--error"
                    style={{ fontWeight: "normal" }}
                  >
                    {fieldErrors.quartier}
                  </span>
                )}
              </label>
              <input
                id="quartier"
                className={`sig-input ${
                  touchedFields.quartier && fieldErrors.quartier
                    ? "sig-input--error"
                    : ""
                }`}
                type="text"
                name="quartier"
                value={formData.quartier}
                onChange={handleChange}
                placeholder="Ex. Analakely"
                required
                aria-invalid={
                  !!(touchedFields.quartier && fieldErrors.quartier)
                }
                aria-describedby={
                  touchedFields.quartier && fieldErrors.quartier
                    ? "quartier_error"
                    : null
                }
              />
              {touchedFields.quartier && fieldErrors.quartier && (
                <div id="quartier_error" className="sig-hint cf-hint--error">
                  {fieldErrors.quartier}
                </div>
              )}
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="lot">
                Lot / Bloc <span className="sig-label__optional">(optionnel)</span>
              </label>
              <input
                id="lot"
                className={`sig-input ${
                  touchedFields.lot && fieldErrors.lot ? "sig-input--error" : ""
                }`}
                type="text"
                name="lot"
                value={formData.lot}
                onChange={handleChange}
                placeholder="Ex. Lot II M 45"
              />
              {touchedFields.lot && fieldErrors.lot && (
                <div id="lot_error" className="sig-hint cf-hint--error">
                  {fieldErrors.lot}
                </div>
              )}
            </div>

            <div className="sig-field sig-grid__full">
              <label
                className="sig-label"
                htmlFor="localisation"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <MapPin size={15} aria-hidden="true" />
                  Localisation précise *
                </span>
                {touchedFields.localisation && fieldErrors.localisation && (
                  <span
                    className="sig-hint cf-hint--error"
                    style={{ fontWeight: "normal" }}
                  >
                    {fieldErrors.localisation}
                  </span>
                )}
              </label>
              <div className="sig-input-row">
                <input
                  id="localisation"
                  className={`sig-input ${
                    touchedFields.localisation && fieldErrors.localisation
                      ? "sig-input--error"
                      : ""
                  }`}
                  type="text"
                  name="localisation"
                  value={formData.localisation}
                  onChange={handleChange}
                  placeholder="Adresse ou coordonnées GPS"
                  required
                  aria-invalid={
                    !!(touchedFields.localisation && fieldErrors.localisation)
                  }
                  aria-describedby={
                    touchedFields.localisation && fieldErrors.localisation
                      ? "localisation_error"
                      : null
                  }
                />
                <button
                  type="button"
                  className="sig-btn sig-btn--ghost"
                  onClick={detectLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <LoaderCircle
                      size={17}
                      className="sig-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <MapPin size={17} aria-hidden="true" />
                  )}
                  Ma position
                </button>
              </div>
              <span className="sig-hint">
                Saisissez une adresse, ou utilisez votre position actuelle pour
                la remplir automatiquement.
              </span>
              {geoError && (
                <span className="sig-hint cf-hint--error">{geoError}</span>
              )}
              {touchedFields.localisation && fieldErrors.localisation && (
                <div
                  id="localisation_error"
                  className="sig-hint cf-hint--error"
                >
                  {fieldErrors.localisation}
                </div>
              )}
            </div>

            <div className="sig-field sig-grid__full">
              <label
                className="sig-label"
                htmlFor="description"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Description de la panne *</span>
                {touchedFields.description && fieldErrors.description && (
                  <span
                    className="sig-hint cf-hint--error"
                    style={{ fontWeight: "normal" }}
                  >
                    {fieldErrors.description}
                  </span>
                )}
              </label>
              <textarea
                id="description"
                className={`sig-textarea ${
                  touchedFields.description && fieldErrors.description
                    ? "sig-textarea--error"
                    : ""
                }`}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex. Coupure totale depuis ce matin, aucun compteur voisin n'est touché."
                required
                aria-invalid={
                  !!(touchedFields.description && fieldErrors.description)
                }
                aria-describedby={
                  touchedFields.description && fieldErrors.description
                    ? "description_error"
                    : null
                }
                maxLength={2000}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "4px",
                }}
              >
                <span className="sig-hint">
                  Décrivez la panne en détail pour aider le technicien à
                  intervenir plus efficacement
                </span>
                <span
                  className="sig-hint"
                  style={{
                    color:
                      formData.description.length > 1800
                        ? "var(--sig-danger)"
                        : "inherit",
                  }}
                >
                  {formData.description.length}/2000
                </span>
              </div>
              {touchedFields.description && fieldErrors.description && (
                <div id="description_error" className="sig-hint cf-hint--error">
                  {fieldErrors.description}
                </div>
              )}
            </div>

            <div className="sig-field sig-grid__full">
              <span className="sig-label">
                <Camera size={15} aria-hidden="true" />
                Photo de la panne{" "}
                <span className="sig-label__optional">(optionnel)</span>
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
                    JPG ou PNG, 5 Mo maximum — aide le technicien à identifier la
                    panne
                  </span>
                </span>
                <input
                  id="image"
                  type="file"
                  name="image"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
              </label>
              {imageError && (
                <span className="sig-hint cf-hint--error">{imageError}</span>
              )}
            </div>
          </div>

          <div className="cf-actions">
            <button
              type="submit"
              className="sig-btn sig-btn--primary cf-submit"
              disabled={sending}
            >
              {sending ? (
                <LoaderCircle
                  size={18}
                  className="sig-spin"
                  aria-hidden="true"
                />
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
