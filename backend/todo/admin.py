from django.contrib import admin
from .models import Todo
from .models import Admin as AdminModel

@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'status', 'technician_confirmed', 'created_at']
    list_filter = ['technician_confirmed']
    
@admin.register(AdminModel)
class AdminAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'matricule', 'role', 'contact', 'email', 'username']


