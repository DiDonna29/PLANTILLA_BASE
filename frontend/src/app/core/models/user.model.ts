export type UserRole = 'ADMINISTRADOR' | 'DIRECTOR' | 'OPERATIVO' | 'AUDITOR';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  rol: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  user: User;
  code?: string;
  detail?: string;
}

export interface UsuarioApp {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  rol_nombre: string;
  id_rol?: number;
  last_login?: string;
}

export interface RolDisponible {
  id_rol: number;
  nombre_rol: string;
}
