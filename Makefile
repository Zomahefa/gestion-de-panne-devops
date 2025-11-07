# Makefile pour gestion de l'application Django + Docker
# === Variables ===
APP_ENV=dev
COMPOSE_DEV=docker compose -f docker-compose.dev.yml --env-file .env -p panne-dev
COMPOSE_STAGING=docker compose -f docker-compose.staging.yml --env-file .env.staging -p panne-staging
COMPOSE_PROD=docker compose -f docker-compose.prod.yml --env-file .env.prod
DB_NAME=jirama_db
DB_USER=django_user
DB_PASSWORD=Django@2025!
CONTAINER_DB_DEV=db
CONTAINER_BACKEND_DEV=django-dev-panne
CONTAINER_FRONTEND_DEV=django-dev-panne
CONTAINER_DB_STAGING=db-staging
CONTAINER_BACKEND_STAGING=backend-staging
CONTAINER_FRONTEND_STAGING=frontend-staging
CONTAINER_DB_PROD=db-prod
CONTAINER_BACKEND_PROD=backend-prod
CONTAINER_FRONTEND_PROD=frontend-prod
# === Développement ===
dev-up:
	$(COMPOSE_DEV) up -d
dev-down:
	$(COMPOSE_DEV) down
dev-down-all:
	$(COMPOSE_DEV) down -v
dev-build:
	$(COMPOSE_DEV) up -d --build
dev-start:
	$(COMPOSE_DEV) start
dev-stop:
	$(COMPOSE_DEV) stop
dev-restart:
	$(COMPOSE_DEV) restart
dev-logs:
	$(COMPOSE_DEV) logs -f
backend-dev-logs:
	docker container logs $(CONTAINER_BACKEND_DEV)
frontend-dev-logs:
	docker container logs $(CONTAINER_FRONTEND_DEV)
db-dev-logs:
	docker container logs $(CONTAINER_DB_DEV)
dev-backend-shell:
	$(COMPOSE_DEV) exec backend python manage.py shell
dev-db-bash:
	docker exec -it $(CONTAINER_DB_DEV) mysql -u$(DB_USER) -p$(DB_PASSWORD) $(DB_NAME)
dev-backend-bash:
	docker exec -it $(CONTAINER_BACKEND_DEV) bash
dev-frontend-bash:
	docker exec -it $(CONTAINER_FRONTEND_DEV) bash
# === Staging ===
staging-db:
	docker exec -it $(CONTAINER_DB_STAGING) mysql -u$(DB_USER) -p$(DB_PASSWORD) $(DB_NAME)
staging-up:
	$(COMPOSE_STAGING) up -d
staging-down:
	$(COMPOSE_STAGING) down
staging-down-all:
	$(COMPOSE_STAGING) down -v
staging-start:
	$(COMPOSE_STAGING) start
staging-stop:
	$(COMPOSE_STAGING) stop
staging-restart:
	$(COMPOSE_STAGING) restart
staging-build:
	$(COMPOSE_STAGING) up -d --build
backend-staging-logs:
	docker container logs $(CONTAINER_BACKEND_STAGING)
frontend-staging-logs:
	docker container logs $(CONTAINER_FRONTEND_STAGING)
db-staging-logs:
	docker container logs $(CONTAINER_DB_STAGING)
staging-logs:
	$(COMPOSE_STAGING) logs -f
staging-db-bash:
	docker exec -it $(CONTAINER_DB_STAGING) mysql -u$(DB_USER) -p$(DB_PASSWORD) $(DB_NAME)
staging-backend-bash:
	docker exec -it $(CONTAINER_BACKEND_STAGING) bash
staging-frontend-bash:
	docker exec -it $(CONTAINER_FRONTEND_STAGING) bash
staging-backend-shell:
	$(COMPOSE_STAGING) exec backend python manage.py shell
# === Production ===
prod-up:
	$(COMPOSE_PROD) up -d
prod-down:
	$(COMPOSE_PROD) down
prod-down-all:
	$(COMPOSE_PROD) down -v
prod-build:
	$(COMPOSE_PROD) up -d --build
prod-start:
	$(COMPOSE_PROD) start
prod-stop:
	$(COMPOSE_PROD) stop
prod-restart:
	$(COMPOSE_PROD) restart
prod-logs:
	$(COMPOSE_PROD) logs -f
prod-db-bash:
	docker exec -it $(CONTAINER_DB_PROD) mysql -u$(DB_USER) -p$(DB_PASSWORD) $(DB_NAME)
prod-backend-bash:
	docker exec -it $(CONTAINER_BACKEND_PROD) bash
prod-frontend-bash:
	docker exec -it $(CONTAINER_FRONTEND_PROD) bash
backend-prod-logs:
	docker container logs $(CONTAINER_BACKEND_PROD)
frontend-prod-logs:
	docker container logs $(CONTAINER_FRONTEND_PROD)
db-prod-logs:
	docker container logs $(CONTAINER_DB_PROD)
prod-backend-shell:
	$(COMPOSE_PROD) exec backend python manage.py shell