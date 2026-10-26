import React from "react";

/**
 * Logo Signaleo : éclair orange sur carré navy + wordmark.
 * Le wordmark est rendu en texte (et non en SVG) pour rester net
 * à toutes les tailles et hériter de la couleur du parent.
 */
const SignaleoLogo = ({ size = 30, showText = true, textColor, className = "" }) => {
  return (
    <span
      className={`sig-logo ${className}`.trim()}
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.32 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        role="img"
        aria-label="Signaleo"
        style={{ flex: `0 0 ${size}px`, display: "block" }}
      >
        <defs>
          <linearGradient id="sigLogoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#003366" />
            <stop offset="100%" stopColor="#0b4a85" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="115" fill="url(#sigLogoGrad)" />
        <polygon
          points="286,38 125,289 228,289 202,474 389,215 271,215"
          fill="#ff9800"
        />
      </svg>

      {showText && (
        <span
          style={{
            fontSize: size * 0.72,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: textColor || "inherit",
          }}
        >
          Signaleo
        </span>
      )}
    </span>
  );
};

export default SignaleoLogo;
