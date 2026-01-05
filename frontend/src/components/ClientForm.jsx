import React, { useState } from 'react';
import axios from 'axios';
import './ClientForm.css';
import { Link } from 'react-router-dom';
import logoJirama from './logo-jirama.png';

const ClientForm = () => {
  const [formData, setFormData] = useState({
    client_name: '',
    contact: '',
    quartier: '',
    lot: '',
    localisation: '',
    description: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Géolocalisation non supportée.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
        console.log("📍 Coordonnées détectées :", coords);
        setFormData(prev => ({ ...prev, localisation: coords }));
      },
      (error) => {
        alert("Impossible d'obtenir la position.");
        console.warn("Erreur géolocalisation :", error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      data.append('status', 'pending');
      if (selectedImage) {
        data.append('image', selectedImage);
      }

      await axios.post(`${process.env.REACT_APP_API_URL}todos/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await axios.post(`${process.env.REACT_APP_API_URL}notify-admin/`, {
        message: `Nouvelle panne signalée par ${formData.client_name} à ${formData.localisation}`,
      });

      setSuccess(true);
      setError('');
      setFormData({
        client_name: '',
        contact: '',
        quartier: '',
        lot: '',
        localisation: '',
        description: '',
      });
      setSelectedImage(null);
    } catch (err) {
      console.error("Erreur envoi :", err);
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
      setSuccess(false);
    }
  };

  return (
    <div className="client-form-container">
      <div className="header">
        <img src={logoJirama} alt="Logo JIRAMA" className="logo" /><br />
        <div className="client-nav mb-4">
          <Link to="/login" className="btn btn-outline-secondary">🔧 Accès Technicien</Link>
          <Link to="/suivi" className="btn btn-outline-warning">📊 Suivi des pannes</Link>
          <Link to="/admin-login" className="btn btn-outline-dark">🛠️ Admin</Link>
        </div>
      </div>

      <h2>📢 signaler une panne</h2>

      <form onSubmit={handleSubmit}>
        <label>Nom du client</label>
        <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} required />

        <label>Contact (téléphone)</label>
        <input type="text" name="contact" value={formData.contact} onChange={handleChange} required />

        <label>Quartier</label>
        <input type="text" name="quartier" value={formData.quartier} onChange={handleChange} required />

        <label>Lot / Bloc</label>
        <input type="text" name="lot" value={formData.lot} onChange={handleChange} />

        <label>Localisation précise</label>
        <input type="text" name="localisation" value={formData.localisation} onChange={handleChange} required />
        <small className="text-muted">
          Vous pouvez entrer une adresse ou cliquer sur le bouton ci-dessous pour utiliser votre position actuelle.
        </small>
        <button type="button" onClick={detectLocation} className="btn btn-sm btn-outline-secondary mt-2">
          📍 Utiliser ma position actuelle
        </button>

        <label className="mt-3">Description de la panne</label>
        <textarea name="description" value={formData.description} onChange={handleChange} required />

        <label className="mt-2">Photo de la panne (optionnelle)</label>
        <input type="file" name="image" accept="image/*" onChange={handleImageChange} />

        <div className="form-actions">
          <button type="submit" className="btn btn-success">
            📨 Envoyer le signalement
          </button>
          <Link to="/help" className="aide-btn">Aide</Link>
        </div>
      </form>

      {success && <p className="success-message">✅ Signalement envoyé avec succès !</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ClientForm;
