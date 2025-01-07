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
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import baseUrl from '../../services/helper';
import { AuthService } from '../../services/auth.service';

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
    MatButtonModule,
    MatTableModule,
    MatCardModule,
    
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
  usuarioForm: FormGroup;
  citas: any[] = [];
  displayedColumns: string[] = ['fecha', 'hora', 'estado', 'medicoNombre'];
  editMode: boolean = false;

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
    this.usuarioForm = this.fb.group({
      nombre: [''],
      email: [''],
      telefono: [''],
      password: [''],
      rol: ['']
    });

    if (isPlatformBrowser(this.platformId)) {
      this.getUsuarioData();
      this.getCitas();
    }
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

    this.http.post(`${baseUrl}/citas/crear`, cita).subscribe(response => {
      console.log('Cita creada:', response);
      this.getCitas(); // Actualizar la lista de citas después de crear una nueva
    }, error => {
      console.error('Error al crear la cita:', error);
      if (error.status === 0) {
        console.error('El backend no está activado.');
      }
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

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.put(`${baseUrl}/citas/${cita.id}`, cita, { headers }).subscribe(response => {
        console.log('Cita modificada:', response);
        if (cita.estado === 'CANCELADA') {
          this.http.delete(`${baseUrl}/citas/${cita.id}`, { headers }).subscribe(deleteResponse => {
            console.log('Cita eliminada:', deleteResponse);
            this.getCitas(); // Actualizar la lista de citas después de eliminar una cita
          }, deleteError => {
            console.error('Error al eliminar la cita:', deleteError);
            if (deleteError.status === 0) {
              console.error('El backend no está activado.');
            }
          });
        } else {
          this.getCitas(); // Actualizar la lista de citas después de modificar una cita
        }
      }, error => {
        console.error('Error al modificar la cita:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      });
    }
  }

  getCitas() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.get(`${baseUrl}/citas`, { headers }).subscribe((data: any) => {
        this.citas = data;
      }, error => {
        console.error('Error al obtener las citas:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      });
    }
  }

  getUsuarioData() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.get(`${baseUrl}/usuarios/datos`, { headers }).subscribe((data: any) => {
        this.usuarioForm.patchValue({
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
          rol: data.rol
        });
      }, error => {
        console.error('Error al obtener los datos del usuario:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      });
    }
  }

  onUsuarioSubmit() {
    const usuarioData = this.usuarioForm.value;
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.patch(`${baseUrl}/usuarios/actualizar`, usuarioData, { headers }).subscribe(response => {
        console.log('Datos del usuario actualizados:', response);
        this.editMode = false;
      }, error => {
        console.error('Error al actualizar los datos del usuario:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      });
    }
  }

  onEliminarUsuario() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.delete(`${baseUrl}/usuarios/eliminar`, { headers }).subscribe(response => {
        console.log('Usuario eliminado:', response);
        this.logout();
      }, error => {
        console.error('Error al eliminar el usuario:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      });
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    }
    this.router.navigate(['/login']);
  }
}