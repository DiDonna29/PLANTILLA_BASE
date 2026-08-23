import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar navbar-vertical navbar-expand-lg" data-navbar-appearance="default">
      <div class="collapse navbar-collapse" id="navbarVerticalCollapse">
        <div class="navbar-vertical-content scrollbar d-flex flex-column h-100">

          <!-- User info -->
          <a 
            class="border rounded-3 mx-3 mb-3 mt-4 p-2 bg-body-tertiary shadow-sm cursor-pointer profile-nav-item d-block text-decoration-none" 
            *ngIf="currentUser"
            routerLink="/perfil"
            (click)="closeMobileNavbar()"
          >
            <div class="d-flex align-items-center gap-2">
              <div class="avatar avatar-m d-flex align-items-center justify-content-center rounded-circle fw-bolder"
                   style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;font-size:0.8rem;width:36px;height:36px;flex-shrink:0">
                {{ getInitials() }}
              </div>
              <div class="overflow-hidden">
                <p class="mb-0 fw-semibold text-1100 lh-1 text-truncate" style="font-size:0.82rem">
                  {{ currentUser.first_name }} {{ currentUser.last_name }}
                </p>
                <span
                  class="badge mt-1 text-uppercase"
                  [ngClass]="{
                    'badge-phoenix-danger': currentUser.rol === 'ADMINISTRADOR',
                    'badge-phoenix-warning': currentUser.rol === 'DIRECTOR',
                    'badge-phoenix-primary': currentUser.rol === 'OPERATIVO',
                    'badge-phoenix-info': currentUser.rol === 'AUDITOR'
                  }"
                  style="font-size:0.55rem; letter-spacing: 0.5px"
                >{{ currentUser.rol }}</span>
              </div>
            </div>
          </a>

          <!-- Navigation -->
          <ul class="navbar-nav flex-column mb-4" id="navbarVerticalNav">
            <li class="nav-item">
              <p class="navbar-vertical-label">Principal</p>
              <hr class="navbar-vertical-line" />

              <ng-container *ngFor="let item of navItems">
                <div class="nav-item-wrapper" *ngIf="canSee(item)">
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="active"
                    class="nav-link label-1"
                    (click)="closeMobileNavbar()"
                  >
                    <div class="d-flex align-items-center">
                      <span class="nav-link-icon">
                        <span class="{{ item.icon }}"></span>
                      </span>
                      <span class="nav-link-text-wrapper">
                        <span class="nav-link-text">{{ item.label }}</span>
                      </span>
                    </div>
                  </a>
                </div>
              </ng-container>
            </li>
          </ul>

          <!-- Institutional Branding Footer (Non-interactive) -->
          <div class="mt-auto sidebar-branding-footer border-top border-subtle">
            <div class="sidebar-branding-text">
              DEM <span class="sidebar-branding-dot">•</span> SISTEMA
              <div class="mt-1" style="font-size: 0.55rem; font-weight: 500; opacity: 0.8;">TSJ • MAGISTRATURA</div>
            </div>
          </div>

        </div>
      </div>
    </nav>
  `,
})
export class SidebarComponent implements OnInit {
  currentUser: User | null = null;
  userRole: string = '';

  navItems: NavItem[] = [
    { label: 'Inicio',              icon: 'fas fa-home',           route: '/inicio',          roles: ['ADMINISTRADOR', 'DIRECTOR', 'OPERATIVO'] },
    { label: 'Gestión de usuarios', icon: 'fas fa-users',          route: '/usuarios',        roles: ['ADMINISTRADOR', 'DIRECTOR'] },
    { label: 'Bitácora Eventos',     icon: 'fas fa-file-shield',    route: '/auditoria/logs',  roles: ['ADMINISTRADOR', 'DIRECTOR', 'AUDITOR'] },
    { label: 'Diseños & Componentes', icon: 'fas fa-palette',      route: '/otros-disenos' }
  ];

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.userRole = u?.rol?.toUpperCase().trim() || '';
      this.cdr.detectChanges();
    });
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    return `${this.currentUser.first_name[0] || ''}${this.currentUser.last_name[0] || ''}`.toUpperCase();
  }

  canSee(item: NavItem): boolean {
    if (!item.roles) return true;
    if (!this.userRole) return false;
    return item.roles.some(r => r.toUpperCase().trim() === this.userRole);
  }

  logout(): void {
    this.authService.logout();
  }

  closeMobileNavbar(): void {
    const nav = document.querySelector('.navbar-vertical');
    const overlay = document.querySelector('.sidebar-overlay');
    if (nav) nav.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
  }
}
