"""Crée (ou met à jour) le compte administrateur de référence.

Contexte : Signaleo est une application d'entreprise. Il n'y a pas
d'inscription publique : le développeur crée lui-même le compte admin
directement dans la base (Neon en production).

Exemples
--------
Créer le compte de référence (mot de passe demandé de façon interactive) :

    python manage.py create_admin --username admin \
        --email zomahefaranaivo@gmail.com --full-name "Zomahefa Ranaivo"

Créer un compte sans interaction (CI, Render, script) :

    ADMIN_PASSWORD='...' python manage.py create_admin --username admin

Réinitialiser le mot de passe d'un compte existant :

    python manage.py create_admin --username admin --force-password

La commande est idempotente : relancée avec les mêmes paramètres, elle ne
duplique rien. Le mot de passe n'est jamais affiché dans les logs.
"""

import getpass
import os
import secrets

from django.core.management.base import BaseCommand, CommandError

from todo.models import Admin


def _env(name, default=""):
    return os.environ.get(name, default).strip()


class Command(BaseCommand):
    help = "Crée ou met à jour le compte administrateur de référence (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--username", default=_env("ADMIN_USERNAME", "admin"))
        parser.add_argument("--password", default=_env("ADMIN_PASSWORD", ""))
        parser.add_argument("--email", default=_env("ADMIN_EMAIL", ""))
        parser.add_argument("--full-name", default=_env("ADMIN_FULL_NAME", ""))
        parser.add_argument("--matricule", default=_env("ADMIN_MATRICULE", ""))
        parser.add_argument("--contact", default=_env("ADMIN_CONTACT", ""))
        parser.add_argument("--role", default=_env("ADMIN_ROLE", "admin"))
        parser.add_argument(
            "--force-password",
            action="store_true",
            help="Réinitialise le mot de passe même si le compte existe déjà.",
        )
        parser.add_argument(
            "--generate-password",
            action="store_true",
            help="Génère un mot de passe aléatoire et l'affiche une seule fois.",
        )

    def handle(self, *args, **options):
        username = (options["username"] or "").strip()
        if not username:
            raise CommandError("Le nom d'utilisateur est obligatoire (--username).")

        password = options["password"] or ""
        force = options["force_password"]

        if options["generate_password"] and not password:
            password = secrets.token_urlsafe(12)

        existing = Admin.objects.filter(username__iexact=username).first()

        # Un compte existant n'est pas modifié sans demande explicite.
        if existing and not force:
            self.stdout.write(
                self.style.WARNING(
                    f"Le compte '{username}' existe déjà (id={existing.id}). "
                    "Aucune modification. Utilisez --force-password pour "
                    "réinitialiser le mot de passe."
                )
            )
            return

        if not password:
            if not os.isatty(0):
                raise CommandError(
                    "Mot de passe manquant en mode non interactif. "
                    "Définissez ADMIN_PASSWORD ou utilisez --generate-password."
                )
            password = getpass.getpass("Mot de passe du compte admin : ")
            confirm = getpass.getpass("Confirmez le mot de passe : ")
            if password != confirm:
                raise CommandError("Les deux mots de passe ne correspondent pas.")

        if len(password) < 8:
            raise CommandError("Le mot de passe doit contenir au moins 8 caractères.")

        if existing:
            existing.password = password  # hashé par Admin.save()
            # Le compte de référence est le super administrateur : il gère
            # les autres comptes administrateurs (comptes de test).
            existing.is_super_admin = True
            if options["email"]:
                existing.email = options["email"]
            if options["full_name"]:
                existing.full_name = options["full_name"]
            if options["matricule"]:
                existing.matricule = options["matricule"]
            if options["contact"]:
                existing.contact = options["contact"]
            if options["role"]:
                existing.role = options["role"]
            existing.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Compte admin '{existing.username}' mis à jour (id={existing.id})."
                )
            )
            return

        last_id = Admin.objects.order_by("-id").values_list("id", flat=True).first() or 0
        admin = Admin.objects.create(
            username=username,
            full_name=options["full_name"] or username,
            matricule=options["matricule"] or f"ADM-{last_id + 1:04d}",
            role=options["role"] or "admin",
            contact=options["contact"] or "",
            email=options["email"] or "",
            password=password,
            is_super_admin=True,
        )

        self.stdout.write(
            self.style.SUCCESS(f"Compte admin '{admin.username}' créé (id={admin.id}).")
        )
        if options["generate_password"]:
            self.stdout.write(f"  Mot de passe généré : {password}")
            self.stdout.write(
                self.style.WARNING("  Notez-le maintenant : il ne sera plus affiché.")
            )
