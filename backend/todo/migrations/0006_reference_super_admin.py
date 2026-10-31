"""Désigne le compte administrateur de référence comme super administrateur.

Le super administrateur peut créer, modifier et supprimer les autres comptes
administrateurs (comptes de test accordés quelques minutes). Sur une base
existante, c'est ``zomahefa`` ; sur une base neuve, le premier compte créé.
"""

from django.db import migrations

REFERENCE_USERNAME = "zomahefa"


def set_reference_super_admin(apps, schema_editor):
    Admin = apps.get_model("todo", "Admin")

    updated = Admin.objects.filter(
        username__iexact=REFERENCE_USERNAME
    ).update(is_super_admin=True)
    if updated:
        return

    if not Admin.objects.filter(is_super_admin=True).exists():
        first = Admin.objects.order_by("id").first()
        if first is not None:
            first.is_super_admin = True
            first.save(update_fields=["is_super_admin"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        (
            "todo",
            "0005_alter_notification_options_admin_is_super_admin_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(set_reference_super_admin, noop),
    ]
