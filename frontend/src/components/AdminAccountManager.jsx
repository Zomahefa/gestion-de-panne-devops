import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import AdminShell from "./AdminShell.jsx";
import {
  adminHeaders,
  clearAdminSession,
  handleAdminAuthError,
  isSuperAdmin,
} from "../utils/adminAuth";
import "./AdminAccountManager.css";

const API_URL = process.env.REACT_APP_API_URL;

const EMPTY = {
  username: "",
  full_name: "",
  matricule: "",
  role: "admin",
  contact: "",
  email: "",
  password: "",
};

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

const parseApiError = (err) => {
  if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
    return "Le serveur met trop de temps à répondre. Réessayez.";
  }
  const data = err.response?.data;
  if (!data) return "Une erreur inconnue est survenue.";
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  return Object.values(data).flat().join("\n");
};

const AdminAccountManager = () => {
  const navigate = useNavigate();
  const allowed = isSuperAdmin();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Seul le compte de référence gère les autres administrateurs : la
    // route est aussi protégée côté API, ceci n'est qu'un confort d'UI.
    if (!allowed) {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [allowed, navigate]);

  const fetchAccounts = async () => {
    setLoadError("");
    try {
      const res = await axios.get(`${API_URL}admins/`, {
        headers: adminHeaders(),
        timeout: 20000,
        params: { _: Date.now() },
      });
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      setLoadError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) fetchAccounts();
  }, [allowed]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await axios.post(
        `${API_URL}admins/`,
        {
          username: formData.username.trim(),
          full_name: formData.full_name.trim() || formData.username.trim(),
          matricule: formData.matricule.trim(),
          role: formData.role.trim() || "admin",
          contact: formData.contact.trim(),
          email: formData.email.trim(),
          password: formData.password,
        },
        { headers: adminHeaders(), timeout: 30000 },
      );

      Swal.fire({
        title: "Compte administrateur créé",
        text: `${formData.username.trim()} peut se connecter avec le mot de passe choisi. Pensez à supprimer ce compte après le test.`,
        icon: "success",
      });
      setFormData(EMPTY);
      fetchAccounts();
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

  const handleView = (account) => {
    Swal.fire({
      title: account.full_name || account.username,
      html:
        `<div style="text-align:left;font-size:.9rem;line-height:1.6">` +
        `<p style="margin:0 0 6px"><strong>Identifiant :</strong> <code>${escapeHtml(
          account.username,
        )}</code></p>` +
        `<p style="margin:0 0 6px"><strong>Matricule :</strong> ${escapeHtml(
          account.matricule,
        )}</p>` +
        `<p style="margin:0 0 6px"><strong>Rôle :</strong> ${escapeHtml(
          account.role || "admin",
        )}</p>` +
        `<p style="margin:0 0 6px"><strong>Contact :</strong> ${escapeHtml(
          account.contact || "—",
        )}</p>` +
        `<p style="margin:0 0 6px"><strong>E-mail :</strong> ${escapeHtml(
          account.email || "—",
        )}</p>` +
        `<p style="margin:12px 0 0;padding-top:10px;border-top:1px solid #e2e8f0;font-size:.82rem;color:#5b6b7c">` +
        `${
          account.is_super_admin
            ? "Compte de référence : il ne peut pas perdre son statut de super administrateur."
            : "Compte standard : le mot de passe et les coordonnées se modifient depuis cette interface."
        }</p></div>`,
      icon: "info",
      confirmButtonText: "Fermer",
      confirmButtonColor: "#003366",
    });
  };

  const handleEdit = async (account) => {
    const { value: values } = await Swal.fire({
      title: `Modifier ${account.username}`,
      html:
        `<p style="font-size:.85rem;margin:0 0 8px">` +
        `Laissez le mot de passe vide pour ne pas le changer.</p>` +
        `<input id="swal-username" class="swal2-input" placeholder="Identifiant" value="${escapeHtml(
          account.username,
        )}">` +
        `<input id="swal-fullname" class="swal2-input" placeholder="Nom complet" value="${escapeHtml(
          account.full_name,
        )}">` +
        `<input id="swal-matricule" class="swal2-input" placeholder="Matricule" value="${escapeHtml(
          account.matricule,
        )}">` +
        `<input id="swal-role" class="swal2-input" placeholder="Rôle" value="${escapeHtml(
          account.role || "admin",
        )}">` +
        `<input id="swal-contact" class="swal2-input" placeholder="Contact" value="${escapeHtml(
          account.contact,
        )}">` +
        `<input id="swal-email" class="swal2-input" type="email" placeholder="E-mail" value="${escapeHtml(
          account.email,
        )}">` +
        `<input id="swal-password" class="swal2-input" type="password" placeholder="Nouveau mot de passe (optionnel)">`,
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
          full_name: document.getElementById("swal-fullname").value.trim(),
          matricule: document.getElementById("swal-matricule").value.trim(),
          role: document.getElementById("swal-role").value.trim() || "admin",
          contact: document.getElementById("swal-contact").value.trim(),
          email: document.getElementById("swal-email").value.trim(),
          password: document.getElementById("swal-password").value || undefined,
        };
      },
    });

    if (!values) return;

    try {
      await axios.patch(`${API_URL}admins/${account.id}/`, values, {
        headers: adminHeaders(),
        timeout: 30000,
      });

      if (
        String(account.id) === localStorage.getItem("admin_id") &&
        values.username
      ) {
        localStorage.setItem("admin_username", values.username);
      }

      Swal.fire({
        title: "Compte modifié",
        text: "Les informations ont été enregistrées.",
        icon: "success",
      });
      fetchAccounts();
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      Swal.fire({
        title: "Modification impossible",
        text: parseApiError(err),
        icon: "error",
      });
    }
  };

  const handleDelete = async (account) => {
    const isSelf = String(account.id) === localStorage.getItem("admin_id");
    const result = await Swal.fire({
      title: `Supprimer ${account.username} ?`,
      html: isSelf
        ? "Vous allez supprimer <strong>votre propre compte</strong> et serez déconnecté."
        : "Le compte de test sera définitivement supprimé.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#c0392b",
      cancelButtonColor: "#55677c",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}admins/${account.id}/`, {
        headers: adminHeaders(),
        timeout: 20000,
      });

      if (isSelf) {
        clearAdminSession();
        navigate("/admin-login", { replace: true });
        return;
      }

      Swal.fire({ title: "Compte supprimé", icon: "success" });
      fetchAccounts();
    } catch (err) {
      if (handleAdminAuthError(err)) return;
      Swal.fire({
        title: "Suppression impossible",
        text: parseApiError(err),
        icon: "error",
      });
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return accounts;

    return accounts.filter((account) =>
      [
        account.username,
        account.full_name,
        account.matricule,
        account.role,
        account.contact,
        account.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [accounts, search]);

  if (!allowed) {
    return (
      <AdminShell title="Comptes administrateurs" subtitle="Accès restreint">
        <section className="sig-card aam-forbidden">
          <ShieldOff size={28} aria-hidden="true" />
          <h2>Accès réservé au super administrateur</h2>
          <p>
            Seul le compte de référence peut gérer les autres comptes
            administrateurs.
          </p>
          <Link className="sig-btn sig-btn--ghost" to="/admin-dashboard">
            Retour au tableau de bord
          </Link>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Comptes administrateurs"
      subtitle="Créez des comptes de test, modifiez-les puis supprimez-les après le test"
    >
      <div className="aam-layout">
        <section className="sig-card aam-form-card">
          <div className="sig-card__head aam-card-head">
            <h2 className="sig-card__title">
              <UserPlus size={18} aria-hidden="true" />
              Nouveau compte admin
            </h2>
          </div>

          <form className="aam-form" onSubmit={handleCreate}>
            <div className="sig-field">
              <label className="sig-label" htmlFor="aam-username">
                Identifiant *
              </label>
              <input
                id="aam-username"
                className="sig-input"
                type="text"
                name="username"
                autoComplete="off"
                placeholder="Ex. testeur01"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="aam-fullname">
                Nom complet
              </label>
              <input
                id="aam-fullname"
                className="sig-input"
                type="text"
                name="full_name"
                autoComplete="off"
                placeholder="Ex. Compte Testeur"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="aam-role">
                Rôle
              </label>
              <input
                id="aam-role"
                className="sig-input"
                type="text"
                name="role"
                autoComplete="off"
                placeholder="admin"
                value={formData.role}
                onChange={handleChange}
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="aam-matricule">
                Matricule
              </label>
              <input
                id="aam-matricule"
                className="sig-input"
                type="text"
                name="matricule"
                autoComplete="off"
                placeholder="Généré si vide"
                value={formData.matricule}
                onChange={handleChange}
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="aam-contact">
                Contact
              </label>
              <input
                id="aam-contact"
                className="sig-input"
                type="text"
                name="contact"
                autoComplete="off"
                placeholder="Ex. 034 00 000 00"
                value={formData.contact}
                onChange={handleChange}
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="aam-email">
                E-mail
              </label>
              <input
                id="aam-email"
                className="sig-input"
                type="email"
                name="email"
                autoComplete="off"
                placeholder="Ex. testeur@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="sig-field">
              <label className="sig-label" htmlFor="aam-password">
                Mot de passe *
              </label>
              <input
                id="aam-password"
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
              className="sig-btn sig-btn--primary aam-submit"
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
              {saving ? "Création…" : "Créer le compte"}
            </button>
          </form>
        </section>

        <section className="sig-card aam-list-card">
          <div className="sig-card__head aam-card-head aam-toolbar">
            <h2 className="sig-card__title">
              <Users size={18} aria-hidden="true" />
              Comptes existants
              <span className="aam-count">
                {filtered.length} / {accounts.length}
              </span>
            </h2>

            <div className="ad-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                className="sig-input ad-search__input"
                placeholder="Rechercher un identifiant, un nom, un rôle…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Rechercher un compte administrateur"
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
              <LoaderCircle size={22} className="sig-spin" aria-hidden="true" />
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
                onClick={fetchAccounts}
              >
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="sig-empty">
              <span className="sig-empty__icon">
                <Users size={22} aria-hidden="true" />
              </span>
              <p className="sig-empty__title">
                {search
                  ? "Aucun compte ne correspond"
                  : "Aucun compte administrateur"}
              </p>
            </div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Compte</th>
                    <th>Identifiant</th>
                    <th>Rôle</th>
                    <th>Contact</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <span className="ad-client">
                          {account.full_name || account.username}
                        </span>
                        <span className="ad-client__meta">
                          {account.matricule}
                        </span>
                      </td>
                      <td>
                        <code className="aam-username">{account.username}</code>
                      </td>
                      <td>{account.role || "admin"}</td>
                      <td>{account.contact || "—"}</td>
                      <td>
                        {account.is_super_admin ? (
                          <span className="aam-badge aam-badge--super">
                            <ShieldCheck size={13} aria-hidden="true" />
                            Super admin
                          </span>
                        ) : (
                          <span className="aam-badge">Admin</span>
                        )}
                      </td>
                      <td>
                        <div className="ad-row-actions">
                          <button
                            type="button"
                            className="sig-btn sig-btn--ghost sig-btn--sm"
                            onClick={() => handleView(account)}
                          >
                            <Eye size={14} aria-hidden="true" />
                            Voir
                          </button>
                          <button
                            type="button"
                            className="sig-btn sig-btn--ghost sig-btn--sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="ad-icon-btn"
                            onClick={() => handleDelete(account)}
                            aria-label={`Supprimer ${account.username}`}
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

export default AdminAccountManager;
