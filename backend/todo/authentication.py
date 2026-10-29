"""Authentification des requêtes Signaleo.

Deux types de comptes coexistent :

- les **techniciens**, qui sont des utilisateurs Django (``AUTH_USER_MODEL``)
  et s'authentifient avec le JWT standard de ``simplejwt`` ;
- les **administrateurs**, qui sont un modèle simple (``todo.Admin``) sans
  compte Django.

Ce module fournit un authentificateur unique qui accepte les deux, afin que
les endpoints puissent exiger « un admin » ou « un admin ou un technicien »
sans casser les parcours existants.
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .models import Admin

ADMIN_SCOPE = "admin"


class AdminPrincipal:
    """Adapte un ``Admin`` à l'interface utilisateur attendue par DRF.

    ``todo.Admin`` n'hérite pas de ``AbstractBaseUser`` : on expose donc
    explicitement les attributs que DRF et les permissions consultent.
    """

    is_authenticated = True
    is_anonymous = False
    is_active = True
    is_staff = False

    def __init__(self, admin):
        self.admin = admin
        self.pk = admin.pk
        self.id = admin.id
        self.username = admin.username

    def __str__(self):
        return self.username


def build_admin_token(admin):
    """Construit le jeton d'accès d'un administrateur.

    Le jeton porte ``scope="admin"`` et l'identifiant du compte : il ne peut
    donc pas être confondu avec un jeton technicien, qui contient ``user_id``.
    """
    token = AccessToken()
    token["scope"] = ADMIN_SCOPE
    token["admin_id"] = admin.id
    token["username"] = admin.username
    return str(token)


class SignaleoJWTAuthentication(BaseAuthentication):
    """Authentifie un technicien (JWT standard) ou un admin (JWT scopé)."""

    def authenticate_header(self, request):
        # Permet à DRF de répondre 401 (et non 403) quand aucun jeton
        # exploitable n'est fourni.
        return 'Bearer realm="signaleo"'

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        parts = header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            # Pas d'en-tête (ou en-tête inexploitable) : requête anonyme.
            # Les endpoints publics restent accessibles.
            return None

        raw_token = parts[1]

        # On valide d'abord la signature et l'expiration une seule fois.
        try:
            validated = AccessToken(raw_token)
        except TokenError:
            return None

        if validated.get("scope") == ADMIN_SCOPE:
            admin_id = validated.get("admin_id")
            admin = Admin.objects.filter(pk=admin_id).first() if admin_id else None
            if admin is None:
                return None
            return (AdminPrincipal(admin), validated)

        # Jeton technicien : on laisse ``simplejwt`` faire la résolution de
        # l'utilisateur (``user_id``), qui peut échouer si le compte a été
        # supprimé entre-temps.
        try:
            return JWTAuthentication().authenticate(request)
        except AuthenticationFailed:
            return None
