"""Crée des données de démonstration idempotentes pour le portfolio."""

import os
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from todo.models import Admin, Notification, Todo


class Command(BaseCommand):
    help = "Crée les comptes et les pannes de démonstration (idempotent)."

    def handle(self, *args, **options):
        Technician = get_user_model()

        admin_username = os.environ.get("DEMO_ADMIN_USERNAME", "demo.admin")
        admin_password = os.environ.get("DEMO_ADMIN_PASSWORD", "DemoAdmin!2026")
        tech_username = os.environ.get("DEMO_TECH_USERNAME", "demo.tech")
        tech_password = os.environ.get("DEMO_TECH_PASSWORD", "DemoTech!2026")
        super_username = os.environ.get("DEMO_SUPERUSER_USERNAME", "demo.super")
        super_password = os.environ.get("DEMO_SUPERUSER_PASSWORD", "DemoSuper!2026")

        _admin, admin_created = Admin.objects.get_or_create(
            username=admin_username,
            defaults={
                "full_name": "Admin Démo",
                "matricule": "DEMO-ADMIN-01",
                "role": "Administrateur",
                "contact": "0340000001",
                "email": "demo.admin@example.com",
                "password": admin_password,
            },
        )

        technician, tech_created = Technician.objects.get_or_create(
            username=tech_username,
            defaults={
                "full_name": "Technicien Démo",
                "matricule": "DEMO-TECH-01",
                "contact": "0340000002",
                "role": "technician",
            },
        )
        if tech_created:
            technician.set_password(tech_password)
            technician.save()

        superuser, super_created = Technician.objects.get_or_create(
            username=super_username,
            defaults={
                "full_name": "Super Admin Démo",
                "matricule": "DEMO-SUPER-01",
                "contact": "0340000003",
                "role": "superadmin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if super_created:
            superuser.set_password(super_password)
            superuser.save()

        if not Todo.objects.exists():
            samples = [
                {
                    "client_name": "Rakoto Jean",
                    "contact": "0341122334",
                    "quartier": "Analakely",
                    "lot": "Lot 12",
                    "localisation": "-18.9137, 47.5361",
                    "description": "Coupure d'électricité depuis ce matin dans tout le pâté de maisons.",
                    "status": "pending",
                },
                {
                    "client_name": "Rasoa Marie",
                    "contact": "0334455667",
                    "quartier": "Ankadifotsy",
                    "lot": "Lot 08",
                    "localisation": "-18.9007, 47.5265",
                    "description": "Compteur qui disjoncte dès que le chauffe-eau est allumé.",
                    "status": "on_the_way",
                },
                {
                    "client_name": "Andry Patrick",
                    "contact": "0327788990",
                    "quartier": "Ambohipo",
                    "lot": "Lot 45",
                    "localisation": "-18.9345, 47.5180",
                    "description": "Câble électrique tombé au sol après le vent de cette nuit.",
                    "status": "in_progress",
                },
                {
                    "client_name": "Hery Nirina",
                    "contact": "0349988776",
                    "quartier": "Mahamasina",
                    "lot": "Lot 21",
                    "localisation": "-18.9210, 47.5280",
                    "description": "Panne générale signalée par plusieurs voisins.",
                    "status": "resolved",
                },
                {
                    "client_name": "Soa Fanja",
                    "contact": "0335566778",
                    "quartier": "Itaosy",
                    "lot": "Lot 07",
                    "localisation": "-18.9160, 47.4720",
                    "description": "Baisse de tension répétée en fin de journée.",
                    "status": "pending",
                },
                {
                    "client_name": "Mamy Rakoto",
                    "contact": "0321122334",
                    "quartier": "Ivandry",
                    "lot": "Lot 33",
                    "localisation": "-18.8735, 47.5280",
                    "description": "Transformateur qui fait un bruit anormal.",
                    "status": "resolved",
                },
            ]

            for index, sample in enumerate(samples):
                todo = Todo.objects.create(**sample)
                if index < 3:
                    todo.technician_confirmed = technician
                    todo.save(update_fields=["technician_confirmed"])
                Todo.objects.filter(pk=todo.pk).update(
                    created_at=timezone.now() - timedelta(days=index)
                )

        if not Notification.objects.exists():
            Notification.objects.create(
                message="Bienvenue sur la démo Gestion de Panne. Les données sont fictives."
            )

        self.stdout.write(self.style.SUCCESS("Données de démonstration prêtes."))
        if admin_created:
            self.stdout.write(f"  Admin      : {admin_username} / {admin_password}")
        if tech_created:
            self.stdout.write(f"  Technicien : {tech_username} / {tech_password}")
        if super_created:
            self.stdout.write(f"  Superuser  : {super_username} / {super_password}")
