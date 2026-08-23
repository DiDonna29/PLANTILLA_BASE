import json
import os
import requests as http_requests
from django.conf import settings
from datetime import date, datetime

def calculate_age(born_date):
    """Calcula la edad a partir de una fecha (string YYYY-MM-DD o objeto date)."""
    if not born_date:
        return "N/A"
    try:
        if isinstance(born_date, str):
            # Intentar varios formatos si es necesario, por ahora YYYY-MM-DD
            born = datetime.strptime(born_date, "%Y-%m-%d").date()
        else:
            born = born_date
        
        today = date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except Exception:
        return "N/A"

def fetch_bienestar_data(cedula):
    """
    Busca información en el sistema BIENESTAR (WebService o Mock).
    Retorna un diccionario con la data del titular y el beneficiario específico.
    """
    cedula_buscada = str(cedula).strip()
    data = None

    # 1. Intentar con el WebService de Bienestar Viejo (GET)
    actual_ws_url = getattr(settings, 'BIENESTAR_ACTUAL_URL', '')
    if actual_ws_url and actual_ws_url.startswith(('http://', 'https://')):
        try:
            clean_url = actual_ws_url.rstrip('/')
            response = http_requests.get(f"{clean_url}/{cedula_buscada}/", timeout=2, proxies={"http": None, "https": None})
            if response.status_code == 200:
                raw_data = response.json()
                if raw_data and (raw_data.get('nombres_titular') or raw_data.get('nombres')):
                    data = raw_data
        except Exception:
            pass

    # 2. Intentar con el WebService de Bienestar Nuevo (POST / GET)
    if not data:
        future_ws_url = getattr(settings, 'BIENESTAR_FUTURO_URL', '')
        if not future_ws_url:
            old_ws_url = getattr(settings, 'BIENESTAR_WS_URL', '')
            if old_ws_url and old_ws_url.startswith(('http://', 'https://')):
                future_ws_url = old_ws_url

        if future_ws_url and future_ws_url.startswith(('http://', 'https://')):
            try:
                clean_url = future_ws_url.rstrip('/')
                raw_data = None
                
                # Intentar primero con POST enviando la cédula como entero
                try:
                    cedula_val = int(cedula_buscada)
                    payload = {'cedula': cedula_val}
                    response = http_requests.post(clean_url, json=payload, timeout=2, proxies={"http": None, "https": None})
                    if response.status_code == 200:
                        raw_data = response.json()
                except Exception:
                    pass

                # Fallback a GET si POST falló o no retornó un diccionario/lista válido
                if not raw_data or not isinstance(raw_data, (dict, list)):
                    connector = '&' if '?' in clean_url else '?'
                    response = http_requests.get(f"{clean_url}{connector}cedula={cedula_buscada}", timeout=2, proxies={"http": None, "https": None})
                    if response.status_code == 200:
                        raw_data = response.json()

                if raw_data:
                    # Si es una lista, tomar el primer elemento
                    if isinstance(raw_data, list):
                        raw_data = raw_data[0] if len(raw_data) > 0 else None
                    
                    if raw_data and (raw_data.get('nombres_titular') or raw_data.get('nombres')):
                        data = raw_data
            except Exception:
                pass

    # 3. Intentar con el archivo Mock Local
    if not data:
        mock_path_rel = getattr(settings, 'BIENESTAR_MOCK_PATH', '')
        if not mock_path_rel:
            old_ws_url = getattr(settings, 'BIENESTAR_WS_URL', '')
            if old_ws_url and not old_ws_url.startswith(('http://', 'https://')):
                mock_path_rel = old_ws_url
        if not mock_path_rel:
            mock_path_rel = 'api/mocks/bienestar_mock.json'
        
        mock_path = os.path.join(settings.BASE_DIR, mock_path_rel)
        if os.path.exists(mock_path):
            try:
                with open(mock_path, 'r', encoding='utf-8') as f:
                    mocks = json.load(f)
                    
                    # El mock está estructurado como una lista de titulares con sus cargas
                    data = next((t for t in mocks if str(t['cedula']) == cedula_buscada), None)
                    
                    # Si no es el titular, buscamos en las cargas de todos los titulares
                    if not data:
                        for t in mocks:
                            carga = next((c for c in t.get('cargas_familiares', []) if str(c.get('cedula_beneficiario', c.get('cedula'))) == cedula_buscada), None)
                            if carga:
                                data = dict(t)
                                data['_carga_encontrada'] = carga
                                break
            except Exception:
                pass

    # Procesar y normalizar la respuesta final
    if data:
        carga = data.get('_carga_encontrada')
        
        # En la API Real de Bienestar Actual (GET), si buscamos una carga familiar, 
        # devuelve la estructura del TITULAR, y la carga viene dentro de cargas_familiares.
        # Pero `_carga_encontrada` solo lo llenamos en el MOCK. Vamos a intentar llenarlo para la API Real.
        if not carga and str(data.get('cedula', '')) != cedula_buscada:
            # Buscamos en las cargas familiares del data
            cargas = data.get('cargas_familiares') or data.get('cargas') or []
            carga = next((c for c in cargas if str(c.get('cedula_beneficiario', c.get('cedula'))) == cedula_buscada), None)

        ced_titular = str(data.get('cedula', ''))
        t_noms = data.get('nombres_titular') or data.get('nombres') or ''
        t_apes = data.get('apellidos_titular') or data.get('apellidos') or ''
        titular_nombre_completo = f"{t_noms} {t_apes}".strip()
        
        # Si no hay carga encontrada por ID, pero la cedula coincide con el titular
        if not carga and ced_titular == cedula_buscada:
            parentesco = 'TITULAR'
            nombre_beneficiario = titular_nombre_completo
            fecha_nac_beneficiario = data.get('fecha_nacimiento') or data.get('fecha_nac')
        elif carga:
            parentesco = carga.get('parentesco', 'FAMILIAR')
            nombre_beneficiario = f"{carga.get('nombres', '')} {carga.get('apellidos', '')}".strip()
            fecha_nac_beneficiario = carga.get('fecha_nacimiento')
        else:
            # Fallback
            parentesco = 'TITULAR' if ced_titular == cedula_buscada else 'FAMILIAR'
            nombre_beneficiario = 'N/A'
            fecha_nac_beneficiario = None

        return {
            'titular_nombre': titular_nombre_completo or 'N/A',
            'titular_cedula': data.get('cedula', 'N/A'),
            'titular_email': data.get('correo_electronico', 'N/A'),
            'titular_telefono': data.get('telefono_principal', 'N/A'),
            'titular_dependencia': data.get('dependencia') or 'BIENESTAR SOCIAL',
            'titular_cargo': data.get('cargo_descripcion') or data.get('cargo') or 'FUNCIONARIO',
            'titular_edad': calculate_age(data.get('fecha_nacimiento') or data.get('fecha_nac')),
            
            'beneficiario_nombre': nombre_beneficiario or 'N/A',
            'beneficiario_parentesco': parentesco,
            'beneficiario_edad': calculate_age(fecha_nac_beneficiario),
            'found': True
        }

    return {'found': False}


