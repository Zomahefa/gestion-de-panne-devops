import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Bell,
  ClipboardList,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import AdminShell from "./AdminShell.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { STATUS_ORDER } from "../utils/status";
import "./AdminDashboard.css";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${window.location.origin}${imagePath}`;
};

const AdminDashboard = () => {
  const [pannes, setPannes] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPannes = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}todos/`);
      setPannes(
        [...res.data].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        ),
      );
    } catch (err) {
      console.error("Erreur de chargement des pannes", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}technicians/`);
      setTechnicians(res.data);
    } catch (err) {
      console.error("Erreur chargement techniciens", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}notifications/`);
      setNotifications(res.data.slice(0, 6));
    } catch (err) {
      console.error("Erreur chargement notifications", err);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchPannes(), fetchTechnicians(), fetchNotifications()]);
    setRefreshing(false);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Supprimer ce signalement ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#c0392b",
      cancelButtonColor: "#55677c",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}todos/${id}/`);
        setPannes((prev) => prev.filter((p) => p.id !== id));
        Swal.fire({
          title: "Signalement supprimé",
          text: "Le signalement a bien été retiré de la liste.",
          icon: "success",
        });
      } catch (err) {
        Swal.fire({
          title: "Suppression impossible",
          text: "La suppression a échoué, réessayez.",
          icon: "error",
        });
      }
    }
  };

  const handleAssign = async (panneId) => {
    const { value: techId } = await Swal.fire({
      title: "Attribuer à un technicien",
      input: "select",
      inputOptions: technicians.reduce((acc, tech) => {
        acc[tech.id] = `${tech.full_name} (${tech.matricule})`;
        return acc;
      }, {}),
      inputPlaceholder: "Choisir un technicien",
      showCancelButton: true,
      confirmButtonText: "Attribuer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#003366",
    });

    if (techId) {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}attributions/`, {
          panne: panneId,
          technician: techId,
          assigned_by: 1,
        });
        Swal.fire({
          title: "Tâche attribuée",
          text: "Le technicien a été prévenu.",
          icon: "success",
        });
        fetchPannes();
      } catch (err) {
        console.error("Erreur attribution", err.response?.data);
        Swal.fire({
          title: "Attribution impossible",
          text: "L'attribution a échoué, réessayez.",
          icon: "error",
        });
      }
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}notifications/${id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      Swal.fire({
        title: "Suppression impossible",
        text: "La notification n'a pas pu être supprimée.",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    fetchPannes();
    fetchTechnicians();
    fetchNotifications();
  }, []);

  const counts = STATUS_ORDER.reduce((acc, key) => {
    acc[key] = pannes.filter((p) => p.status === key).length;
    return acc;
  }, {});

  const openCount =
    (counts.pending || 0) + (counts.on_the_way || 0) + (counts.in_progress || 0);

  return (
    <AdminShell
      title="Tableau de bord"
      subtitle="Supervision des signalements et des interventions en cours"
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

      <div className="ad-layout">
        <section className="sig-card ad-panel">
          <div className="sig-card__head ad-panel__head">
            <h2 className="sig-card__title">
              <ClipboardList size={18} aria-hidden="true" />
              Signalements
            </h2>
            <span className="ad-panel__count">
              {pannes.length} au total
            </span>
          </div>

          {loading ? (
            <div className="sig-empty">
              <LoaderCircle size={24} className="sig-spin" aria-hidden="true" />
              <p className="sig-empty__title">Chargement…</p>
            </div>
          ) : pannes.length === 0 ? (
            <div className="sig-empty">
              <span className="sig-empty__icon">
                <ClipboardList size={24} aria-hidden="true" />
              </span>
              <p className="sig-empty__title">Aucun signalement</p>
            </div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Quartier</th>
                    <th>Statut</th>
                    <th>Technicien</th>
                    <th className="ad-table__num">Photo</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pannes.map((panne) => (
                    <tr key={panne.id}>
                      <td>
                        <span className="ad-client">{panne.client_name}</span>
                        <span className="ad-client__meta">
                          {panne.contact}
                        </span>
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
                            onClick={() => handleAssign(panne.id)}
                          >
                            <UserPlus size={15} aria-hidden="true" />
                            Attribuer
                          </button>
                          <button
                            type="button"
                            className="ad-icon-btn"
                            onClick={() => handleDelete(panne.id)}
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

        <aside className="sig-card ad-panel ad-notes">
          <div className="sig-card__head ad-panel__head">
            <h2 className="sig-card__title">
              <Bell size={18} aria-hidden="true" />
              Notifications
            </h2>
          </div>

          {notifications.length === 0 ? (
            <p className="ad-muted ad-notes__empty">Aucune notification</p>
          ) : (
            <ul className="ad-notes__list">
              {notifications.map((notif) => (
                <li key={notif.id} className="ad-note">
                  <div className="ad-note__body">
                    <p className="ad-note__text">{notif.message}</p>
                    <time className="ad-note__date">
                      {new Date(notif.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <button
                    type="button"
                    className="ad-icon-btn ad-icon-btn--sm"
                    onClick={() => deleteNotification(notif.id)}
                    aria-label="Supprimer la notification"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </AdminShell>
  );
};

export default AdminDashboard;
