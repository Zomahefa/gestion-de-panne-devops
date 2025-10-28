import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HelpPage.css';

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState('client');

  const renderContent = () => {
    switch (activeTab) {
      case 'client':
        return (
          <ul>
            <li>📢 Signaler une panne avec nom, contact, quartier, localisation et description</li>
            <li>📍 Utiliser sa position GPS pour localiser la panne</li>
            <li>📷 Joindre une photo de la panne</li>
            <li>📊 Suivre l’état de sa panne dans “Suivi des pannes”</li>
            <li>📞 Contacter JIRAMA:0347896345</li>
          </ul>
          
        );
      case 'technicien':
        return (
          <ul>
            <li>Voir les pannes attribuées</li>
            <li>Changer le statut : En attente → En route → En cours → Résolu</li>
            <li>Voir la carte de localisation et la photo</li>
          </ul>
        );
      case 'admin':
        return (
          <ul>
            <li>Voir toutes les pannes signalées</li>
            <li>Attribuer une panne à un technicien</li>
            <li>Modifier les informations de son propre compte</li>
            <li>Voir les notifications de nouvelles pannes</li>
            <li>Accéder à l’histogramme des pannes</li>
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="help-page">
      <div className="help-tabs">
        <button onClick={() => setActiveTab('client')} className={activeTab === 'client' ? 'active' : ''}>👤 Client</button>
        <button onClick={() => setActiveTab('technicien')} className={activeTab === 'technicien' ? 'active' : ''}>🔧 Technicien</button>
        <button onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'active' : ''}>🛠️ Administrateur</button>
      </div>

      <div className="help-content">
        <h2>❓ Centre d’aide</h2>
        <p>Bienvenue sur l’application de gestion des pannes JIRAMA. Voici ce que chaque utilisateur peut faire :</p>
        {renderContent()}
        <h4 className="mt-4">📞 Contacter le développeur</h4>
        <p><strong>Téléphone :</strong> 0342075279</p>
        <p><strong>Email :</strong> zomahefaranaivo@gmail.com</p>
        <p><strong>Facebook :</strong> <a href="https://facebook.com/zo.mahefa.ranaivo" target="_blank" rel="noreferrer">zo mahefa ranaivo</a></p>
        <Link to="/ClientForm" className="btn btn-outline-primary mb-3">🔙 Retour </Link>
      </div>
    </div>
  );
};

export default HelpPage;
