"""Permissions métier de Signaleo.

Trois profils d'accès :

- **public** : dépôt d'un signalement et consultation du suivi ;
- **technicien** : mise à jour du statut d'une intervention ;
- **administrateur** : gestion des comptes, des techniciens, des
  attributions et des notifications.
"""

from rest_framework.permissions import BasePermission

from .authentication import AdminPrincipal
from .models import Technician


def is_admin(user):
    return isinstance(user, AdminPrincipal)


def is_technician(user):
    # ``Technician`` hérite d'AbstractUser : on exclut le principal admin,
    # qui n'est pas une instance de ce modèle, mais on reste explicite.
    return isinstance(user, Technician) and not isinstance(user, AdminPrincipal)


class IsAdminAccount(BasePermission):
    """Réservé aux administrateurs authentifiés."""

    message = "Authentification administrateur requise."

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsAdminOrTechnician(BasePermission):
    """Réservé aux comptes authentifiés (admin ou technicien)."""

    message = "Authentification requise."

    def has_permission(self, request, view):
        user = request.user
        return bool(getattr(user, "is_authenticated", False)) and (
            is_admin(user) or is_technician(user)
        )
