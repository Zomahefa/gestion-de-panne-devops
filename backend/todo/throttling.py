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

from ipaddress import ip_address

from rest_framework.throttling import SimpleRateThrottle

# En-têtes remplis par le proxy de bord (Cloudflare devant Render). Le client
# ne peut pas les falsifier, contrairement à X-Forwarded-For que le navigateur
# peut compléter et auquel le proxy ajoute ses propres sauts internes.
CLIENT_IP_HEADERS = (
    'HTTP_CF_CONNECTING_IP',
    'HTTP_TRUE_CLIENT_IP',
    'HTTP_X_REAL_IP',
)


def is_private_address(address):
    """Vrai si l'adresse appartient à un réseau interne (proxy, conteneur)."""

    try:
        return ip_address(address).is_private
    except ValueError:
        return False


def client_ip(request):
    """Adresse IP du client, y compris derrière le proxy de Render.

    Sur Render, ``REMOTE_ADDR`` est l'adresse interne du proxy et
    ``X-Forwarded-For`` ressemble à
    ``203.0.113.7, 197.234.242.36, 10.195.91.120`` : les deux derniers sauts
    changent d'une requête à l'autre. Compter par ``REMOTE_ADDR`` ou par la
    chaîne entière donnerait donc une clé différente à chaque requête, et la
    limitation ne se déclencherait jamais. On retient l'adresse du client
    fournie par le proxy de bord ; hors proxy, l'adresse de la connexion.
    """

    remote_addr = (request.META.get('REMOTE_ADDR') or '').strip()
    if remote_addr and not is_private_address(remote_addr):
        return remote_addr

    for header in CLIENT_IP_HEADERS:
        value = (request.META.get(header) or '').strip()
        if value:
            return value

    forwarded_for = (request.META.get('HTTP_X_FORWARDED_FOR') or '').split(',')
    first_hop = forwarded_for[0].strip()
    return first_hop or remote_addr or 'inconnu'


class IPRateThrottle(SimpleRateThrottle):
    """Limite par adresse IP, y compris pour un utilisateur authentifié.

    ``AnonRateThrottle`` de DRF ne compte que les requêtes anonymes : un
    compte connecté contournerait la limite. Ici l'identité est toujours
    l'adresse IP, ce qui protège aussi les routes de connexion.
    """

    def get_ident(self, request):
        return client_ip(request)

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
