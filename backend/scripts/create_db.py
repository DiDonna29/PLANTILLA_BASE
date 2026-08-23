import os
import sys
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))

db_name = os.getenv('DB_NAME', 'plantilla_db')
db_user = os.getenv('DB_USER', 'postgres')
db_pass = os.getenv('DB_PASS', '')
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '5432')

print(f"[*] Verificando existencia de la base de datos '{db_name}'...")

try:
    # 1. Conectarse temporalmente a la base de datos del sistema 'postgres'
    conn = psycopg2.connect(
        dbname='postgres',
        user=db_user,
        password=db_pass,
        host=db_host,
        port=db_port
    )
    conn.autocommit = True
    cursor = conn.cursor()

    # 2. Validar si existe la base de datos configurada
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}';")
    db_exists = cursor.fetchone()

    if not db_exists:
        print(f"[*] La base de datos '{db_name}' no existe. Creando en PostgreSQL...")
        cursor.execute(f"CREATE DATABASE {db_name};")
        print(f"[OK] Base de datos '{db_name}' creada exitosamente.")
    else:
        print(f"[OK] La base de datos '{db_name}' ya existe en el servidor.")

    cursor.close()
    conn.close()

except psycopg2.OperationalError as e:
    err_msg = str(e)
    # Detectar errores de contraseña o autenticación
    if "authentication failed" in err_msg or "password" in err_msg or "fe_sendauth" in err_msg:
        print("[AUTH_ERROR] La contraseña de PostgreSQL es incorrecta o no fue especificada.")
        sys.exit(2) # Código de salida 2 indica error de contraseña
    else:
        print(f"[WARNING] Ocurrio un aviso al conectar: {e}")
        sys.exit(0)
except Exception as e:
    print(f"[WARNING] Ocurrio un aviso al verificar/crear la base de datos: {e}")
    sys.exit(0)
