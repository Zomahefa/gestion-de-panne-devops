import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TechnicianDashboard.css';
import { Link } from 'react-router-dom';
import MapView from './MapView';

const TechnicianDashboard = () => {
  const extractCoordinates = (text) => {
    if (!text) return null;
    const regex = /(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/;
    const match = text.toString().match(regex);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      };
    }
    return null;
  };

  const [incidents, setIncidents] = useState([]);
  const [filter, setFilter] = useState('Tous');
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    setCurrentUsername(storedUsername || '');
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}todos/`);
      setIncidents(res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error("Erreur chargement incidents:", err);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}todos/${id}/`, { status: newStatus });
      setIncidents(prev =>
        prev.map(incident =>
          incident.id === id ? { ...incident, status: newStatus } : incident
        )
      );
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
    }
  };

  const filteredIncidents = filter === 'Tous'
    ? incidents
    : incidents.filter(i => i.status === filter.toLowerCase());

  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link to="/" className="btn btn-outline-primary">🏠 Retour client</Link>
      </div>

      <h2>🔧 Tableau de bord technicien</h2>

      <select className="form-select mb-3" onChange={e => setFilter(e.target.value)} value={filter}>
        <option value="Tous">Tous</option>
        <option value="pending">En attente</option>
        <option value="on_the_way">En route</option>
        <option value="in_progress">En cours</option>
        <option value="resolved">Résolu</option>
      </select>

      <ul>
        {filteredIncidents.map(incident => {
          const coords = extractCoordinates(incident.localisation);
          const isAssignedToMe = incident.technician_confirmed?.username?.toLowerCase() === currentUsername?.toLowerCase();

          return (
            <li key={incident.id}>
              <strong>{incident.client_name}</strong> – {incident.localisation}
              <br />
              <em>Statut : {
                incident.status === 'pending' ? '🕒 En attente' :
                incident.status === 'on_the_way' ? '🚗 En route' :
                incident.status === 'in_progress' ? '🔧 En cours' :
                incident.status === 'resolved' ? '✅ Résolu' :
                incident.status
              }</em>
              <br />
              <strong>👨‍🔧 Technicien attribué :</strong> {incident.technician_confirmed?.username || 'Aucun'}

              {isAssignedToMe ? (
                <>
                  <label className="mt-2">Changer le statut :</label>
                  <select
                    className="form-select mt-1"
                    value={incident.status}
                    onChange={(e) => handleStatusUpdate(incident.id, e.target.value)}
                  >
                    <option value="pending">🕒 En attente</option>
                    <option value="on_the_way">🚗 En route</option>
                    <option value="in_progress">🔧 En cours</option>
                    <option value="resolved">✅ Résolu</option>
                  </select>
                </>
              ) : (
                <p className="text-muted mt-2">⛔ Non attribué à vous</p>
              )}

              {incident.image && (
                <div className="incident-image-container mt-2">
                  <strong>📷 Photo signalée :</strong><br />
                  <img
                    src={incident.image}
                    alt="Photo de la panne"
                    className="incident-image"
                  />
                </div>
              )}

              {coords ? (
                <MapView
                  latitude={coords.latitude}
                  longitude={coords.longitude}
                  description={incident.description}
                />
              ) : (
                <p className="text-muted">📍 Localisation non disponible</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TechnicianDashboard;
