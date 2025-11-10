#!/bin/bash

echo "Attente de la base de données..."
until nc -z db 3306; do
  echo "En attente de la base à db:3306..."
  sleep 2
done

echo "🚀 Migrations Django..."
python manage.py migrate --noinput

echo "Vérification du superadmin..."
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'adminpass123')
EOF

echo "Vérification de l'admin applicatif..."
python manage.py shell <<EOF
from todo.models import Admin
from django.contrib.auth.hashers import make_password
if not Admin.objects.filter(username="adminapp").exists():
    Admin.objects.create(
        full_name="Admin Principal",
        matricule="CH-01",
        role="aadmin&chef jirama",
        contact="0331234567",
        email="mahefa@gmail.com",
        username="mahefa",
        password=make_password("jirama+/2025")
    )
EOF

echo "Initialisation terminée"
exec "$@"
