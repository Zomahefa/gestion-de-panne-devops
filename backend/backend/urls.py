from django.contrib import admin
from django.urls import path, include
from django_prometheus.exports import ExportToDjangoView
from rest_framework_simplejwt.views import TokenRefreshView

from django.conf import settings
from django.conf.urls.static import static
from todo.views import ThrottledTokenObtainPairView, health_check

urlpatterns = [
    path('api/admin/', admin.site.urls),
    path('health/', health_check),
    path('api/', include('todo.urls')),
    path('api/token/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),  # ✅ login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # ✅ refresh
    path('metrics/', ExportToDjangoView),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
