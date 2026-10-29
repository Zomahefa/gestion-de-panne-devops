from django.test import RequestFactory, TestCase, SimpleTestCase, override_settings
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse, resolve
from django.contrib.admin.sites import site
from django.contrib.auth.hashers import check_password
from contextlib import ExitStack
from django.core.cache import cache
from unittest.mock import patch
from .authentication import build_admin_token
from .models import Todo, Technician, Admin, Attribution, Notification
from .serializers import TodoSerializer, TechnicianSerializer
from .throttling import (
    AdminLoginThrottle,
    AdminRegisterThrottle,
    IncidentCreateThrottle,
    NotifyAdminThrottle,
    TechnicianLoginThrottle,
    client_ip,
)

TEST_REGISTRATION_CODE = "code-de-test-2026"

# Quotas réellement appliqués, par scope. Chaque classe porte son quota :
# aucun réglage global ne peut les désactiver par inadvertance.
THROTTLES = {
    'incident_create': IncidentCreateThrottle,
    'notify_admin': NotifyAdminThrottle,
    'admin_login': AdminLoginThrottle,
    'technician_login': TechnicianLoginThrottle,
    'admin_register': AdminRegisterThrottle,
}

# La suite envoie beaucoup de requêtes depuis la même adresse IP : les quotas
# de production (10 par minute) seraient atteints et feraient échouer des
# tests sans rapport. On les élève ici ; TestThrottling les abaisse le temps
# d'un test pour vérifier qu'ils s'appliquent bien.
for _throttle in THROTTLES.values():
    _throttle.rate = '10000/min'



def authenticate_admin(client, admin):
    """Ajoute l'en-tête Authorization d'un administrateur au client de test."""
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {build_admin_token(admin)}")
    return client

class TestTodoModel(TestCase):
    def test_str_representation(self):
        todo = Todo(client_name="Zo", status="pending")
        self.assertEqual(str(todo), "Zo - pending")

class TestTechnicianModel(TestCase):
    def test_str_representation(self):
        tech = Technician(username="zo", full_name="Zo DevOps")
        self.assertEqual(str(tech), "Zo DevOps (zo)")

class TestAdminModel(TestCase):
    def test_password_is_hashed(self):
        admin = Admin(
            full_name="Admin Zo",
            matricule="ADM-001",
            contact="0000000000",
            email="admin@example.com",
            username="adminzo",
            password="plaintext123"  # en clair
        )
        admin.save()
        self.assertTrue(check_password("plaintext123", admin.password))  # ✅ robuste et fiable


        

class TestAttributionModel(TestCase):
    def test_str_representation(self):
        tech = Technician.objects.create(username="zo", full_name="Zo DevOps", matricule="TECH-001")
        todo = Todo.objects.create(client_name="Zo", contact="0000000000", quartier="Analakely", localisation="Antananarivo", description="Test panne")
        admin = Admin.objects.create(full_name="Admin Zo", matricule="ADM-001", contact="0000000000", email="admin@example.com", username="adminzo", password="plaintext123")
        attribution = Attribution.objects.create(panne=todo, technician=tech, assigned_by=admin)
        self.assertIn("→", str(attribution))

class TestNotificationModel(TestCase):
    def test_str_representation(self):
        notif = Notification.objects.create(message="Test notification")
        self.assertIn("Test notification", notif.message)


# ✅ SERIALIZERS

class TestTodoSerializer(TestCase):
    def test_valid_data(self):
        data = {
            "client_name": "Zo",
            "contact": "0000000000",
            "quartier": "Isoraka",
            "localisation": "Antananarivo",
            "description": "Test panne"
        }
        serializer = TodoSerializer(data=data)
        self.assertTrue(serializer.is_valid())

class TestTechnicianSerializer(TestCase):
    def test_create_valid_technician(self):
        data = {
            "username": "zo",
            "full_name": "Zo DevOps",
            "matricule": "TECH-001",
            "contact": "0000000000",
            "password": "StrongPass123!"
        }
        serializer = TechnicianSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        tech = serializer.save()
        self.assertTrue(tech.check_password("StrongPass123!"))


# ✅ API VIEWS

