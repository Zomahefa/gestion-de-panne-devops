import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import AdminShell from "./AdminShell.jsx";
import { adminHeaders, handleAdminAuthError } from "../utils/adminAuth";
import "./AdminTechnicianManager.css";

const API_URL = process.env.REACT_APP_API_URL;
const EMPTY = {
  username: "",
  full_name: "",
  matricule: "",
  contact: "",
  password: "",
};

const slugifyUsername = (value) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char]),
  );

const translate = (msg) => {
  if (typeof msg !== "string") return String(msg);
  if (msg.includes("This password is too short")) {
    return "Le mot de passe est trop court (8 caractères minimum).";
  }
  if (msg.includes("This password is too common")) {
    return "Le mot de passe est trop commun, choisissez-en un plus solide.";
  }
  if (msg.includes("This password is entirely numeric")) {
    return "Le mot de passe ne doit pas contenir uniquement des chiffres.";
  }
  if (msg.includes("Ce nom d'utilisateur est déjà utilisé")) {
    return "Ce nom d'utilisateur est déjà utilisé.";
  }
  return msg;
};

const parseApiError = (err) => {
  if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
    return "Le serveur met trop de temps à répondre. Réessayez.";
  }

  const data = err.response?.data;
  if (!data) return "Une erreur inconnue est survenue.";
  if (typeof data === "string") return data;

  return Object.values(data).flat().map(translate).join("\n");
};

