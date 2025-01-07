import { Component, Inject, PLATFORM_ID, HostListener, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import baseUrl from '../../services/helper';

@Component({
  selector: 'app-dashboard-medico',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './dashboard-medico.component.html',
  styleUrls: ['./dashboard-medico.component.css']
})
export class DashboardMedicoComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  activeSection: string = 'crear-disponibilidades';
  isScreenSmall: boolean;
  disponibilidadForm: FormGroup;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router, private fb: FormBuilder, private http: HttpClient) {
    this.isScreenSmall = isPlatformBrowser(this.platformId) ? window.innerWidth < 768 : false;
    this.disponibilidadForm = this.fb.group({
      diaSemana: [''],
      horaInicio: [''],
      horaFin: ['']
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (isPlatformBrowser(this.platformId)) {
      this.isScreenSmall = event.target.innerWidth < 768;
    }
  }

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  closeSidenavIfSmall() {
    if (this.isScreenSmall && this.sidenav) {
      this.sidenav.close();
    }
  }

  onSubmitDisponibilidad() {
    const disponibilidadData = this.disponibilidadForm.value;
    this.http.post(`${baseUrl}/disponibilidades/crear`, disponibilidadData).subscribe(response => {
      console.log('Disponibilidad creada:', response);
      // Aquí puedes agregar lógica adicional, como actualizar una lista de disponibilidades
    }, error => {
      console.error('Error al crear la disponibilidad:', error);
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['']);
  }
}