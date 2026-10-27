import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChartColumn,
  CircleHelp,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react";
import "./HelpPage.css";

const TABS = {
  client: {
    label: "Client",
    Icon: User,
    intro:
      "Tout ce qu'un client peut faire depuis le site, sans créer de compte.",
    items: [
      {
        Icon: ChartColumn,
        title: "Signaler une panne",
        text: "Nom, contact, quartier, localisation et description : quatre champs suffisent pour envoyer une déclaration.",
      },
      {
        Icon: MapPin,
        title: "Utiliser sa position GPS",
        text: "Le bouton « Ma position » remplit automatiquement les coordonnées de l'incident.",
      },
      {
        Icon: Phone,
        title: "Joindre une photo",
        text: "Une photo du compteur ou du câble aide le technicien à préparer son intervention.",
      },
      {
        Icon: ChartColumn,
        title: "Suivre l'avancement",
        text: "La page « Suivi » affiche le statut en temps réel, actualisé toutes les 5 secondes.",
      },
    ],
  },
  technicien: {
    label: "Technicien",
    Icon: Wrench,
    intro: "L'espace terrain pour traiter les pannes affectées.",
    items: [
      {
        Icon: ChartColumn,
        title: "Voir ses interventions",
        text: "Chaque panne affectée apparaît avec son quartier, sa description et sa photo.",
      },
      {
        Icon: Wrench,
        title: "Mettre à jour le statut",
        text: "En attente, en route, en cours, résolue : le client voit le changement immédiatement.",
      },
      {
        Icon: MapPin,
        title: "Localiser sur la carte",
        text: "Une carte OpenStreetMap situe précisément l'incident avant le déplacement.",
      },
    ],
  },
  admin: {
    label: "Administrateur",
    Icon: ShieldCheck,
    intro: "Le poste de pilotage complet du service.",
    items: [
      {
        Icon: ChartColumn,
        title: "Superviser les signalements",
        text: "Tableau de bord global avec compteurs, statuts et notifications de nouvelles pannes.",
      },
      {
        Icon: User,
        title: "Affecter un technicien",
        text: "Chaque panne peut être attribuée au technicien le plus proche en un clic.",
      },
      {
        Icon: Wrench,
        title: "Gérer l'équipe",
        text: "Création, modification et suppression des comptes techniciens.",
      },
      {
        Icon: ChartColumn,
        title: "Analyser les statistiques",
        text: "Histogramme des pannes par date et par statut pour suivre la charge du service.",
      },
    ],
  },
};

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState("client");
  const current = TABS[activeTab];

  return (
    <div className="sig-shell">
      <header className="sig-header">
        <div className="sig-header__inner">
          <Link to="/" className="sig-brand" aria-label="Signaleo, accueil">
            <img 
              src="/apple-touch-icon.png" 
              alt="Signaleo logo" 
              width="30" 
              height="30" 
              style={{ display: "block", borderRadius: "8px" }}
            />
            <span style={{ marginLeft: "8px", fontSize: "18px", fontWeight: "800", color: "#003366" }}>Signaleo</span>
          </Link>

          <nav className="sig-nav" aria-label="Navigation principale">
            <Link to="/" className="sig-nav__link">
              <CircleHelp size={17} aria-hidden="true" />
              Signaler
            </Link>
            <Link to="/suivi" className="sig-nav__link">
              <ChartColumn size={17} aria-hidden="true" />
              Suivi
            </Link>
            <Link to="/login" className="sig-nav__link">
              <Wrench size={17} aria-hidden="true" />
              Technicien
            </Link>
            <Link to="/admin-login" className="sig-nav__link sig-nav__link--strong">
              <ShieldCheck size={17} aria-hidden="true" />
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="sig-page sig-page--medium">
        <div className="hp-head">
          <span className="sig-eyebrow">
            <CircleHelp size={15} aria-hidden="true" />
            Documentation
          </span>
          <h1 className="sig-title">Centre d'aide</h1>
          <p className="sig-sub">
            Signaleo relie les clients, les techniciens et l'administration dans un
            seul flux de traitement des pannes.
          </p>
        </div>

        <div className="hp-tabs" role="tablist" aria-label="Choisir un profil">
          {Object.entries(TABS).map(([key, tab]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={`hp-tab${activeTab === key ? " hp-tab--active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <tab.Icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        <section className="sig-card hp-card">
          <div className="sig-card__head hp-card__head">
            <h2 className="sig-card__title">
              <current.Icon size={18} aria-hidden="true" />
              Espace {current.label.toLowerCase()}
            </h2>
          </div>
          <p className="hp-intro">{current.intro}</p>

          <ul className="hp-list">
            {current.items.map(({ Icon, title, text }) => (
              <li className="hp-item" key={title}>
                <span className="hp-item__icon">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div>
                  <p className="hp-item__title">{title}</p>
                  <p className="hp-item__text">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="sig-card hp-contact">
          <div className="hp-contact__body">
            <h2 className="sig-card__title">
              <Mail size={18} aria-hidden="true" />
              Contacter le développeur
            </h2>
            <p className="hp-intro">
              Une question sur ce projet ? Le plus simple est de m'écrire
              directement.
            </p>
          </div>

          <div className="hp-contact__links">
            <a className="hp-contact__link" href="tel:+261385442252">
              <Phone size={16} aria-hidden="true" />
              038 54 422 52
            </a>
            <a className="hp-contact__link" href="mailto:zomahefaranaivo@gmail.com">
              <Mail size={16} aria-hidden="true" />
              zomahefaranaivo@gmail.com
            </a>
            <a
              className="hp-contact__link"
              href="https://facebook.com/zo.mahefa.ranaivo"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Zo Mahefa Ranaivo
            </a>
          </div>
        </section>

        <Link to="/" className="sig-btn sig-btn--ghost hp-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Retour au signalement
        </Link>
      </main>
    </div>
  );
};

export default HelpPage;
