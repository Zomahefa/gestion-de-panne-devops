import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  AtSign,
  BadgeCheck,
  Briefcase,
  LoaderCircle,
  Phone,
  Save,
  User,
  UserCircle,
} from "lucide-react";
import AdminShell from "./AdminShell.jsx";
import { adminHeaders, handleAdminAuthError } from "../utils/adminAuth";
import "./AdminProfile.css";

const API_URL = process.env.REACT_APP_API_URL;

const AdminProfile = () => {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    matricule: "",
    role: "",
    contact: "",
    email: "",
    password: "",
  });
  const [adminId, setAdminId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        // L'identifiant vient de la connexion (AdminLogin). On ne code plus
        // `/admins/1/` en dur : chaque admin voit son propre profil.
        let id = localStorage.getItem("admin_id");

        if (!id) {
          const username = localStorage.getItem("admin_username");
          if (!username) {
            throw new Error(
              "Session expirée. Déconnectez-vous puis reconnectez-vous.",
            );
          }
          const list = await axios.get(`${API_URL}admins/`, {
            headers: adminHeaders(),
            timeout: 20000,
          });
          const found = (Array.isArray(list.data) ? list.data : []).find(
            (item) => item.username === username,
          );
          if (!found) {
            throw new Error(
              "Compte administrateur introuvable. Reconnectez-vous.",
            );
          }
          id = String(found.id);
          localStorage.setItem("admin_id", id);
        }

        const res = await axios.get(`${API_URL}admins/${id}/`, {
          headers: adminHeaders(),
          timeout: 20000,
        });
        setAdminId(res.data.id);
        setFormData({ ...res.data, password: "" });
        localStorage.setItem("admin_username", res.data.username);
      } catch (err) {
        if (handleAdminAuthError(err)) return;
        console.error("Erreur chargement admin", err);
        setLoadError(
          err.response?.data?.detail ||
            err.message ||
            "Impossible de charger votre profil.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!adminId) {
      Swal.fire({
        title: "Profil indisponible",
        text: "Reconnectez-vous pour modifier votre profil.",
        icon: "error",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Enregistrer les modifications ?",
      text: "Les informations de votre compte seront mises à jour.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, enregistrer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#003366",
      cancelButtonColor: "#55677c",
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const payload = {
        username: formData.username,
        full_name: formData.full_name,
        matricule: formData.matricule,
        role: formData.role,
        contact: formData.contact,
        email: formData.email,
      };

      // Un champ mot de passe vide signifie « ne pas changer » : on ne
      // l'envoie pas, sinon le serveur écraserait le mot de passe actuel.
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      const res = await axios.put(`${API_URL}admins/${adminId}/`, payload, {
        headers: adminHeaders(),
        timeout: 20000,
      });

      setFormData({ ...res.data, password: "" });
      localStorage.setItem("admin_username", res.data.username);
      setLoadError("");

      Swal.fire({
        title: "Informations mises à jour",
        text: "Votre profil a bien été enregistré.",
        icon: "success",
      });
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      console.error("Erreur mise à jour", err);

      const data = err.response?.data;
      let message = "Vérifiez les champs puis réessayez.";
      if (typeof data === "string") {
        message = data;
      } else if (data && typeof data === "object") {
        const details = Object.values(data).flat();
        if (details.length) message = details.join("\n");
      }

      Swal.fire({
        title: "Mise à jour impossible",
        text: message,
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Mon profil"
      subtitle="Coordonnées du compte administrateur"
    >
      <div className="ap-layout">
        <aside className="sig-card ap-id">
          <span className="ap-id__avatar">
            <UserCircle size={34} aria-hidden="true" />
          </span>
          <p className="ap-id__name">{formData.full_name || "Administrateur"}</p>
          <p className="ap-id__role">{formData.role || "Rôle non défini"}</p>

          <dl className="ap-id__meta">
            <div>
              <dt>Identifiant</dt>
              <dd>{formData.username || "—"}</dd>
            </div>
            <div>
              <dt>Matricule</dt>
              <dd>{formData.matricule || "—"}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{formData.contact || "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{formData.email || "—"}</dd>
            </div>
          </dl>
        </aside>

        <section className="sig-card ap-form-card">
          <div className="sig-card__head ap-card-head">
            <h2 className="sig-card__title">
              <BadgeCheck size={18} aria-hidden="true" />
              Informations du compte
            </h2>
          </div>

          {loading ? (
            <div className="sig-empty">
              <LoaderCircle size={22} className="sig-spin" aria-hidden="true" />
              <p className="sig-empty__title">Chargement…</p>
            </div>
          ) : loadError ? (
            <div className="sig-empty" role="alert">
              <p className="sig-empty__title">Profil indisponible</p>
              <p className="sig-hint cf-hint--error">{loadError}</p>
            </div>
          ) : (
            <form className="ap-form" onSubmit={handleUpdate}>
              <div className="sig-grid">
                <div className="sig-field">
                  <label className="sig-label" htmlFor="ap-username">
                    <User size={15} aria-hidden="true" />
                    Nom d'utilisateur
                  </label>
                  <input
                    id="ap-username"
                    className="sig-input"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>

                <div className="sig-field">
                  <label className="sig-label" htmlFor="ap-fullname">
                    Nom complet
                  </label>
                  <input
                    id="ap-fullname"
                    className="sig-input"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="sig-field">
                  <label className="sig-label" htmlFor="ap-matricule">
                    <BadgeCheck size={15} aria-hidden="true" />
                    Matricule
                  </label>
                  <input
                    id="ap-matricule"
                    className="sig-input"
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleChange}
                  />
                </div>

                <div className="sig-field">
                  <label className="sig-label" htmlFor="ap-role">
                    <Briefcase size={15} aria-hidden="true" />
                    Métier
                  </label>
                  <input
                    id="ap-role"
                    className="sig-input"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  />
                </div>

                <div className="sig-field">
                  <label className="sig-label" htmlFor="ap-contact">
                    <Phone size={15} aria-hidden="true" />
                    Contact
                  </label>
                  <input
                    id="ap-contact"
                    className="sig-input"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                  />
                </div>

                <div className="sig-field">
                  <label className="sig-label" htmlFor="ap-email">
                    <AtSign size={15} aria-hidden="true" />
                    Email
                  </label>
                  <input
                    id="ap-email"
                    className="sig-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="sig-field sig-grid__full">
                  <label className="sig-label" htmlFor="ap-password">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="ap-password"
                    className="sig-input"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="Laisser vide pour conserver le mot de passe actuel"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <span className="sig-hint">
                    Laisser vide pour conserver le mot de passe actuel.
                  </span>
                </div>
              </div>

              <div className="ap-actions">
                <button
                  type="submit"
                  className="sig-btn sig-btn--primary"
                  disabled={saving || !adminId}
                >
                  {saving ? (
                    <LoaderCircle size={17} className="sig-spin" aria-hidden="true" />
                  ) : (
                    <Save size={17} aria-hidden="true" />
                  )}
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </AdminShell>
  );
};

export default AdminProfile;
