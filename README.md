# 🔧 JIRAMA Incident Tracker

Une application web complète pour signaler, suivre et résoudre les pannes techniques liées aux infrastructures JIRAMA. Ce projet a été développé dans le cadre d’un stage technique, avec un focus sur la robustesse, la sécurité, et l’expérience utilisateur.

---

## 🧠 Fonctionnalités principales

- ✅ Signalement de panne par les clients avec image optionnelle
- 🔐 Authentification JWT pour les techniciens
- 📋 Tableau de bord technicien avec mise à jour du statut
- 🛠️ Interface administrateur avec suppression, tri et affichage des images
- 📷 Upload et affichage d’image de panne
- 📊 Suivi en temps réel des incidents
- 🔎 Filtrage par statut
- 🧪 Intégration DevSecOps (Semgrep, Trivy)
- 📈 Monitoring (Prometheus, Grafana)

---

## 🚀 Installation et lancement

### 1. Cloner le projet
```bash
git clone https://github.com/Zomahefa/gestion-de-panne-Ambohimahasoa.git
cd gestion-de-panne-Ambohimahasoa

📦 Dépendances installées
asgiref
cffi
cryptography
Django
django-cors-headers
djangorestframework
djangorestframework-simplejwt
pillow
PyJWT
PyMySQL
sqlparse
🛠️ Installation
cd backend
python3 -m venv env
source env/bin/activate  # ou env\Scripts\activate sur Windows
pip install -r requirements.txt
🗄️ Configuration MySQL
Créez une base nommée jirama_db et configurez settings.py :
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'jirama_db',
        'USER': 'root',
        'PASSWORD': 'votre_mot_de_passe',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
📂 Fichiers médias
Dans settings.py :
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
Et dans urls.py :
from django.conf import settings
from django.conf.urls.static import static
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
🔧 Migration et lancement
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

💻 Frontend React
📦 Dépendances installées
axios
react-router-dom
sweetalert2
bootstrap
Installe-les avec :
cd frontend
npm install axios react-router-dom sweetalert2 bootstrap
🚀 Lancement
npm start
🖼️ Fonctionnement des images
Les images sont envoyées via FormData depuis React

Stockées dans media/incident_images/

Affichées dans tous les dashboards via l’URL complète renvoyée par l’API
🧪 CI/CD (à venir)
Le projet est conçu pour être intégré dans un pipeline CI/CD avec :

✅ Tests unitaires Django

✅ Linting avec Semgrep

✅ Scan de vulnérabilités avec Trivy

✅ Déploiement Docker (à venir)

📬 Auteur
Développé avec passion par Zo mahefa, stagiaire Dev Fullstack à Jirama Madagascar 🇲🇬(2025) Ce projet est le fruit d’un apprentissage rigoureux, d’une volonté de transparence et d’une obsession pour la robustesse.

📦 Pour les développeurs
Ce projet est conçu pour être reproductible à 100%. Toutes les erreurs rencontrées ont été documentées et corrigées pour que vous puissiez :

Installer sans conflit

Lancer sans crash

Comprendre chaque choix technique

Étendre l’app sans casser l’existant

🛡️ Licence
Ce projet est open-source sous licence MIT.

