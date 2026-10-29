"""Limitation de débit des endpoints publics.

Signaleo expose deux routes sans authentification (dépôt d'un signalement et
notification) et deux routes de connexion. Sans limite, elles permettent de
saturer la base, d'inonder les notifications ou de deviner un mot de passe.

Les compteurs sont stockés dans le cache Django (voir ``CACHES``), partagé
par les workers gunicorn.
"""

from rest_framework.throttling import SimpleRateThrottle


class IPRateThrottle(SimpleRateThrottle):
    """Limite par adresse IP, y compris pour un utilisateur authentifié.

    ``AnonRateThrottle`` de DRF ne compte que les requêtes anonymes : un
    compte connecté contournerait la limite. Ici l'identité est toujours
    l'adresse IP, ce qui protège aussi les routes de connexion.
    """

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


class IncidentCreateThrottle(IPRateThrottle):
    """Dépôt d'un signalement client."""

    scope = 'incident_create'


class NotifyAdminThrottle(IPRateThrottle):
    """Notification envoyée au tableau de bord après un signalement."""

    scope = 'notify_admin'


class AdminLoginThrottle(IPRateThrottle):
    """Tentatives de connexion administrateur."""

    scope = 'admin_login'


class TechnicianLoginThrottle(IPRateThrottle):
    """Tentatives de connexion technicien (endpoint JWT)."""

    scope = 'technician_login'


class AdminRegisterThrottle(IPRateThrottle):
    """Tentatives de saisie du code d'inscription administrateur."""

    scope = 'admin_register'
