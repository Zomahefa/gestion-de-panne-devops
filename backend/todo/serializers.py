from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password # Ajouté pour Semgrep
from django.core.exceptions import ValidationError # Ajouté pour Semgrep
from .models import Technician, Todo, Admin, Attribution, Notification

class TechnicianSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    username = serializers.CharField(required=False)

    class Meta:
        model = Technician
        fields = ['id', 'username', 'full_name', 'matricule', 'contact', 'password']
        extra_kwargs = {
            'username': {'read_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        username = validated_data.get('username')
        if not username:
            raise serializers.ValidationError({"username": "Ce champ est requis."})
        
        # Correction Semgrep: Valider le mot de passe avant de le définir
        try:
            validate_password(password)
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
            
        technician = Technician(**validated_data)
        technician.set_password(password)
        technician.save()
        return technician

    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if 'full_name' in validated_data:
            new_name = validated_data['full_name']
            instance.username = new_name.lower().replace(' ', '')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            # Correction Semgrep: Valider le mot de passe avant de le définir
            try:
                validate_password(password)
            except ValidationError as e:
                raise serializers.ValidationError({"password": list(e.messages)})
                
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
