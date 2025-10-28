# 🚀 Gestion de Panne – DevOps Django + React +mys

# 🎯 Objectif
Application web conteneurisée avec CI/CD, DevSecOps, et déploiement automatisé.

## 🗂️ Branches Git

| Branche | Rôle |
|--------|------|
| `develop` | Contributions des développeurs |
| `staging` | Tests en conditions réelles |
| `main` | Version de production |

---

## 🛠️ Technologies

- Django, React
- Docker, Docker Compose
- GitHub Actions
- Oracle Cloud
- Semgrep, Trivy
- Prometheus, Grafana

---

## 📁 Structure du projet
gestion-de-panne/ 
├── backend/ 
├── frontend/ 
    ├── .env
├── .env 
├── docker-compose.yml 
└── README.md

---

## 🔐 Fichier `.env` à créer

Crée un fichier `.env` à la racine avec :

```env
APP_ENV=dev
DJANGO_ENV=dev
DEBUG=1
DJANGO_SECRET_KEY=SuperSecretKeyForDev
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DB_HOST=db
DB_NAME=jirama_db
DB_USER=django_user
DB_PASSWORD=Django@2025!
MYSQL_ROOT_PASSWORD=rootpass123
DB_PORT=3306
FRONT_PORT=3000
BACK_PORT=8000

et un autre .env dans fonrtend pour react pour l'url api:
REACT_APP_API_URL=l'url de l'api backend

🐳 Commandes Docker Compose utiles
Action	                                Commande
Lancer les conteneurs	                docker compose up --build -d
Arrêter les conteneurs	                docker compose down
Redémarrer un service	                docker compose restart backend
Voir les logs	                        docker compose logs -f
Rebuild complet	                        docker compose build
Supprimer volumes	                    docker compose down -v
Exécuter une commande dans un conteneur	docker compose exec backend bash

guide après le démarrage de compose:
Donnez les droit aux dossier media pour l'utilisateur dans le conteneur
	sudo chown -R 100:101 backend/media
	sudo chmod -R 755 backend/media
Accéder au bash du conteneur
	docker exec -it django-dev-panne bash
Créer un superuser pour créer l'admin dans db
	python manage.py createsuperuser
	va sur http://localhost:8000/admin et créer un admin

🧼 Fichiers à ignorer dans .gitignore
gitignore
# 🔐 Fichiers sensibles
.env
*.env

# 🗂️ Fichiers système
.DS_Store
*.swp

# 🧪 Fichiers de test ou de debug
*.log
*.sqlite3

# 📁 Dossiers à ignorer
/media/
venv/
👉 Justification :

.env : contient des secrets

media/ : fichiers uploadés, générés dynamiquement

venv/ : environnement Python local

.DS_Store, *.swp : fichiers système inutiles

👤 Auteur
Zo mahefa Ranaivo – DevOps & Fullstack Developer Projet soutenu en octobre 2025
# Test CI
