import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import AdminShell from "./AdminShell.jsx";
import "./AdminTechnicianManager.css";

const EMPTY = { full_name: "", matricule: "", contact: "", password: "" };

const AdminTechnicianManager = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY);

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}technicians/`);
      setTechnicians(res.data);
    } catch (err) {
      console.error("Erreur chargement techniciens", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const translate = (msg) => {
    if (msg.includes("This password is too short")) {
      return "Le mot de passe est trop court (8 caractères minimum).";
    }
    if (msg.includes("This password is too common")) {
      return "Le mot de passe est trop commun, choisissez-en un plus solide.";
    }
    if (msg.includes("This password is entirely numeric")) {
      return "Le mot de passe ne doit pas contenir uniquement des chiffres.";
    }
    return msg;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    const generatedUsername = formData.full_name
      ? formData.full_name.toLowerCase().replace(/\s+/g, "")
      : null;

    if (!generatedUsername) {
      setSaving(false);
      Swal.fire({
        title: "Nom complet requis",
        text: "Le nom d'utilisateur est généré à partir du nom complet.",
        icon: "warning",
      });
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}technicians/`, {
        username: generatedUsername,
        full_name: formData.full_name,
        matricule: formData.matricule,
        contact: formData.contact,
        password: formData.password,
      });
      Swal.fire({
        title: "Technicien ajouté",
        text: `${formData.full_name} peut désormais se connecter.`,
        icon: "success",
      });
      setFormData(EMPTY);
      fetchTechnicians();
    } catch (err) {
      const errors = err.response?.data;
      const message = errors
        ? Object.values(errors).flat().map(translate).join("\n")
        : "Une erreur inconnue est survenue.";
      Swal.fire({ title: "Création impossible", text: message, icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (tech) => {
    const { value: formValues } = await Swal.fire({
      title: `Modifier ${tech.full_name}`,
      html:
        `<input id="swal-fullname" class="swal2-input" placeholder="Nom complet" value="${tech.full_name}">` +
        `<input id="swal-matricule" class="swal2-input" placeholder="Matricule" value="${tech.matricule}">` +
        `<input id="swal-contact" class="swal2-input" placeholder="Contact" value="${tech.contact}">` +
        `<input id="swal-password" class="swal2-input" placeholder="Nouveau mot de passe (optionnel)" type="password">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Enregistrer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#003366",
      preConfirm: () => ({
        full_name: document.getElementById("swal-fullname").value,
        matricule: document.getElementById("swal-matricule").value,
        contact: document.getElementById("swal-contact").value,
        password: document.getElementById("swal-password").value || undefined,
      }),
    });

    if (formValues) {
      try {
        await axios.put(
          `${process.env.REACT_APP_API_URL}technicians/${tech.id}/`,
          formValues,
        );
        Swal.fire({
          title: "Technicien modifié",
          icon: "success",
        });
        fetchTechnicians();
      } catch (err) {
        Swal.fire({
          title: "Modification impossible",
          text: "Vérifiez les informations saisies.",
          icon: "error",
        });
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Supprimer ce technicien ?",
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
        await axios.delete(`${process.env.REACT_APP_API_URL}technicians/${id}/`);
        Swal.fire({ title: "Technicien supprimé", icon: "success" });
        fetchTechnicians();
      } catch (err) {
        Swal.fire({ title: "Suppression impossible", icon: "error" });
      }
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
              <span className="sig-hint">
                Le nom d'utilisateur est généré automatiquement.
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
                <LoaderCircle size={17} className="sig-spin" aria-hidden="true" />
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
            <span className="atm-count">{technicians.length} technicien(s)</span>
          </div>

          {loading ? (
            <div className="sig-empty">
              <LoaderCircle size={22} className="sig-spin" aria-hidden="true" />
              <p className="sig-empty__title">Chargement…</p>
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
                        <span className="ad-client__meta">{tech.username}</span>
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
                            onClick={() => handleDelete(tech.id)}
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