class TestTodoAPI(APITestCase):
    def setUp(self):
        Todo.objects.create(
            client_name="Zo",
            contact="0000000000",
            quartier="Analakely",
            localisation="Antananarivo",
            description="Test panne"
        )

    def test_list_todos(self):
        url = reverse('todo-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

class TestAdminLoginAPI(APITestCase):
    def setUp(self):
        self.admin = Admin(
            full_name="Admin Zo",
            matricule="ADM-001",
            contact="0000000000",
            email="admin@example.com",
            username="adminzo",
            password="plaintext123"
        )
        self.admin.save()  # ✅ déclenche le hash dans ta méthode save()


    def test_login_success(self):
        url = reverse('admin-login')
        response = self.client.post(url, {"username": "adminzo", "password": "plaintext123"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)

    def test_login_failure(self):
        url = reverse('admin-login')
        response = self.client.post(url, {"username": "adminzo", "password": "wrongpass"})
        self.assertEqual(response.status_code, 401)

class TestNotifyAdminAPI(APITestCase):
    def test_notify_admin(self):
        url = reverse('notify-admin')
        response = self.client.post(url, {"message": "Test message"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Notification.objects.count(), 1)


@override_settings(ADMIN_REGISTRATION_CODE=TEST_REGISTRATION_CODE)
class TestAdminRegisterAPI(APITestCase):
    def test_register_with_valid_code(self):
        url = reverse('admin-register')
        response = self.client.post(
            url,
            {
                "username": "nouvel.admin",
                "password": "MotDePasse!2026",
                "validation_code": TEST_REGISTRATION_CODE,
            },
        )
        self.assertEqual(response.status_code, 201)
        admin = Admin.objects.get(username="nouvel.admin")
        self.assertTrue(check_password("MotDePasse!2026", admin.password))
        self.assertTrue(admin.matricule.startswith("ADM-"))

    def test_register_with_invalid_code(self):
        url = reverse('admin-register')
        response = self.client.post(
            url,
            {
                "username": "intrus",
                "password": "MotDePasse!2026",
                "validation_code": "0000",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Admin.objects.filter(username="intrus").exists())

    def test_register_rejects_duplicate_username(self):
        Admin.objects.create(
            full_name="Admin Zo",
            matricule="ADM-001",
            contact="0000000000",
            email="admin@example.com",
            username="adminzo",
            password="plaintext123",
        )
        url = reverse('admin-register')
        response = self.client.post(
            url,
            {
                "username": "adminzo",
                "password": "MotDePasse!2026",
                "validation_code": TEST_REGISTRATION_CODE,
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Admin.objects.filter(username="adminzo").count(), 1)

    def test_register_rejects_short_password(self):
        url = reverse('admin-register')
        response = self.client.post(
            url,
            {
                "username": "court",
                "password": "abc",
                "validation_code": TEST_REGISTRATION_CODE,
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Admin.objects.filter(username="court").exists())

    @override_settings(ADMIN_REGISTRATION_CODE="")
    def test_registration_closed_when_no_code_configured(self):
        """Sans ADMIN_REGISTRATION_CODE, la page est fermée (pas de code par défaut)."""
        response = self.client.post(
            reverse('admin-register'),
            {
                "username": "sans.code",
                "password": "MotDePasse!2026",
                "validation_code": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Admin.objects.filter(username="sans.code").exists())


class TestAdminProfileAPI(APITestCase):
    """Le profil doit porter sur le compte connecté et préserver le mot de passe."""

    def setUp(self):
        self.admin = Admin.objects.create(
            full_name="Zomahefa Ranaivo",
            matricule="ADM-0002",
            contact="",
            email="zomahefa@example.com",
            username="zomahefa",
            password="MotDePasse!2026",
        )
        authenticate_admin(self.client, self.admin)

    def test_login_returns_admin_identity(self):
        response = self.client.post(
            reverse('admin-login'),
            {"username": "zomahefa", "password": "MotDePasse!2026"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['admin']['id'], self.admin.id)
        self.assertEqual(response.data['admin']['username'], "zomahefa")

    def test_empty_password_does_not_overwrite_existing_one(self):
        response = self.client.put(
            f"/api/admins/{self.admin.id}/",
            {
                "username": "zomahefa",
                "full_name": "Zomahefa R.",
                "matricule": "ADM-0002",
                "role": "admin",
                "contact": "0340000000",
                "email": "zomahefa@example.com",
                "password": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.admin.refresh_from_db()
        self.assertTrue(check_password("MotDePasse!2026", self.admin.password))
        self.assertEqual(self.admin.full_name, "Zomahefa R.")

    def test_password_change_is_hashed(self):
        response = self.client.put(
            f"/api/admins/{self.admin.id}/",
            {"password": "NouveauPass!2026"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.admin.refresh_from_db()
        self.assertTrue(check_password("NouveauPass!2026", self.admin.password))
        self.assertFalse(check_password("MotDePasse!2026", self.admin.password))

    def test_duplicate_username_is_rejected(self):
        Admin.objects.create(
            full_name="Autre Admin",
            matricule="ADM-0003",
            contact="",
            email="autre@example.com",
            username="autre",
            password="MotDePasse!2026",
        )
        response = self.client.put(
            f"/api/admins/{self.admin.id}/",
            {"username": "autre"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data)


class TestTechnicianAPI(APITestCase):
    def setUp(self):
        self.admin = Admin.objects.create(
            full_name="Admin Zo",
            matricule="ADM-900",
            contact="",
            email="admin@example.com",
            username="adminzo",
            password="AdminPass!2026",
        )
        authenticate_admin(self.client, self.admin)
        self.payload = {
            "username": "rakotojean",
            "full_name": "Rakoto Jean",
            "matricule": "TECH-014",
            "contact": "0340000000",
            "password": "Technicien!2026",
        }

    def test_create_and_login(self):
        response = self.client.post("/api/technicians/", self.payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["username"], "rakotojean")

        login = self.client.post(
            reverse('token_obtain_pair'),
            {
                "username": "rakotojean",
                "password": "Technicien!2026",
            },
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertIn("access", login.data)

    def test_edit_full_name_keeps_username(self):
        response = self.client.post("/api/technicians/", self.payload, format="json")
        technician_id = response.data["id"]

        update = self.client.patch(
            f"/api/technicians/{technician_id}/",
            {"full_name": "Rakoto Jean Claude"},
            format="json",
        )
        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.data["username"], "rakotojean")

        login = self.client.post(
            reverse('token_obtain_pair'),
            {
                "username": "rakotojean",
                "password": "Technicien!2026",
            },
            format="json",
        )
        self.assertEqual(login.status_code, 200)

    def test_duplicate_username_is_rejected(self):
        self.client.post("/api/technicians/", self.payload, format="json")
        duplicate = dict(self.payload, matricule="TECH-015")
        response = self.client.post("/api/technicians/", duplicate, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data)

class TestAPISecurity(APITestCase):
    """Vérifie que les endpoints sensibles exigent un jeton valide."""

    def setUp(self):
        self.admin = Admin.objects.create(
            full_name="Admin Sécurité",
            matricule="ADM-100",
            contact="",
            email="admin@example.com",
            username="securite",
            password="Securite!2026",
        )
        self.other_admin = Admin.objects.create(
            full_name="Autre Admin",
            matricule="ADM-101",
            contact="",
            email="autre@example.com",
            username="autre.admin",
            password="Securite!2026",
        )
        self.technician = Technician.objects.create_user(
            username="tech.securite",
            password="TechPass!2026",
            full_name="Tech Sécurité",
            matricule="TECH-100",
        )
        self.todo = Todo.objects.create(
            client_name="Client",
            contact="0340000000",
            quartier="Analakely",
            localisation="Antananarivo",
            description="Panne de test",
        )

    def _technician_token(self):
        response = self.client.post(
            reverse('token_obtain_pair'),
            {"username": "tech.securite", "password": "TechPass!2026"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        return response.data['access']

    def test_todo_list_and_create_are_public(self):
        self.assertEqual(self.client.get('/api/todos/').status_code, 200)

        created = self.client.post(
            '/api/todos/',
            {
                "client_name": "Nouveau Client",
                "contact": "0341111111",
                "quartier": "Isoraka",
                "localisation": "Antananarivo",
                "description": "Coupure de courant",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201)

    def test_todo_delete_requires_authentication(self):
        response = self.client.delete(f'/api/todos/{self.todo.id}/')
        self.assertEqual(response.status_code, 401)
        self.assertTrue(Todo.objects.filter(id=self.todo.id).exists())

    def test_technician_can_update_status(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {self._technician_token()}")

        response = client.patch(
            f'/api/todos/{self.todo.id}/',
            {"status": "on_the_way"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.status, "on_the_way")

    def test_technician_cannot_rewrite_client_data(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {self._technician_token()}")

        response = client.patch(
            f'/api/todos/{self.todo.id}/',
            {"client_name": "Usurpation"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.client_name, "Client")

    def test_technician_endpoints_are_admin_only(self):
        unauthenticated = self.client.get('/api/technicians/')
        self.assertEqual(unauthenticated.status_code, 401)

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {self._technician_token()}")
        forbidden = client.get('/api/technicians/')
        self.assertEqual(forbidden.status_code, 403)

        admin_client = APIClient()
        authenticate_admin(admin_client, self.admin)
        allowed = admin_client.get('/api/technicians/')
        self.assertEqual(allowed.status_code, 200)

    def test_admin_login_token_grants_access(self):
        login = self.client.post(
            reverse('admin-login'),
            {"username": "securite", "password": "Securite!2026"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        token = login.data['token']
        self.assertNotEqual(token, 'admin-token-123')

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        profile = client.get(f'/api/admins/{self.admin.id}/')
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data['username'], "securite")

        notifications = client.get('/api/notifications/')
        self.assertEqual(notifications.status_code, 200)

    def test_admin_cannot_edit_another_admin(self):
        client = APIClient()
        authenticate_admin(client, self.admin)

        response = client.put(
            f'/api/admins/{self.other_admin.id}/',
            {"full_name": "Piraté"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.other_admin.refresh_from_db()
        self.assertNotEqual(self.other_admin.full_name, "Piraté")

        # La lecture d'un autre profil est également refusée.
        self.assertEqual(
            client.get(f'/api/admins/{self.other_admin.id}/').status_code, 403
        )

    def test_login_does_not_reveal_account_existence(self):
        wrong_password = self.client.post(
            reverse('admin-login'),
            {"username": "securite", "password": "mauvais-mot-de-passe"},
            format="json",
        )
        unknown_account = self.client.post(
            reverse('admin-login'),
            {"username": "compte.inexistant", "password": "mauvais-mot-de-passe"},
            format="json",
        )

        self.assertEqual(wrong_password.status_code, 401)
        self.assertEqual(unknown_account.status_code, 401)
        self.assertEqual(wrong_password.data, unknown_account.data)

    def test_notifications_require_admin(self):
        self.assertEqual(self.client.get('/api/notifications/').status_code, 401)

    def test_attribution_records_authenticated_admin(self):
        client = APIClient()
        authenticate_admin(client, self.admin)

        response = client.post(
            '/api/attributions/',
            {
                "panne": self.todo.id,
                "technician": self.technician.id,
                # Valeur volontairement fausse : elle doit être ignorée.
                "assigned_by": self.other_admin.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        attribution = Attribution.objects.get(id=response.data['id'])
        self.assertEqual(attribution.assigned_by_id, self.admin.id)

        self.todo.refresh_from_db()
        self.assertEqual(self.todo.technician_confirmed_id, self.technician.id)

    def test_invalid_token_is_rejected(self):
        response = self.client.get(
            '/api/technicians/',
            HTTP_AUTHORIZATION="Bearer jeton.invalide.xxx",
        )
        self.assertEqual(response.status_code, 401)


class TestClientIP(SimpleTestCase):
    """Adresse utilisée comme identité par la limitation de débit."""

    def _request(self, **meta):
        request = RequestFactory().post('/api/todos/')
        request.META.update(meta)
        return request

    def test_public_remote_addr_is_used_directly(self):
        # Sans proxy, l'adresse de la connexion prime : un X-Forwarded-For
        # fabriqué par le client ne permet pas de changer d'identité.
        request = self._request(
            REMOTE_ADDR='153.67.85.132',
            HTTP_X_FORWARDED_FOR='1.2.3.4, 10.0.0.1',
            HTTP_CF_CONNECTING_IP='5.6.7.8',
        )
        self.assertEqual(client_ip(request), '153.67.85.132')

    def test_cloudflare_header_is_used_behind_proxy(self):
        # Chaîne observée sur Render : les sauts internes changent d'une
        # requête à l'autre, seule l'adresse du client est stable.
        request = self._request(
            REMOTE_ADDR='10.195.91.120',
            HTTP_X_FORWARDED_FOR=(
                '153.67.85.132, 197.234.242.36, 10.195.91.120'
            ),
            HTTP_CF_CONNECTING_IP='153.67.85.132',
        )
        self.assertEqual(client_ip(request), '153.67.85.132')

    def test_forwarded_for_fallback_without_edge_header(self):
        request = self._request(
            REMOTE_ADDR='10.195.91.120',
            HTTP_X_FORWARDED_FOR=(
                '153.67.85.132, 197.234.242.36, 10.195.91.120'
            ),
        )
        self.assertEqual(client_ip(request), '153.67.85.132')

    def test_local_connection(self):
        request = self._request(REMOTE_ADDR='127.0.0.1')
        self.assertEqual(client_ip(request), '127.0.0.1')


class TestThrottling(APITestCase):
    """Quotas par adresse IP sur les routes publiques et les connexions."""

    def setUp(self):
        # Les compteurs vivent dans le cache : on repart d'un état propre.
        cache.clear()
        self.admin = Admin.objects.create(
            full_name="Admin Quota",
            matricule="ADM-200",
            contact="",
            email="quota@example.com",
            username="quota.admin",
            password="QuotaPass!2026",
        )
        self.technician = Technician.objects.create_user(
            username="quota.tech",
            password="QuotaTech!2026",
            full_name="Tech Quota",
            matricule="TECH-200",
        )
        self.todo_payload = {
            "client_name": "Client Quota",
            "contact": "0340000000",
            "quartier": "Analakely",
            "localisation": "Antananarivo",
            "description": "Signalement de test",
        }

    def _rates(self, **rates):
        """Abaisse les quotas le temps d'un test.

        Les quotas sont des attributs de classe (voir todo/throttling.py) :
        on les remplace directement pour rendre le test déterministe.
        """
        stack = ExitStack()
        for scope, value in rates.items():
            stack.enter_context(patch.object(THROTTLES[scope], 'rate', value))
        return stack

    def test_incident_create_is_throttled(self):
        with self._rates(incident_create='1/min'):
            first = self.client.post(
                '/api/todos/', self.todo_payload, format='json'
            )
            second = self.client.post(
                '/api/todos/', self.todo_payload, format='json'
            )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(Todo.objects.count(), 1)

    def test_counter_is_per_forwarded_client(self):
        """Deux clients derrière le même proxy ne partagent pas le quota."""
        with self._rates(incident_create='1/min'):
            first = self.client.post(
                '/api/todos/', self.todo_payload, format='json',
                HTTP_CF_CONNECTING_IP='198.51.100.1',
            )
            blocked = self.client.post(
                '/api/todos/', self.todo_payload, format='json',
                HTTP_CF_CONNECTING_IP='198.51.100.1',
            )
            other_client = self.client.post(
                '/api/todos/', self.todo_payload, format='json',
                HTTP_CF_CONNECTING_IP='198.51.100.2',
            )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(other_client.status_code, 201)
        self.assertEqual(Todo.objects.count(), 2)

    def test_notify_admin_is_throttled(self):
        with self._rates(notify_admin='1/min'):
            first = self.client.post(
                reverse('notify-admin'), {"message": "Test"}, format='json'
            )
            second = self.client.post(
                reverse('notify-admin'), {"message": "Test"}, format='json'
            )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(Notification.objects.count(), 1)

    def test_admin_login_is_throttled(self):
        with self._rates(admin_login='1/min'):
            first = self.client.post(
                reverse('admin-login'),
                {"username": "quota.admin", "password": "mauvais"},
                format='json',
            )
            second = self.client.post(
                reverse('admin-login'),
                {"username": "quota.admin", "password": "mauvais"},
                format='json',
            )

        self.assertEqual(first.status_code, 401)
        self.assertEqual(second.status_code, 429)

    def test_technician_login_is_throttled(self):
        with self._rates(technician_login='1/min'):
            first = self.client.post(
                reverse('token_obtain_pair'),
                {"username": "quota.tech", "password": "QuotaTech!2026"},
                format='json',
            )
            second = self.client.post(
                reverse('token_obtain_pair'),
                {"username": "quota.tech", "password": "QuotaTech!2026"},
                format='json',
            )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)

    @override_settings(ADMIN_REGISTRATION_CODE=TEST_REGISTRATION_CODE)
    def test_admin_register_is_throttled(self):
        payload = {
            "username": "quota.inscrit",
            "password": "MotDePasse!2026",
            "validation_code": TEST_REGISTRATION_CODE,
        }
        with self._rates(admin_register='1/hour'):
            first = self.client.post(
                reverse('admin-register'), payload, format='json'
            )
            second = self.client.post(
                reverse('admin-register'), payload, format='json'
            )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(Admin.objects.filter(username="quota.inscrit").count(), 1)


class TestUrls(SimpleTestCase):
    def test_todo_list_url_resolves(self):
        url = reverse('todo-list')
        self.assertIsNotNone(resolve(url))

class TestAdminRegistry(TestCase):
    def test_todo_registered_in_admin(self):
        self.assertIn(Todo, site._registry)
