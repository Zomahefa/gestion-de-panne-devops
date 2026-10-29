from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password # Ajouté pour Semgrep
from django.core.exceptions import ValidationError # Ajouté pour Semgrep
from .models import Technician, Todo, Admin, Attribution, Notification

class TechnicianSerializer(serializers.ModelSerializer):
    """Sérialise les comptes techniciens.

    ``username`` est l'identifiant de connexion : il doit être explicite et
    ne jamais être recalculé depuis ``full_name`` lors d'une modification,
    sinon le technicien ne peut plus se connecter après une simple édition.
    """

    password = serializers.CharField(
        write_only=True, required=False, allow_blank=False
    )
    username = serializers.CharField(required=False)

    class Meta:
        model = Technician
        fields = ['id', 'username', 'full_name', 'matricule', 'contact', 'password']

    def validate_username(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError("Ce champ est requis.")
        duplicates = Technician.objects.filter(username__iexact=value)
        if self.instance is not None:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError(
                "Ce nom d'utilisateur est déjà utilisé."
            )
        return value

    def validate_matricule(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError("Ce champ est requis.")
        duplicates = Technician.objects.filter(matricule__iexact=value)
        if self.instance is not None:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError("Ce matricule est déjà utilisé.")
        return value

    def _validate_password(self, password):
        try:
            validate_password(password)
        except ValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError(
                {"password": "Ce champ est requis."}
            )
        self._validate_password(password)

        technician = Technician(**validated_data)
        technician.set_password(password)
        technician.save()
        return technician

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            self._validate_password(password)
            instance.set_password(password)

        instance.save()
        return instance

class TodoSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    technician_confirmed = TechnicianSerializer(read_only=True)

    class Meta:
        model = Todo
        fields = '__all__'

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = ['id', 'username', 'full_name', 'matricule', 'role', 'contact', 'email']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class AttributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribution
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
