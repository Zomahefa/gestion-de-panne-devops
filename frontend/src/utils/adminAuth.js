/**
 * Session administrateur.
 *
 * Le jeton renvoyé par `admin-login` est un JWT signé : il doit accompagner
 * chaque appel à une route d'administration. Centraliser ici évite d'oublier
 * un en-tête et facilite le traitement d'une session expirée.
 */

export const getAdminToken = () => localStorage.getItem("admin_token") || "";

export const isAdminAuthenticated = () => Boolean(getAdminToken());

/**
 * Le compte connecté est-il le super administrateur ? Lui seul voit et gère
 * les autres comptes administrateurs (comptes de test).
 */
export const isSuperAdmin = () =>
  localStorage.getItem("admin_is_super") === "1";

export const adminHeaders = () => {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const clearAdminSession = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_id");
  localStorage.removeItem("admin_username");
  localStorage.removeItem("admin_is_super");
};

/**
 * Réagit à une réponse 401/403 sur une route d'administration : la session
 * n'est plus valide, on nettoie et on renvoie vers la connexion.
 *
 * @returns {boolean} true si l'erreur a été traitée (session expirée).
 */
export const handleAdminAuthError = (error) => {
  const status = error?.response?.status;
  if (status !== 401 && status !== 403) return false;

  clearAdminSession();

  if (window.location.pathname !== "/admin-login") {
    window.location.assign("/admin-login");
  }
  return true;
};
