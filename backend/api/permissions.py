"""
Permisos personalizados para la Plantilla Base (Boilerplate).

Jerarquía de roles:
  - ADMINISTRADOR: acceso total
  - DIRECTOR: dirección general + usuarios + auditoría
  - OPERATIVO: operaciones del sistema
  - AUDITOR: lectura de bitácoras y logs de auditoría
"""
import logging
from rest_framework.permissions import BasePermission
from django.db import connection

logger = logging.getLogger(__name__)


def get_user_role(user):
    """Retorna el nombre del rol del usuario desde la tabla usuarios_rol o grupos de Django."""
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        logger.debug(f"[PERMS] Usuario '{user.username}' es Superusuario -> Rol: ADMINISTRADOR")
        return 'ADMINISTRADOR'
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT r.nombre_rol FROM roles r
                JOIN usuarios_rol ur ON r.id_rol = ur.id_rol
                WHERE ur.user_id = %s
            """, [user.id])
            row = cursor.fetchone()
    except Exception as e:
        logger.error(f"[PERMS] Error al consultar rol: {str(e)}")
        row = None
    
    if row:
        rol = row[0].upper()
    else:
        # Fallback a Grupos de Django
        grupo = user.groups.first()
        rol = grupo.name.upper() if grupo else None
        
    logger.info(f"[DEBUG_ROLE] Usuario: {user.username} | ID: {user.id} | Rol Detectado: {rol}")
    return rol


class IsAdministrador(BasePermission):
    """Solo el rol ADMINISTRADOR tiene acceso."""
    def has_permission(self, request, view):
        return get_user_role(request.user) == 'ADMINISTRADOR'


class IsDirectorOrAdmin(BasePermission):
    """DIRECTOR o ADMINISTRADOR tienen acceso."""
    def has_permission(self, request, view):
        return get_user_role(request.user) in ('DIRECTOR', 'ADMINISTRADOR')


class IsEncargadoOrAdmin(BasePermission):
    """Alias para compatibilidad con vistas existentes."""
    def has_permission(self, request, view):
        return get_user_role(request.user) in ('DIRECTOR', 'ADMINISTRADOR')


class IsOperativoOrAbove(BasePermission):
    """Cualquier rol operativo o superior tiene acceso."""
    def has_permission(self, request, view):
        rol = get_user_role(request.user)
        return rol in ('OPERATIVO', 'DIRECTOR', 'ADMINISTRADOR')


class IsFarmaceuticoOrAbove(BasePermission):
    """Alias para compatibilidad. En esta plantilla equivale a IsOperativoOrAbove."""
    def has_permission(self, request, view):
        rol = get_user_role(request.user)
        return rol in ('OPERATIVO', 'DIRECTOR', 'ADMINISTRADOR')


class IsAuditorOrAdmin(BasePermission):
    """Solo el rol AUDITOR, DIRECTOR o ADMINISTRADOR tienen acceso."""
    def has_permission(self, request, view):
        return get_user_role(request.user) in ('AUDITOR', 'ADMINISTRADOR', 'DIRECTOR')
