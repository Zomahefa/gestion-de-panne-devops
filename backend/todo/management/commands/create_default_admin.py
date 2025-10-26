from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                password='admin123',
                full_name='Admin',
                matricule='ADM-001',
                contact='0000000000'
            )
            print("✅ Superuser 'admin' créé")
        else:
            print("✅ Superuser déjà existant")
