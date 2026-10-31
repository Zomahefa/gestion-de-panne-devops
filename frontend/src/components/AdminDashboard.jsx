import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Bell,
  ClipboardList,
  Eye,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import AdminShell from "./AdminShell.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { STATUS_ORDER, getStatus } from "../utils/status";
import { adminHeaders, handleAdminAuthError } from "../utils/adminAuth";
import "./AdminDashboard.css";

const API_URL = process.env.REACT_APP_API_URL;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${window.location.origin}${imagePath}`;
};

const formatDate = (value, withTime = false) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const reference = (panne) => `PAN-${String(panne.id).padStart(4, "0")}`;

const AdminDashboard = () => {
  const [pannes, setPannes] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchPannes = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}todos/`, {
        headers: adminHeaders(),
        timeout: 30000,
      });
      setPannes(
        [...res.data].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        ),
      );
    } catch (err) {
      if (!handleAdminAuthError(err)) {
        console.error("Erreur de chargement des pannes", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}technicians/`, {
        headers: adminHeaders(),
        timeout: 30000,
      });
      setTechnicians(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (!handleAdminAuthError(err)) {
        console.error("Erreur chargement techniciens", err);
      }
    }
  }, []);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchPannes(), fetchTechnicians()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPannes();
    fetchTechnicians();
    // Le tableau reste à jour sans action de l'administrateur.
    const interval = setInterval(fetchPannes, 20000);
    return () => clearInterval(interval);
  }, [fetchPannes, fetchTechnicians]);

  const handleDelete = async (panne) => {
    const result = await Swal.fire({
      title: "Supprimer ce signalement ?",
      html: `Le signalement <strong>${reference(panne)}</strong> de ${panne.client_name} sera définitivement supprimé.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#c0392b",
      cancelButtonColor: "#55677c",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}todos/${panne.id}/`, {
        headers: adminHeaders(),
      });
      setPannes((prev) => prev.filter((item) => item.id !== panne.id));
      setSelected((current) => (current?.id === panne.id ? null : current));
      Swal.fire({
        title: "Signalement supprimé",
        text: "Le signalement a bien été retiré de la liste.",
        icon: "success",
      });
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      Swal.fire({
        title: "Suppression impossible",
        text: "La suppression a échoué, réessayez.",
        icon: "error",
      });
    }
  };

  const handleAssign = async (panne) => {
    if (technicians.length === 0) {
      Swal.fire({
        title: "Aucun technicien",
        text: "Créez d'abord un compte technicien dans l'onglet « Techniciens ».",
        icon: "info",
      });
      return;
    }

    const current = panne.technician_confirmed;
    const { value: techId } = await Swal.fire({
      title: `Attribuer ${reference(panne)}`,
      html: current
        ? `<p style="font-size:.85rem;margin:0 0 6px">Actuellement attribuée à <strong>${current.username}</strong>.</p>`
        : `<p style="font-size:.85rem;margin:0 0 6px">Aucun technicien n'est encore affecté.</p>`,
      input: "select",
      inputOptions: technicians.reduce((acc, tech) => {
        acc[tech.id] = `${tech.full_name} (${tech.matricule})`;
        return acc;
      }, {}),
      inputValue: current?.id ? String(current.id) : undefined,
      showCancelButton: true,
      confirmButtonText: "Attribuer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#003366",
      inputValidator: (value) =>
        value ? undefined : "Choisissez un technicien.",
    });

    if (!techId) return;

    try {
      await axios.post(
        `${API_URL}attributions/`,
        { panne: panne.id, technician: techId },
        { headers: adminHeaders() },
      );
      await fetchPannes();
      Swal.fire({
        title: "Panne attribuée",
        text: "Le technicien a été prévenu dans son espace de travail.",
        icon: "success",
      });
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      console.error("Erreur attribution", err.response?.data);
      Swal.fire({
        title: "Attribution impossible",
        text: "L'attribution a échoué, réessayez.",
        icon: "error",
      });
    }
  };

  const counts = STATUS_ORDER.reduce((acc, key) => {
    acc[key] = pannes.filter((panne) => panne.status === key).length;
    return acc;
  }, {});

  const openCount =
    (counts.pending || 0) + (counts.on_the_way || 0) + (counts.in_progress || 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pannes;

    return pannes.filter((panne) => {
      const haystack = [
        reference(panne),
        panne.client_name,
        panne.contact,
        panne.quartier,
        panne.lot,
        panne.localisation,
        panne.description,
        getStatus(panne.status).label,
        panne.technician_confirmed?.username,
        panne.technician_confirmed?.full_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [pannes, search]);

  return (
    <AdminShell
      title="Tableau de bord"
      subtitle="Tous les signalements, leur suivi et leur affectation"
      actions={
        <button
          type="button"
          className="sig-btn sig-btn--ghost sig-btn--sm"
          onClick={refreshAll}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "sig-spin" : ""}
            aria-hidden="true"
          />
          Actualiser
        </button>
      }
    >
      <section className="ad-stats" aria-label="Indicateurs clés">
        <div className="ad-stat">
          <span className="ad-stat__icon ad-stat__icon--navy">
            <ClipboardList size={19} aria-hidden="true" />
          </span>
          <span className="ad-stat__body">
            <span className="ad-stat__value">{pannes.length}</span>
            <span className="ad-stat__label">Signalements</span>
          </span>
        </div>

        <div className="ad-stat">
          <span className="ad-stat__icon ad-stat__icon--pending">
            <Bell size={19} aria-hidden="true" />
          </span>
          <span className="ad-stat__body">
            <span className="ad-stat__value">{counts.pending || 0}</span>
            <span className="ad-stat__label">En attente</span>
          </span>
        </div>

        <div className="ad-stat">
          <span className="ad-stat__icon ad-stat__icon--progress">
            <LoaderCircle size={19} aria-hidden="true" />
          </span>
          <span className="ad-stat__body">
            <span className="ad-stat__value">{openCount}</span>
            <span className="ad-stat__label">En traitement</span>
          </span>
        </div>

        <div className="ad-stat">
          <span className="ad-stat__icon ad-stat__icon--resolved">
            <Users size={19} aria-hidden="true" />
          </span>
          <span className="ad-stat__body">
            <span className="ad-stat__value">{technicians.length}</span>
            <span className="ad-stat__label">Techniciens</span>
          </span>
        </div>
      </section>

      <section className="sig-card ad-panel">
        <div className="sig-card__head ad-panel__head ad-toolbar">
          <h2 className="sig-card__title">
            <ClipboardList size={18} aria-hidden="true" />
            Signalements
            <span className="ad-panel__count">
              {filtered.length} / {pannes.length}
            </span>
          </h2>

          <div className="ad-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              className="sig-input ad-search__input"
              placeholder="Rechercher un client, un quartier, un statut, un technicien…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Rechercher un signalement"
            />
            {search && (
              <button
                type="button"
                className="ad-search__clear"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="sig-empty">
            <LoaderCircle size={24} className="sig-spin" aria-hidden="true" />
            <p className="sig-empty__title">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sig-empty">
            <span className="sig-empty__icon">
              <ClipboardList size={24} aria-hidden="true" />
            </span>
            <p className="sig-empty__title">
              {search ? "Aucun signalement ne correspond" : "Aucun signalement"}
            </p>
          </div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Client</th>
                  <th>Lieu</th>
                  <th>Reçu le</th>
                  <th>Statut</th>
                  <th>Technicien</th>
                  <th className="ad-table__num">Photo</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((panne) => (
                  <tr key={panne.id}>
                    <td>
                      <code className="ad-ref">{reference(panne)}</code>
                    </td>
                    <td>
                      <span className="ad-client">{panne.client_name}</span>
                      <span className="ad-client__meta">{panne.contact}</span>
                    </td>
                    <td>
                      <span className="ad-place">
                        <MapPin size={13} aria-hidden="true" />
                        {panne.quartier}
                      </span>
                      {panne.lot && (
                        <span className="ad-client__meta">{panne.lot}</span>
                      )}
                    </td>
                    <td>
                      <span className="ad-date">
                        {formatDate(panne.created_at)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={panne.status} short />
                    </td>
                    <td>
                      {panne.technician_confirmed?.username ? (
                        <span className="ad-tech">
                          {panne.technician_confirmed.username}
                        </span>
                      ) : (
                        <span className="ad-muted">Non affecté</span>
                      )}
                    </td>
                    <td className="ad-table__num">
                      {panne.image ? (
                        <img
                          src={getImageUrl(panne.image)}
                          alt={`Panne signalée par ${panne.client_name}`}
                          className="ad-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <span className="ad-thumb ad-thumb--empty">
                          <ImageIcon size={14} aria-hidden="true" />
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="ad-row-actions">
                        <button
                          type="button"
                          className="sig-btn sig-btn--ghost sig-btn--sm"
                          onClick={() => setSelected(panne)}
                        >
                          <Eye size={15} aria-hidden="true" />
                          Détails
                        </button>
                        <button
                          type="button"
                          className="sig-btn sig-btn--ghost sig-btn--sm"
                          onClick={() => handleAssign(panne)}
                        >
                          <UserPlus size={15} aria-hidden="true" />
                          Attribuer
                        </button>
                        <button
                          type="button"
                          className="ad-icon-btn"
                          onClick={() => handleDelete(panne)}
                          aria-label={`Supprimer le signalement de ${panne.client_name}`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div
          className="ad-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Détails du signalement ${reference(selected)}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div className="ad-modal__panel">
            <div className="ad-modal__head">
              <div>
                <span className="ad-modal__ref">{reference(selected)}</span>
                <h2 className="ad-modal__title">{selected.client_name}</h2>
                <StatusBadge status={selected.status} />
              </div>
              <button
                type="button"
                className="ad-icon-btn"
                onClick={() => setSelected(null)}
                aria-label="Fermer les détails"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <dl className="ad-detail">
              <div>
                <dt>Contact</dt>
                <dd>{selected.contact || "—"}</dd>
              </div>
              <div>
                <dt>Quartier</dt>
                <dd>{selected.quartier || "—"}</dd>
              </div>
              <div>
                <dt>Lot</dt>
                <dd>{selected.lot || "—"}</dd>
              </div>
              <div>
                <dt>Localisation</dt>
                <dd>{selected.localisation || "—"}</dd>
              </div>
              <div>
                <dt>Reçu le</dt>
                <dd>{formatDate(selected.created_at, true)}</dd>
              </div>
              <div>
                <dt>Technicien affecté</dt>
                <dd>
                  {selected.technician_confirmed?.full_name ||
                    selected.technician_confirmed?.username ||
                    "Non affecté"}
                </dd>
              </div>
              <div className="ad-detail__wide">
                <dt>Description</dt>
                <dd>{selected.description || "—"}</dd>
              </div>
              <div className="ad-detail__wide">
                <dt>Note du technicien</dt>
                <dd>{selected.technician_note || "Aucune note"}</dd>
              </div>
            </dl>

            {selected.image && (
              <figure className="ad-modal__figure">
                <figcaption>Photo jointe au signalement</figcaption>
                <img
                  src={getImageUrl(selected.image)}
                  alt={`Panne signalée par ${selected.client_name}`}
                />
              </figure>
            )}

            <div className="ad-modal__actions">
              <button
                type="button"
                className="sig-btn sig-btn--ghost sig-btn--sm"
                onClick={() => handleAssign(selected)}
              >
                <UserPlus size={15} aria-hidden="true" />
                Attribuer à un technicien
              </button>
              <button
                type="button"
                className="sig-btn sig-btn--danger sig-btn--sm"
                onClick={() => handleDelete(selected)}
              >
                <Trash2 size={15} aria-hidden="true" />
                Supprimer le signalement
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default AdminDashboard;
