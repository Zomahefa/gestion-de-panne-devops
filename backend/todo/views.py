import os

from django.core.cache import cache
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.views.decorators.http import require_GET # Déplacé ici pour E402
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password

from .authentication import AdminPrincipal, build_admin_token
from .models import Technician, Todo, Admin, Attribution, Notification
from .notifications import (
    notify_admins,
    notify_technician,
    notify_technicians,
    todo_label,
)
from .permissions import IsAdminAccount, IsAdminOrTechnician
from .serializers import (
    TechnicianSerializer,
    TodoSerializer,
    AdminSerializer,
    AttributionSerializer,
    NotificationSerializer,
 )
from .throttling import (
    AdminLoginThrottle,
    AdminRegisterThrottle,
    IncidentCreateThrottle,
    NotifyAdminThrottle,
    TechnicianLoginThrottle,
)

# Champs qu'un technicien peut modifier sur un signalement. Un compte
# technicien ne doit pas pouvoir réécrire le nom du client, la photo ou la
# localisation d'une intervention.
TECHNICIAN_EDITABLE_TODO_FIELDS = {'status', 'technician_note'}


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Connexion technicien, limitée pour freiner le bourrage d'identifiants."""

    throttle_classes = [TechnicianLoginThrottle]


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
    queryset = Todo.objects.all().order_by('-created_at')
    serializer_class = TodoSerializer

    def get_permissions(self):
        """Le public signale et suit une panne ; la gestion est protégée.

        - ``list`` / ``retrieve`` / ``create`` : ouverts (formulaire client
          et page de suivi) ;
        - ``update`` / ``partial_update`` : admin, ou technicien **attribué** ;
        - ``destroy`` : administrateur uniquement.
        """
        if self.action in ('list', 'retrieve', 'create'):
            return [AllowAny()]
        if self.action == 'destroy':
            return [IsAdminAccount()]
        return [IsAdminOrTechnician()]

    def get_throttles(self):
        # Seul le dépôt public est limité : la lecture du suivi doit rester
        # fluide (rafraîchissement automatique toutes les 5 s).
        if self.action == 'create':
            return [IncidentCreateThrottle()]
        return super().get_throttles()

    def perform_create(self, serializer):
        """Enregistre le signalement puis prévient l'exploitation.

        Les administrateurs et les techniciens reçoivent une notification :
        c'est ce qui alimente la cloche de leur espace respectif.
        """
        todo = serializer.save()
        message = (
            f"Nouveau signalement {todo_label(todo)} : "
            f"{todo.client_name} ({todo.quartier})."
        )
        notify_admins(message, kind='incident_created', todo=todo)
        notify_technicians(message, kind='incident_created', todo=todo)

    def update(self, request, *args, **kwargs):
        user = request.user

        if isinstance(user, AdminPrincipal):
            return super().update(request, *args, **kwargs)

        # Un technicien ne peut agir que sur une panne qui lui est attribuée.
        todo = self.get_object()
        if todo.technician_confirmed_id != user.id:
            return Response(
                {
                    'detail': (
                        "Cette panne ne vous est pas attribuée : seul le "
                        "technicien affecté peut changer son statut."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

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

        previous_status = todo.status
        response = super().update(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            todo.refresh_from_db()
            if todo.status != previous_status:
                notify_admins(
                    f"{getattr(user, 'full_name', '') or user.username} a passé la "
                    f"panne {todo_label(todo)} ({todo.client_name}) au "
                    f"statut « {todo.get_status_display()} ».",
                    kind='status_update',
                    todo=todo,
                )

        return response


class AdminViewSet(viewsets.ModelViewSet):
    """Gestion des comptes administrateurs.

    - un administrateur consulte et modifie uniquement son compte ;
    - le super administrateur (compte de référence) voit tous les comptes,
      en crée pour un test, les modifie et les supprime.

    Le statut de super administrateur n'est jamais modifiable par l'API :
    il est attribué en base (``create_admin``) pour éviter toute escalade
    de privilèges depuis l'interface.
    """

    serializer_class = AdminSerializer
    permission_classes = [IsAdminAccount]
    queryset = Admin.objects.all()

    def get_queryset(self):
        queryset = Admin.objects.all().order_by('username')
        # La liste sert aussi au profil pour retrouver son identifiant :
        # un administrateur ordinaire n'y voit que son propre compte.
        if self.action == 'list' and not self._is_super_admin():
            return queryset.filter(pk=self.request.user.admin.pk)
        return queryset

    def _is_super_admin(self):
        return bool(getattr(self.request.user.admin, 'is_super_admin', False))

    def _is_self(self, admin):
        return admin.pk == self.request.user.admin.pk

    def _forbidden(self, message):
        return Response(
            {'detail': message}, status=status.HTTP_403_FORBIDDEN
        )

    def retrieve(self, request, *args, **kwargs):
        admin = self.get_object()
        if not self._is_self(admin) and not self._is_super_admin():
            return self._forbidden(
                "Vous ne pouvez consulter que votre propre profil."
            )
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not self._is_super_admin():
            return self._forbidden(
                "Seul le super administrateur peut créer un compte."
            )

        data = request.data
        errors = {}

        username = (data.get('username') or '').strip()
        password = data.get('password') or ''
        matricule = (data.get('matricule') or '').strip()

        if not username:
            errors['username'] = "Le nom d'utilisateur est obligatoire."
        elif Admin.objects.filter(username__iexact=username).exists():
            errors['username'] = "Ce nom d'utilisateur est déjà utilisé."

        if len(password) < 8:
            errors['password'] = (
                "Le mot de passe doit contenir au moins 8 caractères."
            )

        if not matricule:
            last_id = (
                Admin.objects.order_by('-id')
                .values_list('id', flat=True)
                .first()
                or 0
            )
            matricule = f"ADM-{last_id + 1:04d}"
        elif Admin.objects.filter(matricule__iexact=matricule).exists():
            errors['matricule'] = "Ce matricule est déjà utilisé."

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        admin = Admin.objects.create(
            username=username,
            full_name=(data.get('full_name') or username).strip(),
            matricule=matricule,
            role=data.get('role') or 'admin',
            contact=data.get('contact') or '',
            email=data.get('email') or '',
            password=password,
            is_super_admin=False,
        )
        serializer = self.get_serializer(admin)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        admin = self.get_object()

        if not self._is_self(admin) and not self._is_super_admin():
            return self._forbidden(
                "Vous ne pouvez supprimer que votre propre compte."
            )

        if (
            admin.is_super_admin
            and Admin.objects.filter(is_super_admin=True).count() <= 1
        ):
            return self._forbidden(
                "Le dernier super administrateur ne peut pas être supprimé."
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

        if not self._is_self(admin) and not self._is_super_admin():
            return self._forbidden(
                "Vous ne pouvez modifier que votre propre profil."
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
        previous_technician_id = todo.technician_confirmed_id
        todo.technician_confirmed = attribution.technician
        todo.save(update_fields=['technician_confirmed'])

        # Le technicien concerné est prévenu (une seule fois si la panne
        # était déjà attribuée à la même personne).
        if previous_technician_id != attribution.technician_id:
            notify_technician(
                attribution.technician,
                f"{request.user.admin.full_name or request.user.username} "
                f"vous a attribué la panne {todo_label(todo)} : "
                f"{todo.client_name} ({todo.quartier}).",
                kind='assigned',
                todo=todo,
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NotificationViewSet(viewsets.ModelViewSet):
    """Notifications de l'utilisateur connecté (admin ou technicien).

    Chacun ne voit que ses propres notifications : le filtrage est fait ici,
    pas dans le frontend. Les notifications publiques sans destinataire
    (créées par ``notify_admin``) restent visibles par les administrateurs.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAdminOrTechnician]
    queryset = Notification.objects.all()

    def get_queryset(self):
        user = self.request.user
        if isinstance(user, AdminPrincipal):
            return Notification.objects.filter(
                Q(admin=user.admin)
                | Q(admin__isnull=True, technician__isnull=True)
            ).order_by('-created_at')
        return Notification.objects.filter(technician=user).order_by(
            '-created_at'
        )

    def perform_create(self, serializer):
        # Une notification créée par l'API appartient toujours à son auteur.
        user = self.request.user
        if isinstance(user, AdminPrincipal):
            serializer.save(admin=user.admin)
        else:
            serializer.save(technician=user)

    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.delete()
        return Response({'status': 'Notification supprimée'})

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])
        return Response({'status': 'Notification lue'})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True
        )
        return Response({'updated': updated})


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
@throttle_classes([AdminLoginThrottle])
def admin_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    invalid_credentials = Response(
        {'error': 'Identifiants incorrects'},
        status=status.HTTP_401_UNAUTHORIZED,
    )

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
                    'is_super_admin': admin.is_super_admin,
                },
            })
        # Même réponse que pour un compte inexistant : on n'indique jamais
        # si un nom d'utilisateur existe (énumération de comptes).
        return invalid_credentials
    except Admin.DoesNotExist:
        return invalid_credentials


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([NotifyAdminThrottle])
def notify_admin(request):
    message = request.data.get('message')
    Notification.objects.create(message=message)
    return Response({'status': 'Notification enregistrée'})


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AdminRegisterThrottle])
def admin_register(request):
    """Crée un compte administrateur (démonstration portfolio).

    Contexte réel : Signaleo est une application d'entreprise. Le compte
    administrateur de référence est créé directement en base par le
    développeur avec la commande ``python manage.py create_admin``.
    Cette vue n'existe que pour permettre au recruteur d'explorer les
    fonctions d'administration ; elle exige un code de validation remis
    sur demande.

    Le code est fourni par ``ADMIN_REGISTRATION_CODE``. Il n'existe volontairement
    aucune valeur par défaut : sans variable d'environnement, la page reste
    fermée, car un code écrit dans le dépôt serait public. La vue peut aussi
    être fermée avec ``ADMIN_REGISTRATION_ENABLED=0``.
    """
    expected_code = getattr(settings, "ADMIN_REGISTRATION_CODE", "").strip()
    enabled = getattr(settings, "ADMIN_REGISTRATION_ENABLED", True)

    if not enabled or not expected_code:
        return Response(
            {'error': "L'inscription administrateur est désactivée."},
            status=status.HTTP_403_FORBIDDEN,
        )

    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''
    validation_code = (request.data.get('validation_code') or '').strip()

    expected_code = getattr(settings, "ADMIN_REGISTRATION_CODE", "").strip()
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
    """État du service, utilisé par Render et pour vérifier un déploiement.

    Expose le quota réellement appliqué et l'état du cache partagé : sans
    cache fonctionnel, les compteurs de limitation ne seraient plus partagés
    entre les workers et la protection deviendrait inopérante.
    """
    cache.set('health-probe', 'ok', 5)

    return JsonResponse({
        'status': 'ok',
        'commit': os.environ.get('RENDER_GIT_COMMIT', 'local')[:7],
        'throttle': IncidentCreateThrottle().rate,
        'cache_ok': cache.get('health-probe') == 'ok',
    })
