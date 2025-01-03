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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard-paciente',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  templateUrl: './dashboard-paciente.component.html',
  styleUrls: ['./dashboard-paciente.component.css']
})
export class DashboardPacienteComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  activeSection: string = 'horarios';
  isScreenSmall: boolean;
  citaForm: FormGroup;
  modificarCitaForm: FormGroup;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router, private fb: FormBuilder, private http: HttpClient) {
    this.isScreenSmall = isPlatformBrowser(this.platformId) ? window.innerWidth < 768 : false;
    this.citaForm = this.fb.group({
      fecha: [''],
      hora: [''],
      estado: [''],
      medicoNombre: ['']
    });
    this.modificarCitaForm = this.fb.group({
      id: [''],
      fecha: [''],
      hora: [''],
      estado: [''],
      medicoNombre: ['']
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

  onSubmit() {
    const citaData = this.citaForm.value;
    const fechaHora = new Date(citaData.fecha);
    const [hours, minutes] = citaData.hora.split(':');
    fechaHora.setHours(hours, minutes);

    const cita = {
      fecha: fechaHora.toISOString(),
      estado: citaData.estado,
      medicoNombre: citaData.medicoNombre
    };

    this.http.post('http://localhost:8080/citas/crear', cita).subscribe(response => {
      console.log('Cita creada:', response);
    }, error => {
      console.error('Error al crear la cita:', error);
    });
  }

  onModificarSubmit() {
    const citaData = this.modificarCitaForm.value;
    const fechaHora = new Date(citaData.fecha);
    const [hours, minutes] = citaData.hora.split(':');
    fechaHora.setHours(hours, minutes);

    const cita = {
      id: citaData.id,
      fecha: fechaHora.toISOString(),
      estado: citaData.estado,
      medicoNombre: citaData.medicoNombre
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.put(`http://localhost:8080/citas/${cita.id}`, cita, { headers }).subscribe(response => {
      console.log('Cita modificada:', response);
      if (cita.estado === 'CANCELADA') {
        this.http.delete(`http://localhost:8080/citas/${cita.id}`, { headers }).subscribe(deleteResponse => {
          console.log('Cita eliminada:', deleteResponse);
        }, deleteError => {
          console.error('Error al eliminar la cita:', deleteError);
        });
      }
    }, error => {
      console.error('Error al modificar la cita:', error);
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['']);
  }
}