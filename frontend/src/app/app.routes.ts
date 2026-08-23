import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Login
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'auth/change-password',
    loadComponent: () => import('./features/auth/pages/change-password/change-password.component').then(m => m.ChangePasswordComponent),
  },

  // Layout principal (protegido)
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      // Ruta raíz: redirige a /inicio
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },

      // Perfil — Todos los roles (siempre accesible)
      {
        path: 'perfil',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },

      // Dashboard — ADMINISTRADOR, DIRECTOR, OPERATIVO
      {
        path: 'inicio',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR', 'DIRECTOR', 'OPERATIVO'] },
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },

      // Otros Diseños — Accesible por todos
      {
        path: 'otros-disenos',
        loadComponent: () => import('./features/otros-disenos/otros-disenos.component').then(m => m.OtrosDisenosComponent),
      },

      // Gestión de Usuarios — Solo ADMINISTRADOR y DIRECTOR
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR', 'DIRECTOR'] },
        children: [
          { path: '', redirectTo: 'activos', pathMatch: 'full' },
          {
            path: 'activos',
            loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
          },
          {
            path: 'inactivos',
            loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
          }
        ]
      },

      // Auditoría (Bitácora de Logs) — ADMINISTRADOR, DIRECTOR, AUDITOR
      {
        path: 'auditoria',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR', 'DIRECTOR', 'AUDITOR'] },
        children: [
          { path: '', redirectTo: 'logs', pathMatch: 'full' },
          {
            path: 'logs',
            loadComponent: () => import('./features/auditoria/auditoria-logs.component').then(m => m.AuditoriaLogsComponent)
          }
        ]
      }
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];