from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.views.decorators.http import require_GET # Déplacé ici pour E402
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password

from .models import Technician, Todo, Admin, Attribution, Notification
from .serializers import (
    TechnicianSerializer,
    TodoSerializer,
    AdminSerializer,
    AttributionSerializer,
    NotificationSerializer,
 )


def home(request):
    return HttpResponse("Bienvenue sur le backend Django du gestion de panne🚀")


class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=False)

        if not serializer.is_valid():
            print("❌ Erreurs de validation :", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)


class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        print("📥 Données reçues :", request.data)
        return super().create(request, *args, **kwargs)


class AdminViewSet(viewsets.ModelViewSet):
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer

    def update(self, request, *args, **kwargs):
        admin = self.get_object()
        data = request.data

        for field in ['username', 'full_name', 'matricule', 'role', 'contact', 'email']:
            if field in data:
                setattr(admin, field, data[field])

        # Hash le mot de passe si présent
        if 'password' in data:
            admin.password = make_password(data['password'])

        admin.save()
        serializer = self.get_serializer(admin)
        return Response(serializer.data)

class AttributionViewSet(viewsets.ModelViewSet):
    queryset = Attribution.objects.all()
    serializer_class = AttributionSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        # 🔁 Mise à jour du champ technician_confirmed dans Todo
        attribution_id = response.data.get('id')
        attribution = Attribution.objects.get(id=attribution_id)
        todo = attribution.panne
        todo.technician_confirmed = attribution.technician
        todo.save()

        return response


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer

    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.delete()
        return Response({'status': 'Notification supprimée'})


@api_view(['GET', 'PATCH'])
def admin_profile(request):
    try:
        admin = Admin.objects.get(username=request.data.get('username'))
    except Admin.DoesNotExist:
        return Response({'error': 'Admin introuvable'}, status=404)

    if request.method == 'GET':
        serializer = AdminSerializer(admin)
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = AdminSerializer(admin, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'Profil mis à jour'})
        return Response(serializer.errors, status=400)


@api_view(['POST'])
def admin_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    try:
        admin = Admin.objects.get(username=username)
        if check_password(password, admin.password):
            return Response({'token': 'admin-token-123'})  # à remplacer par JWT plus tard
        else:
            return Response({'error': 'Mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
    except Admin.DoesNotExist:
        return Response({'error': 'Admin introuvable'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def notify_admin(request):
    message = request.data.get('message')
    Notification.objects.create(message=message)
    return Response({'status': 'Notification enregistrée'})


@require_GET
def health_check(request):
    return JsonResponse({'status': 'ok'})
