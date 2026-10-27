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
import "./AdminProfile.css";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}admins/1/`);
        setFormData({ ...res.data, password: "" });
      } catch (err) {
        console.error("Erreur chargement admin", err);
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
      await axios.put(`${process.env.REACT_APP_API_URL}admins/1/`, formData);
      Swal.fire({
        title: "Informations mises à jour",
        text: "Votre profil a bien été enregistré.",
        icon: "success",
      });
    } catch (err) {
      console.error("Erreur mise à jour", err);
      Swal.fire({
        title: "Mise à jour impossible",
        text: "Vérifiez les champs puis réessayez.",
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
                </div>
              </div>

              <div className="ap-actions">
                <button
                  type="submit"
                  className="sig-btn sig-btn--primary"
                  disabled={saving}
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
