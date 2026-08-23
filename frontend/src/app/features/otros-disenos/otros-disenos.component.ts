import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-otros-disenos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-4">
      <div class="card border border-subtle shadow-sm overflow-hidden border-2 rounded-3">
        <!-- Barra de Navegación Rápida superior -->
        <div class="card-header bg-body-tertiary border-bottom border-subtle d-flex flex-wrap justify-content-between align-items-center gap-3 py-3">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar avatar-m bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
              <span class="fas fa-cubes fs-0"></span>
            </div>
            <div>
              <h5 class="mb-0 text-900 fw-bold">Plantilla Phoenix Interactiva</h5>
              <p class="mb-0 fs--2 text-600">Visualizador oficial de componentes y flujos de trabajo</p>
            </div>
          </div>

          <!-- Accesos directos a sub-páginas -->
          <div class="d-flex flex-wrap gap-2">
            <button *ngFor="let link of demoLinks" 
                    class="btn btn-xs fw-bold px-3 py-2" 
                    [class.btn-primary]="activeDemoUrl === link.url"
                    [class.btn-phoenix-secondary]="activeDemoUrl !== link.url"
                    (click)="cargarDemoUrl(link.url)">
              <span [class]="link.icon + ' me-1'"></span> {{ link.label }}
            </button>
          </div>
        </div>
        
        <!-- Contenedor del Iframe de Visualización -->
        <div class="card-body p-0 bg-light">
          <iframe [src]="safeDemoUrl" 
                  style="width: 100%; height: 80vh; border: none; display: block;" 
                  title="Demo Phoenix">
          </iframe>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-xs {
      padding: 0.35rem 0.65rem;
      font-size: 0.72rem;
    }
  `]
})
export class OtrosDisenosComponent {
  private sanitizer = inject(DomSanitizer);

  activeDemoUrl = '/public/phoenix/index.html';
  safeDemoUrl: SafeResourceUrl;

  demoLinks = [
    { label: 'Dashboard Principal', icon: 'fas fa-chart-line', url: '/public/phoenix/index.html' },
    { label: 'Catálogo de Widgets', icon: 'fas fa-th', url: '/public/phoenix/widgets.html' },
    { label: 'Calendario', icon: 'fas fa-calendar-days', url: '/public/phoenix/apps/calendar.html' },
    { label: 'Chat', icon: 'fas fa-comments', url: '/public/phoenix/apps/chat.html' },
    { label: 'Gestión de Proyectos', icon: 'fas fa-list-check', url: '/public/phoenix/dashboard/project-management.html' },
    { label: 'Documentación Oficial', icon: 'fas fa-book', url: '/public/phoenix/documentation/getting-started.html' }
  ];

  constructor() {
    this.safeDemoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.activeDemoUrl);
  }

  cargarDemoUrl(url: string): void {
    this.activeDemoUrl = url;
    this.safeDemoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
