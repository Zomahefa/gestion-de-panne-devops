#!/bin/bash
set -e

echo "Application des migrations Django..."
for i in $(seq 1 30); do
  if python manage.py migrate --noinput; then
    echo "Migrations appliquées."
    break
  fi

  if [ "$i" -eq 30 ]; then
    echo "Base de données inaccessible après 30 tentatives."
    exit 1
  fi

  echo "Nouvelle tentative dans 2s ($i/30)..."
  sleep 2
done

if [ "${SEED_DEMO:-0}" = "1" ]; then
  echo "Création / vérification des données de démonstration..."
  python manage.py seed_demo
fi

# Compte administrateur de référence : créé une seule fois, puis conservé
# en base. Activer BOOTSTRAP_ADMIN=1 sur Render pour la première mise en
# ligne (avec ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_EMAIL), puis retirer
# la variable. ADMIN_RESET_PASSWORD=1 force la réinitialisation du mot de
# passe lors d'un déploiement ultérieur.
if [ "${BOOTSTRAP_ADMIN:-0}" = "1" ]; then
  echo "Vérification du compte administrateur de référence..."
  if [ "${ADMIN_RESET_PASSWORD:-0}" = "1" ]; then
    python manage.py create_admin --force-password
  else
    python manage.py create_admin
  fi
fi

echo "Initialisation terminée."
exec "$@"
