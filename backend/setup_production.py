"""
Script maestro de inicialización para la Plantilla Base (Boilerplate).
Configura tablas base de seguridad, roles genéricos, bitácora de auditoría y usuarios principales.

Ejecutar con: python setup_production.py
"""
import os
import django
from django.db import connection

# Inicializar configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventario_farmacia.settings')
django.setup()

from django.contrib.auth.models import User, Group

def setup_production():
    print("======================================================================")
    print("INICIANDO CONFIGURACIÓN INICIAL DE PLANTILLA BASE (BOILERPLATE)")
    print("======================================================================")

    with connection.cursor() as cursor:
        # 1. Crear tablas base de seguridad y roles si no existen
        print("\n[*] Asegurando columnas extras en public.auth_user...")
        try:
            cursor.execute("ALTER TABLE public.auth_user ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP DEFAULT NOW();")
            cursor.execute("ALTER TABLE public.auth_user ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);")
            print("  - Columnas en auth_user aseguradas.")
        except Exception as e:
            print(f"  - (Aviso) No se pudieron crear las columnas en auth_user: {e}")

        print("\n[*] Creando tabla public.roles...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.roles (
                id_rol SERIAL PRIMARY KEY,
                nombre_rol VARCHAR(100) NOT NULL UNIQUE,
                modulo VARCHAR(100) NOT NULL
            );
        """)
        
        print("\n[*] Creando tabla public.usuarios_rol...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.usuarios_rol (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
                id_rol INT NOT NULL REFERENCES public.roles(id_rol) ON DELETE CASCADE,
                CONSTRAINT uq_user_rol UNIQUE (user_id, id_rol)
            );
        """)

        # 2. Crear tabla de auditoria_logs si no existe
        print("\n[*] Creando tabla public.auditoria_logs...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.auditoria_logs (
                id_log SERIAL PRIMARY KEY,
                id_usuario INT REFERENCES public.auth_user(id) ON DELETE SET NULL,
                accion VARCHAR(100) NOT NULL,
                descripcion TEXT NOT NULL,
                fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                sistema VARCHAR(50) DEFAULT 'SISTEMA',
                metadata JSONB
            );
        """)

        # 3. Crear tabla public.historial_accesos
        print("\n[*] Creando tabla public.historial_accesos...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.historial_accesos (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES public.auth_user(id) ON DELETE CASCADE,
                username VARCHAR(150) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("  - Tablas base verificadas/creadas.")

        # 4. Inyectar/Sincronizar Roles del Negocio
        print("\n[*] Sembrando/Sincronizando catálogo de Roles Genéricos...")
        roles_data = [
            (1, 'ADMINISTRADOR', 'SISTEMA'),
            (2, 'DIRECTOR', 'SISTEMA'),
            (3, 'OPERATIVO', 'SISTEMA'),
            (4, 'AUDITOR', 'SISTEMA')
        ]
        
        for id_rol, nombre, modulo in roles_data:
            cursor.execute("SELECT id_rol FROM public.roles WHERE nombre_rol = %s;", [nombre])
            row = cursor.fetchone()
            if row:
                existing_id = row[0]
                if existing_id != id_rol:
                    print(f"  - Rol '{nombre}' existe con ID {existing_id}. Cambiando a ID {id_rol}...")
                    temp_name = f"{nombre}_temp_rename"
                    cursor.execute("UPDATE public.roles SET nombre_rol = %s WHERE id_rol = %s;", [temp_name, existing_id])
                    cursor.execute("INSERT INTO public.roles (id_rol, nombre_rol, modulo) VALUES (%s, %s, %s);", [id_rol, nombre, modulo])
                    cursor.execute("UPDATE public.usuarios_rol SET id_rol = %s WHERE id_rol = %s;", [id_rol, existing_id])
                    cursor.execute("DELETE FROM public.roles WHERE id_rol = %s;", [existing_id])
                else:
                    cursor.execute("UPDATE public.roles SET modulo = %s WHERE id_rol = %s;", [modulo, id_rol])
            else:
                cursor.execute("SELECT nombre_rol FROM public.roles WHERE id_rol = %s;", [id_rol])
                id_row = cursor.fetchone()
                if id_row:
                    existing_name = id_row[0]
                    print(f"  - Conflicto: ID {id_rol} ya está usado por '{existing_name}'. Eliminando para reasignar...")
                    cursor.execute("DELETE FROM public.usuarios_rol WHERE id_rol = %s;", [id_rol])
                    cursor.execute("DELETE FROM public.roles WHERE id_rol = %s;", [id_rol])
                
                cursor.execute("""
                    INSERT INTO public.roles (id_rol, nombre_rol, modulo) 
                    VALUES (%s, %s, %s);
                """, [id_rol, nombre, modulo])
        print(f"  - {len(roles_data)} roles sincronizados correctamente.")

    # 5. Sembrar Usuarios Iniciales
    print("\n[*] Asegurando usuarios iniciales del sistema...")
    
    for _, g_name, _ in roles_data:
        Group.objects.get_or_create(name=g_name)

    # A) Administrador Maestro (Cédula: 12345678)
    admin_user, created = User.objects.get_or_create(
        username="12345678",
        defaults={
            "first_name": "USUARIO",
            "last_name": "ADMINISTRADOR",
            "email": "admin@boilerplate.gob.ve",
            "is_superuser": True,
            "is_staff": True,
            "is_active": True
        }
    )
    if created:
        admin_user.set_password("admin12345678")
        admin_user.save()
    admin_user.groups.add(Group.objects.get(name="ADMINISTRADOR"))
    
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM public.usuarios_rol WHERE user_id = %s;", [admin_user.id])
        cursor.execute("INSERT INTO public.usuarios_rol (user_id, id_rol) VALUES (%s, 1);", [admin_user.id])
    print(f"  + Administrador Maestro: 12345678 {'(Creado)' if created else '(Existente)'}")

    # B) Director (Cédula: 9876543)
    director_user, created = User.objects.get_or_create(
        username="9876543",
        defaults={
            "first_name": "USUARIO",
            "last_name": "DIRECTOR",
            "email": "director@boilerplate.gob.ve",
            "is_superuser": False,
            "is_staff": False,
            "is_active": True
        }
    )
    if created:
        director_user.set_password("director123")
        director_user.save()
    director_user.groups.add(Group.objects.get(name="DIRECTOR"))
    
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM public.usuarios_rol WHERE user_id = %s;", [director_user.id])
        cursor.execute("INSERT INTO public.usuarios_rol (user_id, id_rol) VALUES (%s, 2);", [director_user.id])
    print(f"  + Director de Servicio: 9876543 {'(Creado)' if created else '(Existente)'}")

    # C) Auditor de Sistema (Cédula: 96325874)
    auditor_user, created = User.objects.get_or_create(
        username="96325874",
        defaults={
            "first_name": "USUARIO",
            "last_name": "AUDITOR",
            "email": "auditor@boilerplate.gob.ve",
            "is_superuser": False,
            "is_staff": False,
            "is_active": True
        }
    )
    if created:
        auditor_user.set_password("auditor123")
        auditor_user.save()
    auditor_user.groups.add(Group.objects.get(name="AUDITOR"))
    
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM public.usuarios_rol WHERE user_id = %s;", [auditor_user.id])
        cursor.execute("INSERT INTO public.usuarios_rol (user_id, id_rol) VALUES (%s, 4);", [auditor_user.id])
    print(f"  + Auditor de Sistema: 96325874 {'(Creado)' if created else '(Existente)'}")

    # 6. Reiniciar secuencias de PK
    print("\n[*] Corrigiendo secuencias de llaves primarias...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT setval('public.roles_id_rol_seq', COALESCE((SELECT MAX(id_rol)+1 FROM public.roles), 1), false);
        """)
    print("  - Secuencias de IDs sincronizadas correctamente.")

    print("\n======================================================================")
    print("[OK] CONFIGURACIÓN DE PLANTILLA COMPLETADA EXITOSAMENTE")
    print("======================================================================")

if __name__ == "__main__":
    setup_production()
