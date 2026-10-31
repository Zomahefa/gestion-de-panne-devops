import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Camera,
  ClipboardList,
  Info,
  LoaderCircle,
  LogOut,
  MapPin,
  ShieldAlert,
  User,
  Wrench,
} from "lucide-react";
import NotificationBell from "./NotificationBell.jsx";
import StatusBadge from "./StatusBadge.jsx";
import MapView from "./MapView.jsx";
import { STATUS_CONFIG, STATUS_ORDER, getStatus } from "../utils/status";
import "./TechnicianDashboard.css";

const extractCoordinates = (text) => {
  if (!text) return null;
  const match = String(text).match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
  if (!match) return null;
  return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${window.location.origin}${imagePath}`;
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const TechnicianDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [filter, setFilter] = useState("all");
  // « mine » : les pannes attribuées au technicien connecté ; « all » :
  // tous les signalements, en lecture seule sauf ceux qui lui sont confiés.
  const [scope, setScope] = useState("mine");
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [updateError, setUpdateError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentUsername(localStorage.getItem("username") || "");
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}todos/`, {
        headers: authHeaders(),
      });
      setIncidents(
        [...res.data].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        ),
      );
    } catch (err) {
      console.error("Erreur chargement incidents :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdateError("");
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}todos/${id}/`,
        { status: newStatus },
        { headers: authHeaders() },
      );
      setIncidents((prev) =>
        prev.map((incident) =>
          incident.id === id ? { ...incident, status: newStatus } : incident,
        ),
      );
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
        return;
      }
      if (err.response?.status === 403) {
        setUpdateError(
          err.response?.data?.detail ||
            "Cette panne ne vous est pas attribuée : seul le technicien affecté peut changer son statut.",
        );
        return;
      }
      setUpdateError(
        "La mise à jour du statut a échoué. Réessayez dans un instant.",
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const mine = incidents.filter(
    (incident) =>
      incident.technician_confirmed?.username?.toLowerCase() ===
      currentUsername?.toLowerCase(),
  );

  const scoped = scope === "mine" ? mine : incidents;

  const filtered =
    filter === "all" ? scoped : scoped.filter((i) => i.status === filter);

  const countFor = (key) =>
    key === "all"
      ? scoped.length
      : scoped.filter((i) => i.status === key).length;

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
            <span style={{ marginLeft: "8px", fontSize: "18px", fontWeight: "800", color: "#003366" }}>Signaleo</span>
          </Link>

          <nav className="sig-nav" aria-label="Navigation technicien">
            <span className="td-user">
              <User size={15} aria-hidden="true" />
              {currentUsername || "Technicien"}
            </span>
            <Link to="/suivi" className="sig-nav__link">
              <ArrowLeftRight size={17} aria-hidden="true" />
              Suivi client
            </Link>
            <NotificationBell
              apiUrl={process.env.REACT_APP_API_URL}
              headers={authHeaders}
            />
            <button type="button" className="sig-nav__link td-logout" onClick={handleLogout}>
              <LogOut size={17} aria-hidden="true" />
              Quitter
            </button>
          </nav>
        </div>
      </header>

      <main className="sig-page">
        <div className="sig-page-head">
          <div>
            <span className="sig-eyebrow">
              <Wrench size={15} aria-hidden="true" />
              Espace technicien
            </span>
            <h1 className="sig-title">
              {scope === "mine" ? "Mes interventions" : "Toutes les pannes"}
            </h1>
            <p className="sig-sub">
              {scope === "mine"
                ? "Les pannes qui vous sont affectées. Mettez à jour le statut à chaque étape de l'intervention."
                : "Tous les signalements de l'application. Vous ne pouvez modifier que ceux qui vous sont attribués."}
            </p>
          </div>
        </div>

        <p className="td-info">
          <Info size={16} aria-hidden="true" />
          Pour modifier vos informations (mot de passe, contact, rôle…),
          contactez un administrateur : seul son espace permet ces mises à jour.
        </p>

        <div className="td-scope" role="tablist" aria-label="Portée de la liste">
          <button
            type="button"
            role="tab"
            aria-selected={scope === "mine"}
            className={`td-scope__btn${scope === "mine" ? " td-scope__btn--active" : ""}`}
            onClick={() => setScope("mine")}
          >
            <Wrench size={15} aria-hidden="true" />
            Mes interventions
            <span className="td-chip__count">{mine.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "all"}
            className={`td-scope__btn${scope === "all" ? " td-scope__btn--active" : ""}`}
            onClick={() => setScope("all")}
          >
            <ClipboardList size={15} aria-hidden="true" />
            Toutes les pannes
            <span className="td-chip__count">{incidents.length}</span>
          </button>
        </div>

        {updateError && (
          <p className="td-alert" role="alert">
            <ShieldAlert size={16} aria-hidden="true" />
            {updateError}
          </p>
        )}

        <div className="td-filters" role="tablist" aria-label="Filtrer par statut">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={`td-chip${filter === "all" ? " td-chip--active" : ""}`}
            onClick={() => setFilter("all")}
          >
            <ClipboardList size={15} aria-hidden="true" />
            Toutes
            <span className="td-chip__count">{countFor("all")}</span>
          </button>

          {STATUS_ORDER.map((key) => {
            const { short, Icon } = getStatus(key);
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={`td-chip${filter === key ? " td-chip--active" : ""}`}
                onClick={() => setFilter(key)}
              >
                <Icon size={15} aria-hidden="true" />
                {short}
                <span className="td-chip__count">{countFor(key)}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="sig-card sig-empty">
            <LoaderCircle size={24} className="sig-spin" aria-hidden="true" />
            <p className="sig-empty__title">Chargement des interventions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sig-card sig-empty">
            <span className="sig-empty__icon">
              <ClipboardList size={24} aria-hidden="true" />
            </span>
            <p className="sig-empty__title">
              {scope === "mine" && mine.length === 0
                ? "Aucune panne ne vous est encore attribuée"
                : "Aucune intervention dans ce filtre"}
            </p>
          </div>
        ) : (
          <div className="td-grid">
            {filtered.map((incident) => {
              const coords = extractCoordinates(incident.localisation);
              const isAssignedToMe =
                incident.technician_confirmed?.username?.toLowerCase() ===
                currentUsername?.toLowerCase();

              return (
                <article className="sig-card td-card" key={incident.id}>
                  <div className="td-card__top">
                    <StatusBadge status={incident.status} />
                    <span className="td-card__ref">
                      PAN-{String(incident.id).padStart(4, "0")}
                    </span>
                  </div>

                  <h2 className="td-card__title">{incident.client_name}</h2>

                  <p className="td-card__place">
                    <MapPin size={14} aria-hidden="true" />
                    {incident.quartier}
                    {incident.lot ? ` · ${incident.lot}` : ""}
                    {incident.localisation ? ` · ${incident.localisation}` : ""}
                  </p>

                  <p className="td-card__desc">{incident.description}</p>

                  <div className="td-card__assign">
                    <User size={14} aria-hidden="true" />
                    <span>
                      Technicien attribué :{" "}
                      <strong>
                        {incident.technician_confirmed?.username || "Aucun"}
                      </strong>
                    </span>
                  </div>

                  {isAssignedToMe ? (
                    <label className="td-card__status">
                      <span className="sig-label">Changer le statut</span>
                      <select
                        className="sig-select"
                        value={incident.status}
                        onChange={(e) =>
                          handleStatusUpdate(incident.id, e.target.value)
                        }
                      >
                        {STATUS_ORDER.map((key) => (
                          <option key={key} value={key}>
                            {STATUS_CONFIG[key].label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="td-card__lock">
                      <ShieldAlert size={15} aria-hidden="true" />
                      Non attribué à vous : lecture seule
                    </p>
                  )}

                  {incident.image && (
                    <figure className="td-card__figure">
                      <figcaption>
                        <Camera size={14} aria-hidden="true" />
                        Photo du signalement
                      </figcaption>
                      <img
                        src={getImageUrl(incident.image)}
                        alt={`Panne signalée par ${incident.client_name}`}
                        loading="lazy"
                      />
                    </figure>
                  )}

                  {coords ? (
                    <MapView
                      latitude={coords.latitude}
                      longitude={coords.longitude}
                      description={incident.description}
                      height={200}
                    />
                  ) : (
                    <p className="td-card__lock">
                      <MapPin size={15} aria-hidden="true" />
                      Localisation GPS non disponible
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default TechnicianDashboard;
