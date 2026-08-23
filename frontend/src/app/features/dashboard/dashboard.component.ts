import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="mb-4">
      <h2 class="mb-2 text-1100">Panel de Control Principal</h2>
      <h5 class="text-700 fw-semi-bold">Bienvenido al sistema institucional</h5>
    </div>

    <!-- Welcome Widget -->
    <div class="row g-4 mb-4">
      <div class="col-12 col-xxl-6">
        <div class="card h-100 border-0 shadow-sm position-relative overflow-hidden" 
             style="background: linear-gradient(135deg, #1e3a5f, #111827); color: white;">
          <div class="card-body p-4 p-md-5 d-flex flex-column justify-content-between z-index-1">
            <div>
              <span class="badge bg-primary mb-3 text-uppercase" style="letter-spacing: 1px;">
                Sesión Activa
              </span>
              <h1 class="fw-bold mb-3" style="color: #ffffff !important;">
                ¡Hola, {{ currentUser?.first_name }} {{ currentUser?.last_name }}!
              </h1>
              <p class="fs-0 max-w-500 mb-4" style="color: rgba(255, 255, 255, 0.8) !important;">
                Has ingresado como <strong style="color: #ffffff !important;">{{ currentUser?.rol }}</strong>. 
                Desde este panel puedes gestionar y auditar las operaciones básicas asignadas a tu cuenta institucional.
              </p>
            </div>
            <div>
              <a routerLink="/perfil" class="btn btn-primary px-4 py-2">
                <span class="fas fa-user-gear me-2"></span>Mi Perfil
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick stats/shortcuts -->
      <div class="col-12 col-md-6 col-xxl-3" *ngIf="isAdminOrDirector()">
        <div class="card h-100 stat-card-hover border-subtle">
          <div class="card-body d-flex flex-column justify-content-between p-4">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-700 mb-2 text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 0.5px">Usuarios</h6>
                <h4 class="fw-bolder text-1100 mb-0">Gestión de Personal</h4>
              </div>
              <div class="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle" style="width: 48px; height: 48px">
                <span class="fas fa-users-gear text-primary fs-2"></span>
              </div>
            </div>
            <p class="mt-4 mb-3 text-600 small">Administrar cuentas, perfiles, accesos y roles institucionales.</p>
            <a routerLink="/usuarios" class="btn btn-sm btn-link p-0 text-primary fw-bold">
              Ir a Usuarios <span class="fas fa-chevron-right fs--2 ms-1"></span>
            </a>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6 col-xxl-3" *ngIf="isAdminOrAuditorOrDirector()">
        <div class="card h-100 stat-card-hover border-subtle">
          <div class="card-body d-flex flex-column justify-content-between p-4">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-700 mb-2 text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 0.5px">Auditoría</h6>
                <h4 class="fw-bolder text-1100 mb-0">Bitácora de Eventos</h4>
              </div>
              <div class="d-flex align-items-center justify-content-center rounded-3 bg-info-subtle" style="width: 48px; height: 48px">
                <span class="fas fa-file-shield text-info fs-2"></span>
              </div>
            </div>
            <p class="mt-4 mb-3 text-600 small">Consultar logs de auditoría, acciones del personal y registros de accesos.</p>
            <a routerLink="/auditoria/logs" class="btn btn-sm btn-link p-0 text-info fw-bold">
              Ir a Bitácora <span class="fas fa-chevron-right fs--2 ms-1"></span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Seccion Consulta Bienestar Social -->
    <div class="row g-4 mb-4" *ngIf="isAdminOrDirector() || isOperativo()">
      <div class="col-12">
        <div class="card border border-subtle shadow-sm">
          <div class="card-header bg-body-tertiary border-bottom border-subtle py-3">
            <h5 class="mb-0">
              <span class="fas fa-search me-2 text-primary"></span>Consulta de Personal (Bienestar Social)
            </h5>
          </div>
          <div class="card-body p-4">
            <div class="row g-3 align-items-end mb-4">
              <div class="col-12 col-md-8 col-lg-6">
                <label class="form-label fs--1 fw-bold">Cédula de Identidad</label>
                <div class="d-flex gap-2">
                  <div class="input-group">
                    <span class="input-group-text"><span class="fas fa-id-card text-500"></span></span>
                    <input type="text" class="form-control" placeholder="Ej: 11.123.456" 
                           [(ngModel)]="cedulaBusqueda" (keyup.enter)="buscarFuncionario()">
                    <button class="btn btn-primary" (click)="buscarFuncionario()" [disabled]="isSearching || !cedulaBusqueda">
                      <span class="spinner-border spinner-border-sm me-1" [class.d-none]="!isSearching"></span>
                      <span class="fas fa-search" [class.d-none]="isSearching"></span> Consultar
                    </button>
                  </div>
                  <button class="btn btn-phoenix-secondary px-3" (click)="limpiarBusqueda()" 
                          [disabled]="isSearching || (!cedulaBusqueda && !searchResult)" title="Limpiar consulta">
                    <span class="fas fa-broom me-1"></span> Limpiar
                  </button>
                </div>
              </div>
            </div>

            <!-- Cargando -->
            <div class="text-center py-5" *ngIf="isSearching">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-3 mb-0 fw-bold text-700">Consultando base de datos de Bienestar Social...</p>
            </div>

            <!-- Sin resultados / Error -->
            <div class="alert alert-subtle alert-warning d-flex align-items-center" *ngIf="searchResult === 'not_found' && !isSearching">
              <span class="fas fa-triangle-exclamation fs-1 me-2"></span>
              <div>No se encontró información para la cédula ingresada en Bienestar Social o hubo un fallo de conexión.</div>
            </div>

            <!-- Resultados -->
            <div class="row g-4" *ngIf="searchResult && searchResult !== 'not_found' && !isSearching">
              <!-- Datos del Titular -->
              <div class="col-12 col-lg-6">
                <h6 class="border-bottom pb-2 mb-3 text-uppercase fw-bold text-900">
                  <span class="fas fa-user-tie me-2 text-primary"></span>Datos del Funcionario
                </h6>
                <div class="table-responsive">
                  <table class="table table-sm table-borderless fs--1 mb-0">
                    <tbody>
                      <tr>
                        <td class="fw-bold text-800" style="width: 35%;">Nombres y Apellidos:</td>
                        <td class="text-700">{{ searchResult.nombres_titular }} {{ searchResult.apellidos_titular }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-800">Cédula:</td>
                        <td class="text-700">{{ formatCedula(searchResult.cedula) }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-800">Cargo:</td>
                        <td class="text-700">{{ searchResult.cargo || searchResult.cargo_descripcion || 'N/A' }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-800">Dependencia:</td>
                        <td class="text-700">{{ searchResult.dependencia }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-800">Correo:</td>
                        <td class="text-700">{{ searchResult.correo_electronico || 'No registrado' }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-800">Teléfono:</td>
                        <td class="text-700">{{ searchResult.telefono_principal || 'No registrado' }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold text-800">Estado Laboral:</td>
                        <td>
                          <span class="badge badge-phoenix badge-phoenix-success text-uppercase fs--2">{{ searchResult.status }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Cargas Familiares -->
              <div class="col-12 col-lg-6">
                <h6 class="border-bottom pb-2 mb-3 text-uppercase fw-bold text-900">
                  <span class="fas fa-users me-2 text-primary"></span>Cargas Familiares Asociadas
                </h6>
                <div class="alert alert-subtle alert-info fs--1 py-2 px-3 mb-0" *ngIf="!searchResult.cargas_familiares || searchResult.cargas_familiares.length === 0">
                  El titular no posee cargas familiares registradas.
                </div>
                <div class="table-responsive scrollbar" *ngIf="searchResult.cargas_familiares && searchResult.cargas_familiares.length > 0">
                  <table class="table table-sm fs--1 mb-0 border-top border-translucent">
                    <thead>
                      <tr class="bg-body-secondary">
                        <th>Cédula</th>
                        <th>Nombres y Apellidos</th>
                        <th>Parentesco</th>
                        <th>Sexo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let c of searchResult.cargas_familiares">
                        <td class="fw-bold text-body-emphasis align-middle">
                          {{ formatCedula(c.cedula_beneficiario || c.cedula || c.cedula_familiar) }}
                        </td>
                        <td class="text-body-highlight align-middle">{{ c.nombres_familiar || c.nombres }} {{ c.apellidos_familiar || c.apellidos }}</td>
                        <td class="align-middle">
                          <span class="badge badge-phoenix badge-phoenix-primary fs--2 text-uppercase">{{ c.parentesco }}</span>
                        </td>
                        <td class="text-uppercase text-center align-middle">{{ c.sexo || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .stat-card-hover {
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .stat-card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
      }
      .max-w-500 {
        max-width: 500px;
      }
    `
  ]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  cedulaBusqueda: string = '';
  searchResult: any = null;
  isSearching = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.cdr.detectChanges();
    });
  }

  isAdminOrDirector(): boolean {
    const rol = this.currentUser?.rol?.toUpperCase();
    return rol === 'ADMINISTRADOR' || rol === 'DIRECTOR';
  }

  isOperativo(): boolean {
    const rol = this.currentUser?.rol?.toUpperCase();
    return rol === 'OPERATIVO';
  }

  isAdminOrAuditorOrDirector(): boolean {
    const rol = this.currentUser?.rol?.toUpperCase();
    return rol === 'ADMINISTRADOR' || rol === 'DIRECTOR' || rol === 'AUDITOR';
  }

  buscarFuncionario(): void {
    if (!this.cedulaBusqueda) return;
    this.isSearching = true;
    this.searchResult = null;
    this.cdr.detectChanges();

    const cleanCedula = this.cedulaBusqueda.replace(/\D/g, '');
    this.http.get<any>(`${environment.apiUrl}/bienestar/${cleanCedula}/`).subscribe({
      next: (res) => {
        this.searchResult = res;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.searchResult = 'not_found';
        this.isSearching = false;
        this.cdr.detectChanges();
      }
    });
  }

  limpiarBusqueda(): void {
    this.cedulaBusqueda = '';
    this.searchResult = null;
    this.cdr.detectChanges();
  }

  formatCedula(cedula: any): string {
    if (!cedula) return '';
    const numStr = cedula.toString().replace(/\D/g, '');
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}