def link_callback(uri, rel):
    """
    Convert HTML static/media URIs to local filesystem paths for xhtml2pdf.
    Supports absolute paths, static/media URLs and fallback to finders.
    """
    import os
    from django.conf import settings
    from django.contrib.staticfiles import finders

    # Clean the uri from any leading slash or prefix
    # Normalizing urls like /static/... or static/...
    static_url = settings.STATIC_URL.lstrip('/')
    media_url = settings.MEDIA_URL.lstrip('/')
    clean_uri = uri.lstrip('/')

    if clean_uri.startswith(static_url):
        relative_path = clean_uri[len(static_url):].lstrip('/')
        path = os.path.join(settings.STATIC_ROOT or '', relative_path)
    elif clean_uri.startswith(media_url):
        relative_path = clean_uri[len(media_url):].lstrip('/')
        path = os.path.join(settings.MEDIA_ROOT or '', relative_path)
    else:
        # Check if the uri is already an absolute path that exists
        if os.path.exists(uri):
            return uri
        path = os.path.join(settings.BASE_DIR, uri)

    # Fallback to Django finders if it doesn't exist on disk (useful in development)
    if not os.path.exists(path):
        relative_search = clean_uri
        if clean_uri.startswith(static_url):
            relative_search = clean_uri[len(static_url):].lstrip('/')
        elif clean_uri.startswith('static'):
            relative_search = clean_uri[len('static'):].lstrip('/')
            
        result = finders.find(relative_search)
        if result:
            if not isinstance(result, (list, tuple)):
                result = [result]
            path = result[0]
            
    return path


def get_logo_base64(logo_name):
    """
    Carga un logotipo desde el static del backend o assets del frontend
    y retorna su representación en una cadena base64.
    """
    import os
    import base64
    from django.conf import settings

    # 1. Buscar primero en el static del backend
    path = os.path.join(settings.BASE_DIR, 'static', 'img', logo_name)
    
    # 2. Fallback al frontend de desarrollo si no existe
    if not os.path.exists(path):
        path = os.path.join(settings.BASE_DIR, '..', 'frontend', 'src', 'assets', 'img', logo_name)

    if os.path.exists(path):
        try:
            with open(path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                return encoded_string
        except Exception:
            pass
    return None


