from .settings import BASE_DIR, SECRET_KEY, DEBUG, ALLOWED_HOSTS 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'ci_db.sqlite3',
    }
}
