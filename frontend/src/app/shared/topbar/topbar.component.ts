import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  template: `
    <nav class="navbar navbar-top fixed-top justify-content-between px-3 px-sm-4" id="navbarTop" style="height: var(--navbar-top-height);">
      <!-- Area Izquierda: Logo y Botón Hamburguesa -->
      <div class="d-flex align-items-center gap-2">
        <button
          class="btn navbar-toggler-humburger-icon hover-bg-transparent d-inline-block d-lg-none"
          type="button"
          (click)="toggleMobileNavbar()"
          aria-label="Toggle navigation"
          style="border: none; padding: 0.25rem; margin-right: 0.25rem;"
        >
          <span class="navbar-toggle-icon"><span class="toggle-line"></span></span>
        </button>
        <a class="navbar-brand me-0 ms-3 ms-lg-4" routerLink="/inicio">
          <div class="d-flex align-items-center gap-2 gap-sm-3">
            <div class="d-flex align-items-center">
              <img class="d-light-none" src="assets/img/dem.png" alt="Logo DEM" style="height: 38px; width: auto;" />
              <img class="d-dark-none" src="assets/img/dem-2.png" alt="Logo DEM" style="height: 38px; width: auto;" />
            </div>
          </div>
        </a>
      </div>

      <!-- Area Centro: Título Institucional -->
      <div class="d-none d-xl-flex flex-column align-items-center text-center flex-grow-1 px-3">
        <div class="mt-1 text-uppercase text-600" style="font-size: 0.65rem; font-weight: 600; opacity: 0.8; letter-spacing: 1px;">
          SISTEMA INSTITUCIONAL GENERAL - DIRECCIÓN EJECUTIVA DE LA MAGISTRATURA
        </div>
      </div>

      <!-- Area Derecha: Iconos y Usuario -->
      <ul class="navbar-nav navbar-nav-icons flex-row align-items-center gap-1 gap-sm-3 m-0 p-0" style="list-style: none;">
        <!-- Location indicator -->
        <li class="nav-item d-none d-md-block me-3 mt-2">
          <div class="d-flex align-items-center bg-body-tertiary border border-subtle px-3 py-1 rounded-pill shadow-sm">
            <div class="me-2 text-primary">
              <span class="fas fa-landmark fs-0"></span>
            </div>
            <div class="d-flex flex-column">
              <span class="fw-bolder text-1100 fs--2 lh-1 text-uppercase" style="letter-spacing: 0.5px">Sede Central</span>
              <span class="text-600 fs--2 fw-medium">{{ today | date:'d MMM y, HH:mm':'':'es' }}</span>
            </div>
          </div>
        </li>

        <!-- Theme toggle -->
        <li class="nav-item">
          <div class="theme-control-toggle fa-icon-wait px-2">
            <input
              class="form-check-input ms-0 theme-control-toggle-input"
              type="checkbox"
              [checked]="isDarkTheme"
              (change)="toggleTheme()"
              id="themeControlToggleTop"
            />
            <label class="mb-0 theme-control-toggle-label theme-control-toggle-light" for="themeControlToggleTop" title="Modo Oscuro">
              <span class="fas fa-moon"></span>
            </label>
            <label class="mb-0 theme-control-toggle-label theme-control-toggle-dark" for="themeControlToggleTop" title="Modo Claro">
              <span class="fas fa-sun"></span>
            </label>
          </div>
        </li>

        <!-- User profile -->
        <li class="nav-item dropdown">
          <a class="nav-link lh-1 pe-0" id="navbarDropdownUser" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <div class="avatar avatar-m d-flex align-items-center justify-content-center rounded-circle fw-bolder"
                 style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;font-size:0.7rem;width:34px;height:34px">
              {{ getInitials() }}
            </div>
          </a>
          <div class="dropdown-menu dropdown-menu-end navbar-dropdown-caret py-0 dropdown-profile shadow border border-300" style="min-width: 320px;">
            <div class="card position-relative border-0 shadow-none">
              <div class="card-body p-0">
                <div class="text-center pt-4 pb-3">
                  <div class="avatar avatar-xl d-flex align-items-center justify-content-center rounded-circle mx-auto mb-2 fw-bolder fs-2"
                       style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;width:72px;height:72px">
                    {{ getInitials() }}
                  </div>
                  <h6 class="mt-2 text-body-emphasis mb-0 fw-bolder">{{ currentUser?.first_name }} {{ currentUser?.last_name }}</h6>
                  <p class="text-body-tertiary fs--2 mb-1">@{{ currentUser?.username }}</p>
                  <span class="badge badge-phoenix fs--2 text-uppercase"
                    [ngClass]="{
                      'badge-phoenix-danger': currentUser?.rol === 'ADMINISTRADOR',
                      'badge-phoenix-warning': currentUser?.rol === 'DIRECTOR',
                      'badge-phoenix-primary': currentUser?.rol === 'OPERATIVO',
                      'badge-phoenix-info': currentUser?.rol === 'AUDITOR'
                    }"
                  >{{ currentUser?.rol }}</span>
                </div>
              </div>
              <div class="card-footer p-0 border-top">
                <div class="px-4 py-3">
                  <a class="btn btn-phoenix-primary d-flex flex-center w-100 mb-2" routerLink="/perfil">
                    <span class="me-2 fas fa-user"></span>Mi Perfil
                  </a>
                  <a class="btn btn-phoenix-danger d-flex flex-center w-100" href="#!" (click)="logout(); $event.preventDefault()">
                    <span class="me-2 fas fa-sign-out-alt"></span>Cerrar Sesión
                  </a>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </nav>
  `,
})
export class TopbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: User | null = null;
  isDarkTheme = false;
  today = new Date();
  
  private pageTitles: Record<string, string> = {
    '/inicio': 'Inicio',
    '/perfil': 'Mi Perfil',
    '/usuarios': 'Gestión de Usuarios',
    '/auditoria/logs': 'Bitácora de Auditoría',
  };

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.isDarkTheme = localStorage.getItem('phoenixTheme') === 'dark';
    this.applyTheme();
    
    setInterval(() => {
      this.today = new Date();
    }, 1000);
  }

  getPageTitle(): string {
    const url = this.router.url.split('?')[0];
    return this.pageTitles[url] || 'Boilerplate DEM';
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    return `${this.currentUser.first_name[0] || ''}${this.currentUser.last_name[0] || ''}`.toUpperCase();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('phoenixTheme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    const theme = this.isDarkTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.documentElement.classList.toggle('dark', this.isDarkTheme);
    
    // Sincronizar clase dark-mode en body
    if (this.isDarkTheme) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMobileNavbar(): void {
    const nav = document.querySelector('.navbar-vertical');
    const overlay = document.querySelector('.sidebar-overlay');
    if (nav) {
      const show = nav.classList.toggle('show');
      if (overlay) {
        if (show) {
          overlay.classList.add('show');
        } else {
          overlay.classList.remove('show');
        }
      }
    }
  }
}
