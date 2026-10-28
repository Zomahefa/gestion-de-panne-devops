from django.http import HttpResponse, JsonResponse
from django.conf import settings
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


@api_view(['POST'])
def admin_register(request):
    """Crée un compte administrateur (démonstration portfolio).

    Contexte réel : Signaleo est une application d'entreprise. Le compte
    administrateur de référence est créé directement en base par le
    développeur avec la commande ``python manage.py create_admin``.
    Cette vue n'existe que pour permettre au recruteur d'explorer les
    fonctions d'administration ; elle exige un code de validation remis
    sur demande.

    Le code est configurable via ``ADMIN_REGISTRATION_CODE`` (défaut 2005)
    et la vue peut être désactivée avec ``ADMIN_REGISTRATION_ENABLED=0``.
    """
    if not getattr(settings, "ADMIN_REGISTRATION_ENABLED", True):
        return Response(
            {'error': "La création de compte est désactivée."},
            status=status.HTTP_403_FORBIDDEN,
        )

    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''
    validation_code = (request.data.get('validation_code') or '').strip()

    expected_code = getattr(settings, "ADMIN_REGISTRATION_CODE", "2005")
    if validation_code != expected_code:
        return Response(
            {'error': "Code de validation invalide."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not username or not password:
        return Response(
            {'error': "Le nom d'utilisateur et le mot de passe sont obligatoires."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {'error': "Le mot de passe doit contenir au moins 8 caractères."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Admin.objects.filter(username__iexact=username).exists():
        return Response(
            {'error': "Ce nom d'utilisateur est déjà utilisé."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Champs non saisis dans le formulaire de démonstration : valeurs
    # cohérentes générées pour respecter le schéma existant.
    last_id = Admin.objects.order_by('-id').values_list('id', flat=True).first() or 0
    admin = Admin.objects.create(
        username=username,
        full_name=request.data.get('full_name') or username,
        matricule=request.data.get('matricule') or f"ADM-{last_id + 1:04d}",
        role=request.data.get('role') or 'admin',
        contact=request.data.get('contact') or '',
        email=request.data.get('email') or '',
        password=password,
    )

    return Response(
        {'success': 'Compte admin créé avec succès', 'admin_id': admin.id},
        status=status.HTTP_201_CREATED,
    )


@require_GET
def health_check(request):
    return JsonResponse({'status': 'ok'})
