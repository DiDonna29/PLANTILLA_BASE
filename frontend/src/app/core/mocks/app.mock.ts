import { UsuarioApp, RolDisponible } from '../models/user.model';

export const ROLES_MOCK: RolDisponible[] = [
  { id_rol: 1, nombre_rol: 'ADMINISTRADOR' },
  { id_rol: 2, nombre_rol: 'DIRECTOR' },
  { id_rol: 3, nombre_rol: 'OPERATIVO' },
  { id_rol: 4, nombre_rol: 'AUDITOR' }
];

export const USUARIOS_MOCK: UsuarioApp[] = [
  { id: 1, username: '12345678', first_name: 'PEDRO', last_name: 'PÉREZ', email: 'pperez@boilerplate.gob.ve', id_rol: 1, rol_nombre: 'ADMINISTRADOR', is_active: true },
  { id: 2, username: '9876543', first_name: 'MARÍA', last_name: 'DELGADO', email: 'mdelgado@boilerplate.gob.ve', id_rol: 2, rol_nombre: 'DIRECTOR', is_active: true },
  { id: 3, username: '24111222', first_name: 'JUAN', last_name: 'LOZADA', email: 'jlozada@boilerplate.gob.ve', id_rol: 3, rol_nombre: 'OPERATIVO', is_active: true },
  { id: 4, username: '96325874', first_name: 'ANA', last_name: 'RODRÍGUEZ', email: 'auditor@boilerplate.gob.ve', id_rol: 4, rol_nombre: 'AUDITOR', is_active: true }
];
