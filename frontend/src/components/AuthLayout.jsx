import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CircleCheck } from "lucide-react";
import "./AuthLayout.css";

/**
 * Mise en page commune aux deux écrans de connexion
 * (technicien et administrateur) : panneau de marque + formulaire.
 */
const AuthLayout = ({
  Icon,
  role,
  title,
  subtitle,
  panelTitle,
  panelText,
  points = [],
  accent = "navy",
  children,
}) => (
  <div className="sig-shell auth">
    <div className="auth__card">
      <aside className="auth__panel">
        <Link to="/" className="auth__brand" aria-label="Signaleo, accueil">
          <img 
            src="/apple-touch-icon.png" 
            alt="Signaleo logo" 
            width="32" 
            height="32" 
            style={{ display: "block", borderRadius: "8px" }}
          />
          <span style={{ marginLeft: "8px", fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>Signaleo</span>
        </Link>

        <div className="auth__panel-body">
          <h2 className="auth__panel-title">{panelTitle}</h2>
          <p className="auth__panel-text">{panelText}</p>

          {points.length > 0 && (
            <ul className="auth__points">
              {points.map((point) => (
                <li key={point}>
                  <CircleCheck size={16} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="auth__panel-foot">
          Gestion des pannes
        </p>
      </aside>

      <section className="auth__body">
        <span className={`auth__role auth__role--${accent}`}>
          <Icon size={15} aria-hidden="true" />
          {role}
        </span>

        <h1 className="auth__title">{title}</h1>
        <p className="auth__sub">{subtitle}</p>

        {children}

        <Link to="/" className="auth__back">
          <ArrowLeft size={15} aria-hidden="true" />
          Retour au site
        </Link>
      </section>
    </div>
  </div>
);

export default AuthLayout;
