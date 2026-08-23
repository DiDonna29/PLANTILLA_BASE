# Sistema General Institucional — Plantilla Base (Boilerplate)
## Dirección Ejecutiva de la Magistratura (DEM)

Este repositorio es una plantilla general y modular (Boilerplate) diseñada para el control, administración y auditoría de procesos del servidor judicial en la Dirección Ejecutiva de la Magistratura (DEM). Está construida bajo una arquitectura desacoplada con un Backend en Django REST Framework y un Frontend en Angular.

---

## 🚀 Instalación Rápida (Un Solo Comando)

El repositorio incluye un script automatizado en PowerShell (`start_app.ps1`) en la raíz que se encarga de:
1. Crear el entorno virtual de Python (`.venv`) e instalar dependencias del Backend.
2. Ejecutar las migraciones de Django y sincronizar los roles.
3. Instalar los módulos de Node (`node_modules`) del Frontend.
4. Levantar los servidores de desarrollo de Backend y Frontend en ventanas independientes.

### Requisitos Previos:
- **Python 3.10+** (Asegúrate de tenerlo agregado al PATH del sistema).
- **Node.js 18+** y npm.
- **PostgreSQL 15** levantado localmente.

### Paso 1: Inicializar la Base de Datos
Antes de iniciar por primera vez, debe crear los esquemas multiesquema requeridos en su servidor de base de datos PostgreSQL utilizando el archivo provisto en la raíz:
```bash
# Conéctese a su cliente de PostgreSQL (pgAdmin, DBeaver o psql) y ejecute:
\i database.sql
```
> [!NOTE]
> El script `database.sql` creará los esquemas `sistema` y `sistema` requeridos para las búsquedas. Las tablas se crearán automáticamente durante el despliegue del script maestro.

### Paso 2: Configurar las Variables de Entorno
1. Copie el archivo `.env.example` en la carpeta `backend` como `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Abra `backend/.env` y complete su contraseña de PostgreSQL (`DB_PASS`).
2. Copie el archivo `.env.example` de la carpeta `frontend` como `.env`:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

### Paso 3: Ejecutar el Script de Arranque

Para mayor comodidad, el proyecto incluye archivos ejecutables de procesamiento por lotes (`.bat`) en la raíz. Solo debe hacer doble clic sobre ellos (o ejecutarlos desde CMD/PowerShell) y estos aplicarán el **bypass de permisos de ejecución** automáticamente:

*   **`iniciar.bat`**: Ejecuta e inicia ambos servidores normalmente en modo desarrollo.
*   **`iniciar_limpio.bat`**: Fuerza una instalación limpia total (`-ForceInstall`), borrando dependencias antiguas y recreando la base de datos de cero.
*   **`diagnostico.bat`**: Ejecuta las pruebas y comprobación de salud del entorno de desarrollo (`test_install.ps1`).

*Opcional: Si prefiere abrir PowerShell manualmente en la raíz del proyecto, puede ejecutar:*
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\start_app.ps1
```

---

## 🔐 Cuentas de Acceso Predeterminadas (Demo/Semilla)

Al iniciar el proyecto, la base de datos se siembra automáticamente con los siguientes perfiles de prueba para desarrollo:

| Rol de Usuario | Cédula (Usuario) | Contraseña Predeterminada | Permisos / Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador Maestro** | `12345678` | `admin12345678` | Acceso total al sistema, configuraciones y control de usuarios. |
| **Director de Servicio** | `9876543` | `director123` | Control de flujos operativos, consulta de reportes y gestión de usuarios (excepto Admin). |
| **Auditor de Sistema** | `96325874` | `auditor123` | Consulta y exportación de la Bitácora de Eventos e Historiales. |

---

## 📁 Estructura del Proyecto

- `database.sql`: Script de inicialización de esquemas PostgreSQL.
- `/backend`: API REST en Django. Incluye vistas de auditoría, autenticación JWT, y controladores de servicios.
- `/frontend`: Aplicación SPA en Angular. Cuenta con rutas protegidas por roles, perfiles de usuario y el módulo de visualización de plantillas.
- `start_app.ps1`: Script automatizado de instalación y arranque para Windows.

---

**© 2026 Dirección Ejecutiva de Magistratura (DEM)**. Oficina de Desarrollo Informático (ODI).
