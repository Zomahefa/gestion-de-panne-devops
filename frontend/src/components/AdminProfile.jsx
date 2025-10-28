import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './AdminProfile.css';
import { Link } from 'react-router-dom';

const AdminProfile = () => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    matricule: '',
    role: '',
    contact: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}admins/1/`);
        setFormData(res.data);
      } catch (err) {
        console.error('Erreur chargement admin', err);
      }
    };
    fetchAdmin();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const confirm = await Swal.fire({
      title: 'Confirmer la modification ?',
      text: 'Est-ce que vous voulez vraiment modifier les informations ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, modifier',
      cancelButtonText: 'Annuler',
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}admins/1/`, formData);
      Swal.fire('✅ Info modifiée', 'Les informations ont été mises à jour', 'success');
    } catch (err) {
      console.error('Erreur mise à jour', err);
      Swal.fire('❌ Échec', 'La mise à jour a échoué', 'error');
    }
  };

  return (
    
    <div className="admin-profile">
      <Link to="/admin-dashboard" className="btn btn-outline-primary mb-3">🔙 Retour </Link>
      <h2>🛠️ Modifier mes informations</h2>

      <label>Nom d'utilisateur :</label>
      <input name="username" value={formData.username} onChange={handleChange} />

      <label>Nom complet :</label>
      <input name="full_name" value={formData.full_name} onChange={handleChange} />

      <label>Matricule :</label>
      <input name="matricule" value={formData.matricule} onChange={handleChange} />

      <label>Métier :</label>
      <input name="role" value={formData.role} onChange={handleChange} />

      <label>Contact :</label>
      <input name="contact" value={formData.contact} onChange={handleChange} />

      <label>Email :</label>
      <input name="email" value={formData.email} onChange={handleChange} />

      <label>Mot de passe :</label>
      <input name="password" value={formData.password} onChange={handleChange} />

      <div className="button-group">
        <button className="btn btn-success" onClick={handleUpdate}>💾 Enregistrer</button>
      </div>
    </div>
  );
};

export default AdminProfile;
