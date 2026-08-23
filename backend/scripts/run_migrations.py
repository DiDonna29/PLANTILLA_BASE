import os
import sys
import subprocess

def run():
    print("=== Iniciando Migraciones de DB ===")
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    python_exec = sys.executable

    print("\n1. Ejecutando makemigrations y migrate...")
    try:
        subprocess.run([python_exec, "manage.py", "makemigrations"], cwd=base_dir, check=True)
        subprocess.run([python_exec, "manage.py", "migrate"], cwd=base_dir, check=True)
        print("[OK] Migraciones ejecutadas con éxito.")
    except subprocess.CalledProcessError as e:
        print(f"Error ejecutando migraciones: {e}")
        return

    print("\n=== Configuración de DB Finalizada ===")

if __name__ == '__main__':
    run()
