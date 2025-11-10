FROM python:3.13-slim AS base

LABEL maintainer="Zo <zomahefaranaivo@gmail.com>" \
      description="Backend Django pour l'application gestion de panne avec React"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=backend.settings \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /back

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl netcat-openbsd && \
    python3 -m venv /opt/venv && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

FROM base

ARG APP_ENV=prod
ENV DJANGO_ENV=${APP_ENV}

WORKDIR /back

RUN addgroup --system zoappgroup && \
    adduser --system --ingroup zoappgroup --no-create-home zoappuser

COPY --chown=zoappuser:zoappgroup . .

RUN if [ "$DJANGO_ENV" = "prod" ]; then \
    python manage.py collectstatic --noinput; \
    fi

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER zoappuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8000/health/ || exit 1

STOPSIGNAL SIGTERM

ENTRYPOINT ["/entrypoint.sh"]

CMD ["sh", "-c", "if [ \"$DJANGO_ENV\" = \"prod\" ]; then \
    gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers=3; \
    else \
    python manage.py runserver 0.0.0.0:8000; fi"]
