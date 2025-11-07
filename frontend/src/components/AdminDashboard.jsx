import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './AdminDashboard.css';
import { Link } from 'react-router-dom';

const statusLabels = {
  pending: 'En attente',
  on_the_way: 'En route',
  in_progress: 'En cours',
  resolved: 'Terminé',
};
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${window.location.origin}${imagePath}`;
  };
const AdminDashboard = () => {
  const [pannes, setPannes] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchPannes = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}todos/`);
      setPannes(res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error('Erreur de chargement des pannes', err);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}technicians/`);
      setTechnicians(res.data);
    } catch (err) {
      console.error('Erreur chargement techniciens', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}notifications/`);
      setNotifications(res.data.slice(0, 5)); // les 5 plus récentes
    } catch (err) {
      console.error('Erreur chargement notifications', err);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '🗑️ Supprimer ce signalement ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}todos/${id}/`);
        setPannes(prev => prev.filter(p => p.id !== id));
        Swal.fire('Supprimé !', 'Le signalement a été supprimé.', 'success');
      } catch (err) {
        Swal.fire('Erreur', 'La suppression a échoué.', 'error');
      }
    }
  };

  const handleAssign = async (panneId) => {
    const { value: techId } = await Swal.fire({
      title: 'Attribuer à un technicien',
      input: 'select',
      inputOptions: technicians.reduce((acc, tech) => {
        acc[tech.id] = `${tech.full_name} (${tech.matricule})`;
        return acc;
      }, {}),
      inputPlaceholder: 'Choisir un technicien',
      showCancelButton: true,
    });

    if (techId) {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}attributions/`, {
          panne: panneId,
          technician: techId,
          assigned_by: 1, // à remplacer par l'ID réel de l'admin connecté
        });
        Swal.fire('✅ Tâche attribuée !');
        fetchPannes();
      } catch (err) {
        console.error('Erreur attribution', err.response?.data);
        Swal.fire('❌ Erreur attribution');
      }
    }
  };

  useEffect(() => {
    fetchPannes();
    fetchTechnicians();
    fetchNotifications();
  }, []);

  return (
    <div className="admin-dashboard-container">
      <div className="admin-nav mb-4">
        <Link to="/admin-technicians" className="btn btn-outline-info">👥 Gérer les techniciens</Link>
        <Link to="/" className="btn btn-outline-primary me-2">🏠 Accueil client</Link>
        <Link to="/login" className="btn btn-outline-secondary me-2">🔧 Technicien</Link>
        <Link to="/suivi" className="btn btn-outline-warning">📊 Suivi des pannes</Link>
        <Link to="/admin-profile" className="btn btn-outline-dark me-2">👤 Voir mes infos</Link>
        <Link to="/admin-chart" className="btn btn-outline-success me-2">📊 Voir histogramme</Link>
      </div>

      <h2>📋 Tableau de bord administrateur</h2>

      <h4 className="mt-4">🔔 Notifications récentes</h4>
      <ul className="list-group mb-4">
        {notifications.length === 0 ? (
          <li className="list-group-item text-muted">Aucune notification</li>
        ) : (
          notifications.map((notif) => (
            <li key={notif.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                {notif.message}
                <br />
                <small className="text-muted">{new Date(notif.created_at).toLocaleString()}</small>
              </div>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={async () => {
                  try {
                    await axios.delete(`${process.env.REACT_APP_API_URL}notifications/${notif.id}/`);
                    setNotifications(prev => prev.filter(n => n.id !== notif.id));
                  } catch (err) {
                    Swal.fire('Erreur', 'Suppression échouée', 'error');
                  }
                }}
              >
                ❌
              </button>
            </li>
          ))
        )}
      </ul>


      <table className="table table-striped">
        <thead>
          <tr>
            <th>Client</th>
            <th>Contact</th>
            <th>Quartier</th>
            <th>Localisation</th>
            <th>Description</th>
            <th>Image</th>
            <th>Statut</th>
            <th>Technicien</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pannes.map((panne) => (
            <tr key={panne.id}>
              <td>{panne.client_name}</td>
              <td>{panne.contact}</td>
              <td>{panne.quartier}</td>
              <td>{panne.localisation}</td>
              <td>{panne.description}</td>
              <td>
                {panne.image ? (
                  <img
                    src={getImageUrl(panne.image)}
                    alt="Panne"
                    className="admin-image"
                  />
                ) : (
                  <span className="text-muted">Aucune</span>
                )}
              </td>
              <td>{statusLabels[panne.status]}</td>
              <td>{panne.technician_confirmed?.username || 'Aucun'}</td>
              <td>
                <button
                  className="btn btn-sm btn-info me-2"
                  onClick={() => handleAssign(panne.id)}
                >
                  Attribuer à
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(panne.id)}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