const AdminTechnicianManager = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [usernameTouched, setUsernameTouched] = useState(false);

  const fetchTechnicians = async () => {
    setLoadError("");
    try {
      const res = await axios.get(`${API_URL}technicians/`, {
        headers: adminHeaders(),
        timeout: 20000,
      });
      setTechnicians(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      console.error("Erreur chargement techniciens", err);
      setLoadError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "username") {
      setUsernameTouched(true);
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Propose un identifiant à partir du nom complet, tant que
      // l'administrateur ne l'a pas modifié lui-même.
      if (name === "full_name" && !usernameTouched) {
        next.username = slugifyUsername(value);
      }
      return next;
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const username = formData.username.trim();
    if (!username) {
      Swal.fire({
        title: "Identifiant requis",
        text: "Le nom d'utilisateur sert au technicien pour se connecter.",
        icon: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API_URL}technicians/`,
        {
          username,
          full_name: formData.full_name.trim(),
          matricule: formData.matricule.trim(),
          contact: formData.contact.trim(),
          password: formData.password,
        },
        { timeout: 30000, headers: adminHeaders() },
      );

      Swal.fire({
        title: "Technicien ajouté",
        text: `Identifiant de connexion : ${username}\n${formData.full_name.trim()} peut désormais se connecter avec ce nom et le mot de passe choisi.`,
        icon: "success",
      });

      setFormData(EMPTY);
      setUsernameTouched(false);
      fetchTechnicians();
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      Swal.fire({
        title: "Création impossible",
        text: parseApiError(err),
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (tech) => {
    const { value: formValues } = await Swal.fire({
      title: `Modifier ${tech.full_name}`,
      html:
        `<p class="swal2-html-container" style="font-size:0.85rem;margin:0 0 8px">` +
        `L'identifiant sert à la connexion du technicien.</p>` +
        `<input id="swal-username" class="swal2-input" placeholder="Identifiant" value="${escapeHtml(
          tech.username,
        )}">` +
        `<input id="swal-fullname" class="swal2-input" placeholder="Nom complet" value="${escapeHtml(
          tech.full_name,
        )}">` +
        `<input id="swal-matricule" class="swal2-input" placeholder="Matricule" value="${escapeHtml(
          tech.matricule,
        )}">` +
        `<input id="swal-contact" class="swal2-input" placeholder="Contact" value="${escapeHtml(
          tech.contact,
        )}">` +
        `<input id="swal-password" class="swal2-input" placeholder="Nouveau mot de passe (optionnel)" type="password">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Enregistrer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#003366",
      cancelButtonColor: "#55677c",
      preConfirm: () => {
        const username = document
          .getElementById("swal-username")
          .value.trim();
        if (!username) {
          Swal.showValidationMessage("L'identifiant est obligatoire.");
          return false;
        }
        return {
          username,
          full_name: document
            .getElementById("swal-fullname")
            .value.trim(),
          matricule: document
            .getElementById("swal-matricule")
            .value.trim(),
          contact: document.getElementById("swal-contact").value.trim(),
          password:
            document.getElementById("swal-password").value || undefined,
        };
      },
    });

    if (!formValues) return;

    try {
      await axios.patch(
        `${API_URL}technicians/${tech.id}/`,
        formValues,
        { timeout: 30000, headers: adminHeaders() },
      );

      const usernameChanged =
        formValues.username &&
        formValues.username.toLowerCase() !== tech.username.toLowerCase();

      Swal.fire({
        title: "Technicien modifié",
        text: usernameChanged
          ? `Nouvel identifiant de connexion : ${formValues.username}`
          : "Les informations ont été enregistrées.",
        icon: "success",
      });
      fetchTechnicians();
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      Swal.fire({
        title: "Modification impossible",
        text: parseApiError(err),
        icon: "error",
      });
    }
  };

  const handleDelete = async (tech) => {
    const result = await Swal.fire({
      title: `Supprimer ${tech.full_name} ?`,
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#c0392b",
      cancelButtonColor: "#55677c",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}technicians/${tech.id}/`, {
        headers: adminHeaders(),
        timeout: 20000,
      });
      Swal.fire({ title: "Technicien supprimé", icon: "success" });
      fetchTechnicians();
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      Swal.fire({
        title: "Suppression impossible",
        text: parseApiError(err),
        icon: "error",
      });
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  return (
    <AdminShell
      title="Gestion des techniciens"
      subtitle="Créez les comptes terrain et mettez à jour leurs coordonnées"
    >
      <div className="atm-layout">
        <section className="sig-card atm-form-card">
          <div className="sig-card__head atm-card-head">
            <h2 className="sig-card__title">
              <UserPlus size={18} aria-hidden="true" />
              Nouveau technicien
            </h2>
          </div>

          <form className="atm-form" onSubmit={handleCreate}>
            <div className="sig-field">
              <label className="sig-label" htmlFor="tech-fullname">
                Nom complet *
              </label>
              <input
                id="tech-fullname"
                className="sig-input"
                type="text"
                name="full_name"
                autoComplete="off"
                placeholder="Ex. Rakoto Jean"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="tech-username">
                Identifiant de connexion *
              </label>
              <input
                id="tech-username"
                className="sig-input"
                type="text"
                name="username"
                autoComplete="off"
                placeholder="Ex. rakotojean"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <span className="sig-hint">
                C'est le nom que le technicien saisira pour se connecter.
                Proposé automatiquement à partir du nom complet, modifiable.
              </span>
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="tech-matricule">
                Matricule *
              </label>
              <input
                id="tech-matricule"
                className="sig-input"
                type="text"
                name="matricule"
                autoComplete="off"
                placeholder="Ex. TECH-014"
                value={formData.matricule}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="tech-contact">
                Contact *
              </label>
              <input
                id="tech-contact"
                className="sig-input"
                type="text"
                name="contact"
                autoComplete="off"
                placeholder="Ex. 034 00 000 00"
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="tech-password">
                Mot de passe *
              </label>
              <input
                id="tech-password"
                className="sig-input"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="8 caractères minimum"
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="sig-btn sig-btn--primary atm-submit"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="sig-spin"
                  aria-hidden="true"
                />
              ) : (
                <Plus size={17} aria-hidden="true" />
              )}
              {saving ? "Création…" : "Ajouter le technicien"}
            </button>
          </form>
        </section>

        <section className="sig-card atm-list-card">
          <div className="sig-card__head atm-card-head">
            <h2 className="sig-card__title">
              <Users size={18} aria-hidden="true" />
              Équipe terrain
            </h2>
            <span className="atm-count">
              {technicians.length} technicien(s)
            </span>
          </div>

          {loading ? (
            <div className="sig-empty">
              <LoaderCircle
                size={22}
                className="sig-spin"
                aria-hidden="true"
              />
              <p className="sig-empty__title">Chargement…</p>
            </div>
          ) : loadError ? (
            <div className="sig-empty" role="alert">
              <TriangleAlert size={22} aria-hidden="true" />
              <p className="sig-empty__title">Liste indisponible</p>
              <p className="sig-hint cf-hint--error">{loadError}</p>
              <button
                type="button"
                className="sig-btn sig-btn--ghost sig-btn--sm"
                onClick={fetchTechnicians}
              >
                Réessayer
              </button>
            </div>
          ) : technicians.length === 0 ? (
            <div className="sig-empty">
              <span className="sig-empty__icon">
                <Users size={22} aria-hidden="true" />
              </span>
              <p className="sig-empty__title">Aucun technicien enregistré</p>
            </div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Identifiant</th>
                    <th>Matricule</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((tech) => (
                    <tr key={tech.id}>
                      <td>
                        <span className="ad-client">{tech.full_name}</span>
                      </td>
                      <td>
                        <code className="atm-username">{tech.username}</code>
                      </td>
                      <td>{tech.matricule}</td>
                      <td>{tech.contact}</td>
                      <td>
                        <div className="ad-row-actions">
                          <button
                            type="button"
                            className="sig-btn sig-btn--ghost sig-btn--sm"
                            onClick={() => handleEdit(tech)}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="ad-icon-btn"
                            onClick={() => handleDelete(tech)}
                            aria-label={`Supprimer ${tech.full_name}`}
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
      </div>
    </AdminShell>
  );
};

export default AdminTechnicianManager;
