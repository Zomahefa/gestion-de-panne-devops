import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  CircleHelp,
  Image as ImageIcon,
  Inbox,
  LoaderCircle,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  StickyNote,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { STATUS_ORDER, getStatus } from "../utils/status";
import "./ClientView.css";

const ClientView = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}todos/`);
      setIncidents(
        [...res.data].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        ),
      );
    } catch (err) {
      console.error("Erreur chargement incidents :", err);
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

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
          </Link>

          <nav className="sig-nav" aria-label="Navigation principale">
            <Link to="/" className={
              window.location.pathname === "/"
                ? "sig-nav__link sig-nav__link--strong"
                : "sig-nav__link"
            }>
              <Plus size={17} aria-hidden="true" />
              Signaler
            </Link>
            <Link to="/help" className={
              window.location.pathname === "/help"
                ? "sig-nav__link sig-nav__link--strong"
                : "sig-nav__link"
            }>
              <CircleHelp size={17} aria-hidden="true" />
              Aide
            </Link>
            <Link to="/login" className={
              window.location.pathname === "/login"
                ? "sig-nav__link sig-nav__link--strong"
                : "sig-nav__link"
            }>
              <Wrench size={17} aria-hidden="true" />
              Technicien
            </Link>
            <Link
              to="/admin-login"
              className={
                window.location.pathname === "/admin-login"
                  ? "sig-nav__link sig-nav__link--strong"
                  : "sig-nav__link sig-nav__link--strong"
              }
            >
              <ShieldCheck size={17} aria-hidden="true" />
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="sig-page">
        <div className="sig-page-head">
          <div>
            <span className="sig-eyebrow">
              <Zap size={15} aria-hidden="true" />
              Temps réel
            </span>
            <h1 className="sig-title">Suivi des pannes</h1>
            <p className="sig-sub">
              Toutes les pannes signalées et leur avancement, mis à jour
              automatiquement toutes les 5 secondes.
            </p>
          </div>

          <div className="cv-controls">
            <div className="cv-filter">
              <label htmlFor="status-filter" className="sig-label">
                Afficher : <span className="sig-label__optional">(tous)</span>
              </label>
              <select
                id="status-filter"
                className="sig-input"
                onChange={(e) => {
                  const filter = e.target.value;
                  if (filter === "all") {
                    fetchIncidents();
                  } else {
                    const filtered = incidents.filter((inc) => inc.status === filter);
                    setIncidents(filtered);
                  }
                }}
                defaultValue="all"
              >
                <option value="all">Tous les statuts</option>
                {STATUS_ORDER.map((key) => {
                  const { short } = getStatus(key);
                  return (
                    <option key={key} value={key}>
                      {short}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              className="sig-btn sig-btn--ghost sig-btn--sm"
              onClick={() => fetchIncidents(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "sig-spin" : ""}
                aria-hidden="true"
              />
              Actualiser
            </button>
          </div>
        </div>

        {loading ? (
          <div className="sig-card sig-empty">
            <LoaderCircle size={26} className="sig-spin" aria-hidden="true" />
            <p className="sig-empty__title">Chargement des signalements…</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="sig-card sig-empty">
            <span className="sig-empty__icon">
              <Inbox size={26} aria-hidden="true" />
            </span>
            <p className="sig-empty__title">Aucune panne signalée pour le moment</p>
            <p className="sig-hint">
              Les déclarations envoyées depuis le formulaire apparaîtront ici.
            </p>
            <Link to="/" className="sig-btn sig-btn--primary sig-btn--sm">
              <Zap size={16} aria-hidden="true" />
              Signaler une panne
            </Link>
          </div>
        ) : (
          <div className="cv-grid">
            {incidents.map((incident) => (
              <article className="sig-card cv-card" key={incident.id}>
                <div className="cv-card__top">
                  <StatusBadge status={incident.status} />
                  <time
                    className="cv-card__date"
                    dateTime={incident.created_at}
                  >
                    {new Date(incident.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>

                <h2 className="cv-card__title">
                  {incident.client_name}
                  <span className="cv-card__place">
                    <MapPin size={14} aria-hidden="true" />
                    {incident.quartier}
                    {incident.lot ? ` · ${incident.lot}` : ""}
                  </span>
                </h2>

                <p className="cv-card__desc">{incident.description}</p>

                <dl className="cv-card__meta">
                  <div>
                    <dt>
                      <User size={14} aria-hidden="true" />
                      Contact
                    </dt>
                    <dd>{incident.contact || "Non renseigné"}</dd>
                  </div>
                  <div>
                    <dt>
                      <Phone size={14} aria-hidden="true" />
                      Référence
                    </dt>
                    <dd>PAN-{String(incident.id).padStart(4, "0")}</dd>
                  </div>
                </dl>

                {incident.technician_note && (
                  <p className="cv-card__note">
                    <StickyNote size={15} aria-hidden="true" />
                    <span>
                      <strong>Note du technicien</strong>
                      {incident.technician_note}
                    </span>
                  </p>
                )}

                {incident.image && (
                  <figure className="cv-card__figure">
                    <figcaption>
                      <ImageIcon size={14} aria-hidden="true" />
                      Photo du signalement
                    </figcaption>
                    <img
                      src={incident.image}
                      alt={`Panne signalée par ${incident.client_name} à ${incident.quartier}`}
                      loading="lazy"
                    />
                  </figure>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientView;
