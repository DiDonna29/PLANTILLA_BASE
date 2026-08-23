"""URLs de la API v1 — Plantilla Base (Boilerplate)."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from api.views.auth_views import (
    LoginView, LogoutView, MiPerfilView, ProfileView,
    PasswordResetVerifyView, PasswordResetConfirmView, ChangePasswordView
)
from api.views.usuarios_views import (
    GestionUsuariosView, UsuarioDetailView, ToggleEstadoUsuarioView,
    RolesDisponiblesView, VerificarCedulaView, SigefirrhHProxyView
)
from api.views.bienestar_views import BienestarBeneficiarioView
from api.views.auditoria_views import AuditoriaLogsView, ExportarAuditoriaView

urlpatterns = [
    # ─── Autenticación ─────────────────────────────────────────────────────
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
    path('auth/me/', MiPerfilView.as_view(), name='api-mi-perfil'),
    path('auth/profile/', ProfileView.as_view(), name='api-perfil-detalle'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='api-change-password'),
    path('auth/reset-verify/', PasswordResetVerifyView.as_view(), name='api-reset-verify'),
    path('auth/reset-confirm/', PasswordResetConfirmView.as_view(), name='api-reset-confirm'),

    # ─── Beneficiarios (WS Bienestar) ────────────────────────────────────────
    path('bienestar/<str:cedula>/', BienestarBeneficiarioView.as_view(), name='api-bienestar'),

    # ─── Usuarios ────────────────────────────────────────────────────────────
    path('usuarios/', GestionUsuariosView.as_view(), name='api-usuarios'),
    path('usuarios/<int:pk>/', UsuarioDetailView.as_view(), name='api-usuario-detail'),
    path('usuarios/<int:pk>/toggle-status/', ToggleEstadoUsuarioView.as_view(), name='api-usuario-toggle'),
    path('usuarios/roles/', RolesDisponiblesView.as_view(), name='api-roles'),
    path('usuarios/verificar/<str:cedula>/', VerificarCedulaView.as_view(), name='api-verificar-cedula'),
    path('sigefirrhh/<str:cedula>/', SigefirrhHProxyView.as_view(), name='api-sigefirrhh'),

    # ─── Auditoría (Bitácora de Logs) ────────────────────────────────────────
    path('auditoria/logs/', AuditoriaLogsView.as_view(), name='api-auditoria-logs'),
    path('auditoria/exportar/', ExportarAuditoriaView.as_view(), name='api-auditoria-exportar'),
]
