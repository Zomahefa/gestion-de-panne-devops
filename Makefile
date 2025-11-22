# Makefile pour gestion de l'application Django + Docker
# === Variables ===
COMPOSE_DEV=docker compose -f docker-compose.dev.yml --env-file .env -p panne-dev
COMPOSE_BLUE=docker compose -f docker-compose.blue.yml --env-file .env.global -p panne-blue
COMPOSE_GREEN=docker compose -f docker-compose.green.yml --env-file .env.global -p panne-green
COMPOSE_DB=docker compose -f docker-compose.db.yml --env-file .env.global
COMPOSE_MONITORING=docker compose -f docker-compose.monitoring.yml
EDGE=docker compose -f docker-compose.edge.yml
DB_NAME=jirama_db
DB_USER=django_user
DB_PASSWORD=Django@2025!
CONTAINER_DB_DEV=db
CONTAINER_BACKEND_DEV=django-dev-panne
CONTAINER_FRONTEND_DEV=django-dev-panne
CONTAINER_BACKEND_BLUE=backendBlue
CONTAINER_FRONTEND_BLUE=frontendBlue
CONTAINER_DB=db-global
CONTAINER_BACKEND_GREEN=backendGreen
CONTAINER_FRONTEND_GREEN=frontendGreen
CONTAINER_PROMETHEUS=prometheus-monitoring
CONTAINER_GRAFANA=grafana-monitoring
CONTAINER_LOKI=loki-monitoring
CONTAINER_PROMTAIL=promtail-monitoring
CONTAINER_MYSQLEXPORTER=mysql-exporter-monitoring
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
# ===DB===
db-up:
	$(COMPOSE_DB) up -d
db-down:
	$(COMPOSE_DB) down
db-down-all:
	$(COMPOSE_DB) down -v
db-start:
	$(COMPOSE_DB) start
db-stop:
	$(COMPOSE_DB) stop
db-restart:
	$(COMPOSE_DB) restart
db-bash:
	docker exec -it $(CONTAINER_DB) mysql -u$(DB_USER) -p$(DB_PASSWORD) $(DB_NAME)
db-logs:
	docker container logs $(CONTAINER_DB)
# ===green===
green-up:
	$(COMPOSE_GREEN) up -d
green-down:
	$(COMPOSE_GREEN) down
green-down-all:
	$(COMPOSE_GREEN) down -v
green-start:
	$(COMPOSE_GREEN) start
green-stop:
	$(COMPOSE_GREEN) stop
green-restart:
	$(COMPOSE_GREEN) restart
green-build:
	$(COMPOSE_GREEN) up -d --build
green-backend-logs:
	docker container logs $(CONTAINER_BACKEND_GREEN)
green-frontend-logs:
	docker container logs $(CONTAINER_FRONTEND_GREEN)
green-logs:
	$(COMPOSE_GREEN) logs -f
green-backend-bash:
	docker exec -it $(CONTAINER_BACKEND_GREEN) bash
green-frontend-bash:
	docker exec -it $(CONTAINER_FRONTEND_GREEN) bash
green-backend-shell:
	$(COMPOSE_GREEN) exec backend python manage.py shell
# === blue ===
blue-up:
	$(COMPOSE_BLUE) up -d
blue-down:
	$(COMPOSE_BLUE) down
blue-down-all:
	$(COMPOSE_BLUE) down -v
blue-start:
	$(COMPOSE_BLUE) start
blue-stop:
	$(COMPOSE_BLUE) stop
blue-restart:
	$(COMPOSE_BLUE) restart
blue-backend-logs:
	docker container logs $(CONTAINER_BACKEND_BLUE)
blue-frontend-logs:
	docker container logs $(CONTAINER_FRONTEND_BLUE)
blue-logs:
	$(COMPOSE_BLUE) logs -f
blue-backend-bash:
	docker exec -it $(CONTAINER_BACKEND_BLUE) bash
blue-frontend-bash:
	docker exec -it $(CONTAINER_FRONTEND_BLUE) bash
blue-backend-shell:
	$(COMPOSE_BLUE) exec backend python manage.py shell

#node exporter
#node-exporter:
#nohup ./node_exporter &
#node-exporter-kill:
#pkill -f node_exporter

# ===edge proxy===
reload-edge:
	docker exec edge nginx -s reload
edge-up:
	$(EDGE) up -d
edge-down:
	$(EDGE) down
edge-bash:
	docker exec -it edge sh
edge-restart:
	$(EDGE) restart

# ===monitoring===
monitoring-up:
	$(COMPOSE_MONITORING) up -d
monitoring-down:
	$(COMPOSE_MONITORING) down
monitoring-down-all:
	$(COMPOSE_MONITORING) down -v
monitoring-start:
	$(COMPOSE_MONITORING) start
monitoring-stop:
	$(COMPOSE_MONITORING) stop
monitoring-restart:
	$(COMPOSE_MONITORING) restart
prometheus-bash:
	docker exec -it $(CONTAINER_PROMETHEUS) bash
grafana-bash:
	docker exec -it $(CONTAINER_GRAFANA) bash
loki-bash:
	docker exec -it $(CONTAINER_LOKI) bash
promtail-bash:
	docker exec -it $(CONTAINER_PROMTAIL_BLUE) bash
mysql-exporter-bash:
	docker exec -it $(CONTAINER_MYSQLEXPORTER_BLUE) bash