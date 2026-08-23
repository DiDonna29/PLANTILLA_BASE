import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventario_farmacia.settings')
django.setup()

from django.db import connection

TABLES_TO_TRUNCATE = [
    # Historial, sesiones, auditoría y tokens
    "public.auditoria_logs",
    "public.historial_accesos",
    "public.django_session",
    "public.token_blacklist_blacklistedtoken",
    "public.token_blacklist_outstandingtoken",
]

def clear_db():
    print("=== INICIANDO LIMPIEZA DE BASE DE DATOS ===")
    
    with connection.cursor() as cursor:
        # 1. Truncar tablas en bloque con CASCADE
        print("\n1. Vaciando tablas operacionales e historial...")
        try:
            existing_tables = []
            for table in TABLES_TO_TRUNCATE:
                schema, name = table.split('.')
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = %s AND table_name = %s
                    )
                """, [schema, name])
                if cursor.fetchone()[0]:
                    existing_tables.append(table)
            
            if existing_tables:
                tables_sql = ", ".join(existing_tables)
                cursor.execute(f"TRUNCATE TABLE {tables_sql} CASCADE;")
                print("   [OK] Todas las tablas operacionales vaciadas exitosamente.")
            else:
                print("   [SKIP] No hay tablas operacionales para vaciar.")
        except Exception as e:
            print(f"   [ERROR] Al vaciar tablas operacionales: {e}")
                
        # 2. Eliminar usuarios excepto el administrador (12345678)
        print("\n2. Eliminando cuentas de usuarios excepto el Administrador...")
        try:
            # Eliminar relaciones de grupo
            cursor.execute("""
                DELETE FROM public.auth_user_groups 
                WHERE user_id IN (SELECT id FROM public.auth_user WHERE username != '12345678')
            """)
            
            # Eliminar relaciones de rol de otros usuarios
            cursor.execute("""
                DELETE FROM public.usuarios_rol 
                WHERE user_id IN (SELECT id FROM public.auth_user WHERE username != '12345678')
            """)
            
            # Eliminar registros del log de Django admin
            cursor.execute("""
                DELETE FROM public.django_admin_log 
                WHERE user_id IN (SELECT id FROM public.auth_user WHERE username != '12345678')
            """)
            
            # Eliminar usuarios excepto 12345678
            cursor.execute("""
                DELETE FROM public.auth_user 
                WHERE username != '12345678'
            """)
            print("   [OK] Limpieza de cuentas y perfiles de usuarios finalizada.")
            
        except Exception as e:
            print(f"   [ERROR] Al depurar usuarios: {e}")
            
    print("\n=== LIMPIEZA COMPLETADA CON ÉXITO ===")

if __name__ == '__main__':
    # Pedir confirmación si se ejecuta de forma manual
    confirm = input("¿Está seguro de que desea limpiar toda la base de datos de transacciones? (s/n): ")
    if confirm.lower() == 's':
        clear_db()
    else:
        print("Operación cancelada.")
