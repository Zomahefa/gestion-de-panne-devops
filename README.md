#  Gestion de Panne – Fullstack/DevOps Django + React +mysql avec déploiement

# 
Application web conteneurisée avec CI/CD, DevSecOps, et déploiement automatiséOK OKOKOK

##  Branches Git

| Branche | Rôle |
|--------|------|
| `develop` | Contributions des développeurs |
| `staging` | Tests en conditions réelles |
| `main` | Version de production |

---

##  Technologies

- Django, React
- Docker, Docker Compose
- GitHub Actions
- Oracle Cloud
- Semgrep, Trivy
- Prometheus, Grafana

---

##  Structure du projet
gestion-de-panne/ 
├── backend/ 
├── frontend/ 
    ├── .env
├── .env 
├── docker-compose.yml 
└── README.md

---

## Fichier `.env` à créer

Crée un fichier `.env` à la racine avec comme example :

```env
APP_ENV=dev
DJANGO_ENV=dev
DEBUG=1
DJANGO_SECRET_KEY=SuperSecretKeyForDev
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DB_HOST=db
DB_NAME=exemple_db
DB_USER=django_user
DB_PASSWORD=Django@2025!
MYSQL_ROOT_PASSWORD=rootpass123
DB_PORT=3306
FRONT_PORT=3000
BACK_PORT=8000

et un autre .env dans frontend pour react pour l'url api:
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




## 2. Liste complète des commandes disponibles dans ton Makefile

Voici un tableau clair avec **chaque commande**, son usage, et ce qu’elle fait :

| Commande | Description | Environnement |
|---------|-------------|----------------|
| `make dev-up` | Démarre les services en développement | Dev |
| `make dev-down` | Stoppe et supprime les conteneurs | Dev |
| `make dev-build` | Rebuild les images et démarre | Dev |
| `make dev-start` | Redémarre les conteneurs arrêtés | Dev |
| `make dev-stop` | Stoppe les conteneurs sans les supprimer | Dev |
| `make dev-restart` | Redémarre tous les conteneurs | Dev |
| `make dev-logs` | Affiche tous les logs en continu | Dev |
| `make backend-dev-logs` | Affiche les logs du backend uniquement | Dev |
| `make frontend-dev-logs` | Affiche les logs du frontend uniquement | Dev |
| `make db-dev-logs` | Affiche les logs de la base (⚠️ cible backend par erreur) | Dev |
| `make django-shell` | Ouvre le shell Python Django | Dev |
| `make dev-db-bash` | Ouvre le terminal MySQL dans le conteneur DB | Dev |
| `make dev-backend-bash` | Ouvre le bash du conteneur backend | Dev |
| `make dev-frontend-bash` | Ouvre le bash du conteneur frontend | Dev |
| `make staging-up` | Démarre les services en staging | Staging |
| `make staging-down` | Stoppe et supprime les conteneurs | Staging |
| `make staging-start` | Redémarre les conteneurs arrêtés | Staging |
| `make staging-stop` | Stoppe les conteneurs sans les supprimer | Staging |
| `make staging-restart` | Redémarre tous les conteneurs | Staging |
| `make staging-build` | Rebuild les images et démarre | Staging |
| `make staging-logs` | Affiche tous les logs en continu | Staging |
| `make backend-staging-logs` | Logs du backend staging | Staging |
| `make frontend-staging-logs` | Logs du frontend staging | Staging |
| `make db-staging-logs` | Logs de la base (⚠️ cible backend par erreur) | Staging |
| `make staging-db-bash` | Terminal MySQL dans le conteneur DB | Staging |
| `make staging-backend-bash` | Bash du backend staging | Staging |
| `make staging-frontend-bash` | Bash du frontend staging | Staging |
| `make prod-up` | Démarre les services en production | Prod |
| `make prod-down` | Stoppe et supprime les conteneurs | Prod |
| `make prod-build` | Rebuild les images et démarre | Prod |
| `make prod-logs` | Affiche tous les logs en continu | Prod |
| `make prod-start` | Redémarre les conteneurs arrêtés | Prod |
| `make prod-stop` | Stoppe les conteneurs sans les supprimer | Prod |
| `make prod-restart` | Redémarre tous les conteneurs | Prod |
| `make prod-db-bash` | Terminal MySQL dans le conteneur DB | Prod |
| `make prod-backend-bash` | Bash du backend prod | Prod |
| `make prod-frontend-bash` | Bash du frontend prod | Prod |
| `make backend-prod-logs` | Logs du backend prod | Prod |
| `make frontend-prod-logs` | Logs du frontend prod | Prod |
| `make db-prod-logs` | Logs de la base (⚠️ cible backend par erreur) | Prod |

l'astuce c'est juste= **make + commande dans Makefile par exemple si il y a db-staging-logs:
	docker container logs $(CONTAINER_DB_STAGING) dedans vous regardez juste le tableau d'explication çi_dessus et vous pouvez l'utilisez selon vos bésoin.N'hésitez pas à me demandez si il y a des commandes personnels que vous aimeriez ajoutez dedans pour faciliser la mémoire et rendre le dev encore plus rapide

##  3. Avantages du Makefile 

“Le Makefile permet d’automatiser et de simplifier les commandes Docker Compose pour chaque environnement (développement, staging, production).  
 Il offre une interface cohérente (`make dev-up`, `make prod-logs`, etc.) qui réduit les erreurs humaines, accélère l’onboarding des développeurs, et améliore la maintenabilité du projet.  
 Grâce au Makefile, les développeurs n’ont pas besoin de mémoriser les noms de fichiers Compose, les variables d’environnement ou les noms de conteneurs.  
Cette approche est conforme aux bonnes pratiques DevOps : automatisation, reproductibilité, et documentation claire des workflows.”

---

  4. Guide pour les développeurs

### Installation

1. Cloner le projet
2. Installer Docker et Docker Compose
3. Vérifier que le fichier `Makefile` est présent à la racine

### Démarrer le projet

```bash
make dev-up          # Démarrer l’environnement de développement
make dev-build       # Rebuilder les images
make dev-logs        # Suivre les logs en temps réel
```






---

## Sécurité de l'API

Les rôles sont vérifiés côté serveur et le navigateur ne conserve qu'un jeton
signé.

### Droits d'accès

| Route | Accès |
|-------|-------|
| `GET /api/todos/` | public (suivi des signalements) |
| `POST /api/todos/` | public (dépôt d'un signalement) |
| `POST /api/notify-admin/` | public |
| `POST /api/admin-login/`, `POST /api/token/` | public (connexion) |
| `/api/technicians/`, `/api/attributions/`, `/api/admins/` | administrateur |
| `/api/notifications/` | administrateur ou technicien (chacun ne voit que les siennes) |
| modification d'un signalement | administrateur, ou technicien **attribué** (statut et note uniquement) |
| suppression d'un signalement | administrateur |

Un administrateur reçoit un jeton JWT signé (portée `admin`, 12 h), un
technicien un jeton JWT standard. Une seule classe d'authentification
(`backend/todo/authentication.py`) traite les deux.

### Notifications et affectation

- chaque nouveau signalement crée une notification pour tous les
  administrateurs et tous les techniciens ;
- l'administrateur attribue une panne à un technicien depuis le tableau de
  bord : seul ce technicien peut ensuite faire évoluer son statut ;
- le technicien attribué reçoit une notification à l'attribution, et les
  administrateurs sont prévenus à chaque changement de statut ;
- la cloche (admin et technicien) indique le nombre de notifications non
  lues, avec « Tout lire ».

Les techniciens ne peuvent pas modifier leurs propres informations (mot de
passe, contact, rôle) : ces mises à jour passent par l'interface
administrateur. Le compte de référence (`zomahefa`) est super administrateur :
il liste, crée, modifie et supprime les autres comptes administrateurs
(comptes de test), sans pouvoir retirer son propre statut via l'API.


### Limitation de débit

Les routes publiques et les connexions sont limitées par adresse IP, avec des
compteurs stockés dans un cache fichier partagé par les workers gunicorn :

| Route | Quota |
|-------|-------|
| dépôt d'un signalement | 10 / minute |
| notification administrateur | 20 / minute |
| connexion administrateur | 10 / minute |
| connexion technicien | 10 / minute |
| inscription administrateur | 10 / heure |

Les quotas sont portés par les classes de `backend/todo/throttling.py`. Sur
Render, l'adresse du client est lue dans `CF-Connecting-IP` : `X-Forwarded-For`
contient des sauts internes qui changent à chaque requête et ne peut pas servir
d'identité. `GET /health/` expose le quota appliqué et l'état du cache.

### Comptes administrateur

Le compte de référence est créé en base par `python manage.py create_admin`
(voir `backend/entrypoint.sh`). La page `/admin-register` n'existe que pour la
démonstration : elle exige le code fourni par le développeur via
`ADMIN_REGISTRATION_CODE`. Aucune valeur par défaut n'est présente dans le
dépôt : sans cette variable, la page répond 403.

Ne jamais committer de secret (`.env`, `DATABASE_URL`, `CLOUDINARY_URL`, code
d'inscription).

---

## Déploiement (Render)

| Service | URL |
|---------|-----|
| Frontend (site statique) | https://signaleo.onrender.com |
| API (Docker) | https://gestion-de-panne-devops.onrender.com |

- branche déployée : `deploy/render-online`
- base de données : Neon (PostgreSQL) — images : Cloudinary
- plan gratuit : mise en veille après 15 min d'inactivité, disque éphémère
  (les compteurs de limitation repartent de zéro à chaque déploiement)

---

Auteur
Zo mahefa Ranaivo – DevOps & Fullstack Developer Projet soutenu en octobre 2025

