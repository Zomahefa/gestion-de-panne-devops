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

echo "Initialisation terminée."
exec "$@"
