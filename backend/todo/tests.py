from django.test import TestCase, SimpleTestCase
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse, resolve
from django.contrib.admin.sites import site
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from .models import Todo, Technician, Admin, Attribution, Notification
from .serializers import TodoSerializer, TechnicianSerializer

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
            password=make_password("plaintext123")  # ✅ hashé manuellement
        )
        admin.save()
        self.assertTrue(admin.password.startswith("pbkdf2_"))

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
        self.admin = Admin.objects.create(
            full_name="Admin Zo",
            matricule="ADM-001",
            contact="0000000000",
            email="admin@example.com",
            username="adminzo",
            password="plaintext123"
        )
        self.admin.save()

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

class TestUrls(SimpleTestCase):
    def test_todo_list_url_resolves(self):
        url = reverse('todo-list')
        self.assertIsNotNone(resolve(url))

class TestAdminRegistry(TestCase):
    def test_todo_registered_in_admin(self):
        self.assertIn(Todo, site._registry)
