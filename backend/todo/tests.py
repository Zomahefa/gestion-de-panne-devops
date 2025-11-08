from django.test import TestCase
from .models import Todo
from .models import Technician
from .models import Admin
from rest_framework.test import APITestCase
from django.urls import reverse
from .serializers import TodoSerializer
from django.test import SimpleTestCase
from django.urls import reverse, resolve
from .views import TodoViewSet 
from django.contrib.admin.sites import site


class TodoModelTest(TestCase):
    def test_str_representation(self):
        todo = Todo(client_name="Zo", status="pending")
        self.assertEqual(str(todo), "Zo - pending")

class TechnicianModelTest(TestCase):
    def test_str_representation(self):
        tech = Technician(username="zo", full_name="Zo DevOps")
        self.assertEqual(str(tech), "Zo DevOps (zo)")

class AdminModelTest(TestCase):
    def test_password_is_hashed(self):
        admin = Admin(
            full_name="Admin Zo",
            matricule="ADM-001",
            contact="0000000000",
            email="admin@example.com",
            username="adminzo",
            password="plaintext123"
        )
        admin.save()
        self.assertTrue(admin.password.startswith("pbkdf2_"))



class TodoAPITest(APITestCase):
    def setUp(self):
        Todo.objects.create(
            client_name="Zo",
            contact="0000000000",
            quartier="Analakely",
            localisation="Antananarivo",
            description="Test panne"
        )

    def test_list_todos(self):
        url = reverse('todo-list')  # adapte selon ton routeur
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)


class TodoSerializerTest(TestCase):
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

class UrlsTest(SimpleTestCase):
    def test_todo_list_url_resolves(self):
        url = reverse('todo-list')  # adapte selon ton routeur
        self.assertIsNotNone(resolve(url))

class AdminTest(TestCase):
    def test_todo_registered_in_admin(self):
        self.assertIn(Todo, site._registry)
