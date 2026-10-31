import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import "./NotificationBell.css";

/**
 * Cloche de notifications partagée par l'espace administrateur et l'espace
 * technicien. Chaque compte ne reçoit que ses propres notifications : le
 * filtrage est fait par l'API, pas ici.
 *
 * @param {string} apiUrl  URL de base de l'API (terminée par « / »)
 * @param {Function} headers  renvoie les en-têtes d'authentification
 * @param {number} pollMs  fréquence de rafraîchissement
 */
const KIND_LABEL = {
  incident_created: "Nouveau signalement",
  assigned: "Panne attribuée",
  status_update: "Statut modifié",
  info: "Information",
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationBell = ({ apiUrl, headers, pollMs = 20000 }) => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}notifications/`, {
        headers: headers(),
        timeout: 20000,
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // La cloche ne doit jamais bloquer l'écran : une session expirée est
      // déjà traitée par le reste de la page.
    } finally {
      setLoading(false);
    }
  }, [apiUrl, headers]);

  useEffect(() => {
    load();
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [load, pollMs]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((item) => !item.is_read).length;

  const markAllRead = async () => {
    try {
      await axios.post(
        `${apiUrl}notifications/mark-all-read/`,
        {},
        { headers: headers(), timeout: 20000 },
      );
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      // silencieux : l'utilisateur peut réessayer
    }
  };

  const markRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await axios.post(
        `${apiUrl}notifications/${notification.id}/read/`,
        {},
        { headers: headers(), timeout: 20000 },
      );
      setItems((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
    } catch (err) {
      // silencieux
    }
  };

  return (
    <div className="nbell" ref={boxRef}>
      <button
        type="button"
        className="nbell__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={
          unread
            ? `Notifications, ${unread} non lue(s)`
            : "Notifications"
        }
        aria-expanded={open}
      >
        <Bell size={19} aria-hidden="true" />
        {unread > 0 && (
          <span className="nbell__badge" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="nbell__panel" role="dialog" aria-label="Notifications">
          <div className="nbell__head">
            <strong>Notifications</strong>
            <button
              type="button"
              className="nbell__read-all"
              onClick={markAllRead}
              disabled={unread === 0}
            >
              <CheckCheck size={14} aria-hidden="true" />
              Tout lire
            </button>
          </div>

          {loading ? (
            <p className="nbell__empty">
              <LoaderCircle size={18} className="sig-spin" aria-hidden="true" />
              Chargement…
            </p>
          ) : items.length === 0 ? (
            <p className="nbell__empty">Aucune notification pour le moment.</p>
          ) : (
            <ul className="nbell__list">
              {items.slice(0, 20).map((item) => (
                <li
                  key={item.id}
                  className={`nbell__item${
                    item.is_read ? "" : " nbell__item--unread"
                  }`}
                >
                  <button
                    type="button"
                    className="nbell__item-btn"
                    onClick={() => markRead(item)}
                  >
                    <span className="nbell__kind">
                      {KIND_LABEL[item.kind] || "Information"}
                    </span>
                    <span className="nbell__text">{item.message}</span>
                    <time className="nbell__date">
                      {formatDate(item.created_at)}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
