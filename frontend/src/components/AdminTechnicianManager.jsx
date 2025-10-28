import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './AdminTechnicianManager.css';
import { Link } from 'react-router-dom';

const AdminTechnicianManager = () => {
  const [technicians, setTechnicians] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    matricule: '',
    contact: '',
    password: '',
  });

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/technicians/');
      setTechnicians(res.data);
    } catch (err) {
      console.error('Erreur chargement techniciens', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const generatedUsername = formData.full_name
      ? formData.full_name.toLowerCase().replace(/\s+/g, '')
      : null;

    if (!generatedUsername) {
      Swal.fire('❌ Nom complet requis pour générer le nom d’utilisateur');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/technicians/', {
        username: generatedUsername,
        full_name: formData.full_name,
        matricule: formData.matricule,
        contact: formData.contact,
        password: formData.password,
      });
      Swal.fire('✅ Technicien ajouté !');
      setFormData({ full_name: '', matricule: '', contact: '', password: '' });
      fetchTechnicians();
    } catch (err) {
      console.log(err.response?.data);
      Swal.fire('❌ Erreur création technicien');
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
      confirmButtonText: 'Modifier',
      preConfirm: () => {
        return {
          full_name: document.getElementById('swal-fullname').value,
          matricule: document.getElementById('swal-matricule').value,
          contact: document.getElementById('swal-contact').value,
          password: document.getElementById('swal-password').value || undefined,
        };
      },
    });

    if (formValues) {
      try {
        await axios.put(`http://localhost:8000/api/technicians/${tech.id}/`, formValues);
        Swal.fire('✅ Technicien modifié !');
        fetchTechnicians();
      } catch (err) {
        console.log('Erreur modification :', err.response?.data);
        Swal.fire('❌ Erreur modification');
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '🗑️ Supprimer ce technicien ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:8000/api/technicians/${id}/`);
        Swal.fire('✅ Supprimé !');
        fetchTechnicians();
      } catch (err) {
        Swal.fire('❌ Erreur suppression');
      }
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  return (
    <div className="admin-tech-container">
      <h2>👥 Gestion des techniciens</h2>

      <form onSubmit={handleCreate} className="tech-form">
        <input type="text" name="full_name" autoComplete="off" placeholder="Nom complet" value={formData.full_name} onChange={handleChange} required />
        <input type="text" name="matricule" autoComplete="off" placeholder="Matricule" value={formData.matricule} onChange={handleChange} required />
        <input type="text" name="contact" autoComplete="off" placeholder="Contact" value={formData.contact} onChange={handleChange} required />
        <input type="password" name="password" autoComplete="new-password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} required />
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="submit" className="btn btn-success">➕ Ajouter</button>
          <Link to="/admin-dashboard" className="btn btn-secondary">⬅️ Retour admin</Link>
        </div>
      </form>

      <table className="table mt-4">
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
              <td>{tech.full_name}</td>
              <td>{tech.matricule}</td>
              <td>{tech.contact}</td>
              <td>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn btn-sm btn-warning" onClick={() => handleEdit(tech)}>✏️ Modifier</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tech.id)}>🗑️ Supprimer</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTechnicianManager;
