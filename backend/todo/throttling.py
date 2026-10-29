"""Limitation de débit des endpoints publics.

Signaleo expose deux routes sans authentification (dépôt d'un signalement et
notification) et deux routes de connexion. Sans limite, elles permettent de
saturer la base, d'inonder les notifications ou de deviner un mot de passe.

Chaque classe porte son propre quota (attribut ``rate``) au lieu de le lire
dans ``REST_FRAMEWORK`` : un quota qui dépend d'un réglage global peut être
désactivé par erreur (variable d'environnement, détection d'un contexte de
test) et la protection disparaît alors silencieusement en production.

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
    """Dépôt d'un signalement client : 10 par minute et par adresse IP."""

    scope = 'incident_create'
    rate = '10/min'


class NotifyAdminThrottle(IPRateThrottle):
    """Notification envoyée au tableau de bord : 20 par minute."""

    scope = 'notify_admin'
    rate = '20/min'


class AdminLoginThrottle(IPRateThrottle):
    """Tentatives de connexion administrateur : 10 par minute."""

    scope = 'admin_login'
    rate = '10/min'


class TechnicianLoginThrottle(IPRateThrottle):
    """Tentatives de connexion technicien : 10 par minute."""

    scope = 'technician_login'
    rate = '10/min'


class AdminRegisterThrottle(IPRateThrottle):
    """Tentatives de saisie du code d'inscription : 10 par heure."""

    scope = 'admin_register'
    rate = '10/hour'
