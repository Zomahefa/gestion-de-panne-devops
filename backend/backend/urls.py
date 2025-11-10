from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from django.conf import settings
from django.conf.urls.static import static
from todo.views import health_check



urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check),
    path('api/', include('todo.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # ✅ login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # ✅ refresh
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
