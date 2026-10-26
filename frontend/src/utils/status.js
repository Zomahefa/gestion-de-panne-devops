import { Clock, Truck, Wrench, CircleCheck, CircleDot } from "lucide-react";

/**
 * Source unique de vérité pour les statuts d'une panne.
 * Utilisée par toutes les vues (client, technicien, admin, graphiques)
 * afin que libellés, couleurs et icônes restent cohérents.
 */
export const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    short: "En attente",
    Icon: Clock,
    tone: "pending",
  },
  on_the_way: {
    label: "Technicien en route",
    short: "En route",
    Icon: Truck,
    tone: "route",
  },
  in_progress: {
    label: "Intervention en cours",
    short: "En cours",
    Icon: Wrench,
    tone: "progress",
  },
  resolved: {
    label: "Panne résolue",
    short: "Résolu",
    Icon: CircleCheck,
    tone: "resolved",
  },
};

export const STATUS_ORDER = [
  "pending",
  "on_the_way",
  "in_progress",
  "resolved",
];

export const getStatus = (value) =>
  STATUS_CONFIG[value] || {
    label: value || "Inconnu",
    short: value || "Inconnu",
    Icon: CircleDot,
    tone: "unknown",
  };

/** Badge de statut prêt à l'emploi : <StatusBadge status={todo.status} /> */
export const statusBadgeClass = (value) =>
  `sig-badge sig-badge--${getStatus(value).tone}`;
