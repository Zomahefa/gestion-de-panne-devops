from django.http import HttpResponse, JsonResponse
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.views.decorators.http import require_GET # Déplacé ici pour E402
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password

from .authentication import AdminPrincipal, build_admin_token
from .models import Technician, Todo, Admin, Attribution, Notification
from .permissions import IsAdminAccount, IsAdminOrTechnician
from .serializers import (
    TechnicianSerializer,
    TodoSerializer,
    AdminSerializer,
    AttributionSerializer,
    NotificationSerializer,
 )

# Champs qu'un technicien peut modifier sur un signalement. Un compte
# technicien ne doit pas pouvoir réécrire le nom du client, la photo ou la
# localisation d'une intervention.
TECHNICIAN_EDITABLE_TODO_FIELDS = {'status', 'technician_note'}


def home(request):
    return HttpResponse("Bienvenue sur le backend Django du gestion de panne🚀")


class TechnicianViewSet(viewsets.ModelViewSet):
    """Gestion des comptes techniciens : réservée aux administrateurs."""

    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer
    permission_classes = [IsAdminAccount]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )

        if not serializer.is_valid():
            print("❌ Erreurs de validation :", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)


class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer

    def get_permissions(self):
        """Le public signale et suit une panne ; la gestion est protégée.

        - ``list`` / ``retrieve`` / ``create`` : ouverts (formulaire client
          et page de suivi) ;
        - ``update`` / ``partial_update`` / ``destroy`` : admin ou technicien.
        """
        if self.action in ('list', 'retrieve', 'create'):
            return [AllowAny()]
        return [IsAdminOrTechnician()]

    def create(self, request, *args, **kwargs):
        print("📥 Données reçues :", request.data)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user = request.user
        if not isinstance(user, AdminPrincipal):
            unauthorized = set(request.data) - TECHNICIAN_EDITABLE_TODO_FIELDS
            if unauthorized:
                return Response(
                    {
                        'detail': (
                            "Un technicien ne peut modifier que le statut "
                            "et sa note d'intervention."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().update(request, *args, **kwargs)


class AdminViewSet(viewsets.ModelViewSet):
    """Gestion des administrateurs.

    Un administrateur ne consulte et ne modifie que son propre compte : le
    profil est le seul écran qui utilise ces routes. La liste reste
    accessible pour retrouver son identifiant après une ancienne session.
    """

    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminAccount]

    def _is_self(self, admin):
        return admin.pk == self.request.user.admin.pk

    def retrieve(self, request, *args, **kwargs):
        admin = self.get_object()
        if not self._is_self(admin):
            return Response(
                {'detail': "Vous ne pouvez consulter que votre propre profil."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().retrieve(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        admin = self.get_object()
        if not self._is_self(admin):
            return Response(
                {'detail': "Vous ne pouvez supprimer que votre propre compte."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Met à jour un administrateur.

        Deux règles importantes :
        - un mot de passe vide (champ laissé vide dans le profil) ne doit
          jamais écraser le mot de passe existant ;
        - le nom d'utilisateur et le matricule restent uniques, avec un
          message d'erreur explicite au lieu d'une erreur serveur.
        """
        admin = self.get_object()

        if not self._is_self(admin):
            return Response(
                {'detail': "Vous ne pouvez modifier que votre propre profil."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data
        errors = {}

        username = data.get('username')
        if username is not None:
            username = str(username).strip()
            if not username:
                errors['username'] = "Le nom d'utilisateur est obligatoire."
            elif (
                Admin.objects.filter(username__iexact=username)
                .exclude(pk=admin.pk)
                .exists()
            ):
                errors['username'] = "Ce nom d'utilisateur est déjà utilisé."
            else:
                admin.username = username

        matricule = data.get('matricule')
        if matricule is not None:
            matricule = str(matricule).strip()
            if not matricule:
                errors['matricule'] = "Le matricule est obligatoire."
            elif (
                Admin.objects.filter(matricule__iexact=matricule)
                .exclude(pk=admin.pk)
                .exists()
            ):
                errors['matricule'] = "Ce matricule est déjà utilisé."
            else:
                admin.matricule = matricule

        for field in ['full_name', 'role', 'contact', 'email']:
            if field in data:
                setattr(admin, field, data[field])

        password = data.get('password')
        if password:
            if len(password) < 8:
                errors['password'] = (
                    "Le mot de passe doit contenir au moins 8 caractères."
                )
            else:
                admin.password = make_password(password)

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        admin.save()
        serializer = self.get_serializer(admin)
        return Response(serializer.data)

class AttributionViewSet(viewsets.ModelViewSet):
    """Attribution d'une panne à un technicien (administrateurs seulement)."""

    queryset = Attribution.objects.all()
    serializer_class = AttributionSerializer
    permission_classes = [IsAdminAccount]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # L'auteur de l'attribution vient du jeton, jamais du corps de la
        # requête : un client ne peut pas se faire passer pour un autre admin.
        attribution = serializer.save(assigned_by=request.user.admin)

        # 🔁 Mise à jour du champ technician_confirmed dans Todo
        todo = attribution.panne
        todo.technician_confirmed = attribution.technician
        todo.save(update_fields=['technician_confirmed'])

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminAccount]

    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.delete()
        return Response({'status': 'Notification supprimée'})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminAccount])
def admin_profile(request):
    """Profil de l'administrateur connecté (identifié par son jeton)."""
    admin = request.user.admin

    if request.method == 'GET':
        serializer = AdminSerializer(admin)
        return Response(serializer.data)

    serializer = AdminSerializer(admin, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'Profil mis à jour'})
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    try:
        admin = Admin.objects.get(username=username)
        if check_password(password, admin.password):
            # Le frontend a besoin de l'identifiant réel du compte connecté
            # pour afficher « Mon profil ». Le jeton est un vrai JWT signé,
            # porté par l'en-tête Authorization des requêtes d'administration.
            return Response({
                'token': build_admin_token(admin),
                'admin': {
                    'id': admin.id,
                    'username': admin.username,
                    'full_name': admin.full_name,
                    'email': admin.email,
                    'role': admin.role,
                    'matricule': admin.matricule,
                    'contact': admin.contact,
                },
            })
        else:
            return Response({'error': 'Mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
    except Admin.DoesNotExist:
        # Même réponse qu'un mot de passe erroné : on n'indique pas si le
        # compte existe (énumération de comptes).
        return Response(
            {'error': 'Identifiants incorrects'},
            status=status.HTTP_401_UNAUTHORIZED,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def notify_admin(request):
    message = request.data.get('message')
    Notification.objects.create(message=message)
    return Response({'status': 'Notification enregistrée'})


@api_view(['POST'])
@permission_classes([AllowAny])
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
