"""Création des notifications métier de Signaleo.

Chaque évènement important produit une notification par destinataire :

- nouveau signalement → tous les administrateurs et tous les techniciens ;
- panne attribuée → le technicien concerné ;
- statut modifié par un technicien → tous les administrateurs.

Les fonctions utilisent ``bulk_create`` : un signalement peut concerner
plusieurs comptes et on évite une requête par destinataire.
"""

from .models import Admin, Notification, Technician


def todo_label(todo):
    """Référence lisible d'un signalement, utilisée dans les messages."""

    return f"PAN-{todo.id:04d}"


def notify_admins(message, kind='info', todo=None):
    """Notifie tous les administrateurs."""

    recipients = list(Admin.objects.all())
    if not recipients:
        return
    Notification.objects.bulk_create(
        [
            Notification(
                admin=admin, message=message, kind=kind, todo=todo
            )
            for admin in recipients
        ]
    )


def notify_technicians(message, kind='info', todo=None):
    """Notifie tous les techniciens (nouveau signalement à traiter)."""

    recipients = list(Technician.objects.all())
    if not recipients:
        return
    Notification.objects.bulk_create(
        [
            Notification(
                technician=technician, message=message, kind=kind, todo=todo
            )
            for technician in recipients
        ]
    )


def notify_technician(technician, message, kind='info', todo=None):
    """Notifie un technicien en particulier."""

    if technician is None:
        return
    Notification.objects.create(
        technician=technician, message=message, kind=kind, todo=todo
    )
