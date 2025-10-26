from django.urls import path, include
from rest_framework import routers
from .views import TodoViewSet, TechnicianViewSet, AdminViewSet, AttributionViewSet, NotificationViewSet
from .views import admin_login
from .views import notify_admin



router = routers.DefaultRouter()
router.register(r'todos', TodoViewSet)
router.register(r'technicians', TechnicianViewSet)
router = routers.DefaultRouter()
router.register(r'todos', TodoViewSet)
router.register(r'technicians', TechnicianViewSet)
router.register(r'admins', AdminViewSet)
router.register(r'attributions', AttributionViewSet)
router.register('notifications', NotificationViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('admin-login/', admin_login),
    path('notify-admin/', notify_admin),
]





