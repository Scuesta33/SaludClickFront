import { Component, Inject, PLATFORM_ID, HostListener, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import baseUrl from '../../services/helper';
import { MatButtonModule } from '@angular/material/button';


interface Usuario {
  idUsuario: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
}

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
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule
  ],
  templateUrl: './dashboard-medico.component.html',
  styleUrls: ['./dashboard-medico.component.css']
})
export class DashboardMedicoComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  activeSection: string = 'crear-disponibilidades';
  isScreenSmall: boolean;
  disponibilidadForm: FormGroup;
  modificarCitaForm: FormGroup;
  usuarioForm: FormGroup;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  citas: any[] = [];
  consultas: any[] = [];
  disponibilidades: any[] = [];
  displayedColumnsDisponibilidades: string[] = ['diaSemana', 'horaInicio', 'horaFin', 'acciones'];
  notifications: string[] = [];
  displayedColumnsConsultas: string[] = ['id', 'fecha', 'hora', 'estado', 'pacienteNombre', 'acciones'];
  editMode: boolean = false;
  notificacionForm: FormGroup;


  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.isScreenSmall = isPlatformBrowser(this.platformId) ? window.innerWidth < 768 : false;
    this.disponibilidadForm = this.fb.group({
      diaSemana: [''],
      horaInicio: [''],
      horaFin: ['']
    });
    this.modificarCitaForm = this.fb.group({
      id: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      estado: ['', Validators.required]
    });
    this.usuarioForm = this.fb.group({
      id: [''],
      nombre: [''],
      email: [''],
      telefono: [''],
      contrasena: [''],
      rol: ['']
    });
    this.notificacionForm = this.fb.group({
      tipoNotificacion: ['', Validators.required],
      mensaje: ['', Validators.required],
      destinatarioNombre: ['', Validators.required]
    });

    if (isPlatformBrowser(this.platformId)) {
      this.getUsuarioData();
      this.getCitas();
      this.getConsultas();
      this.getDisponibilidades();
      this.getNotificaciones();
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

  onSubmitDisponibilidad() {
    const disponibilidadData = [this.disponibilidadForm.value]; // Enviar como lista
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (!token) {
        this.snackBar.open('No se encontró el token de autenticación', 'Cerrar', {
          duration: 3000,
        });
        return;
      }
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
      this.http.post(`${baseUrl}/disponibilidad/crear`, disponibilidadData, { headers }).subscribe(response => {
        console.log('Disponibilidad creada:', response);
        this.notifications.push('Disponibilidad creada');
      }, error => {
        console.error('Error al crear la disponibilidad:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        } else if (error.status === 403) {
          console.error('No tienes permiso para realizar esta acción.');
          this.snackBar.open('No tienes permiso para realizar esta acción.', 'Cerrar', {
            duration: 3000,
          });
        }
      });
    }
  }
  enviarNotificacion() {
    const notificacionData = this.notificacionForm.value;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const params = {
      tipoNotificacion: notificacionData.tipoNotificacion,
      estado: 'PENDIENTE', // Estado predeterminado
      mensaje: notificacionData.mensaje,
      destinatarioNombre: notificacionData.destinatarioNombre
    };
    this.http.post(`${baseUrl}/notificaciones/enviar`, null, { headers, params }).subscribe(
      (response) => {
        console.log('Notificación enviada:', response);
        this.notifications.push(JSON.stringify(response));
      },
      (error) => {
        console.error('Error al enviar la notificación:', error);
      }
    );
  }

  getNotificaciones() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(`${baseUrl}/notificaciones/destinatario`, { headers }).subscribe(
      (data) => {
        this.notifications = data;
      },
      (error) => {
        console.error('Error al obtener notificaciones:', error);
      }
    );
  }

  getDisponibilidades() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.snackBar.open('No se encontró el token de autenticación', 'Cerrar', {
        duration: 3000,
      });
      return;
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any[]>(`${baseUrl}/disponibilidad/medico`, { headers }).subscribe(
      (data) => {
        this.disponibilidades = data;
      },
      (error) => {
        console.error('Error al obtener las disponibilidades:', error);
        if (error.status === 403) {
          this.snackBar.open('No tienes permiso para realizar esta acción.', 'Cerrar', {
            duration: 3000,
          });
        }
      }
    );
  }

  eliminarDisponibilidad(idDisponibilidad: number): void {
    if (idDisponibilidad === undefined || idDisponibilidad === null) {
      console.error('ID de disponibilidad no válido:', idDisponibilidad);
      this.snackBar.open('ID de disponibilidad no válido', 'Cerrar', {
        duration: 3000,
      });
      return;
    }
  
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`${baseUrl}/disponibilidad/${idDisponibilidad}`, { headers }).subscribe(
      (response) => {
        console.log('Disponibilidad eliminada:', response);
        this.snackBar.open('Disponibilidad eliminada', 'Cerrar', {
          duration: 3000,
        });
        this.getDisponibilidades(); 
      },
      (error) => {
        console.error('Error al eliminar la disponibilidad:', error);
        if (error.status === 403) {
          this.snackBar.open('No tienes permiso para realizar esta acción.', 'Cerrar', {
            duration: 3000,
          });
        } else {
          this.snackBar.open('Error al eliminar la disponibilidad', 'Cerrar', {
            duration: 3000,
          });
        }
      }
    );
  }


  onModificarSubmit() {
    if (this.modificarCitaForm.valid) {
      const citaData = this.modificarCitaForm.value;
      const fechaHora = new Date(citaData.fecha);
      const [hours, minutes] = citaData.hora.split(':');
      fechaHora.setHours(hours, minutes);
  
      const cita = {
        id: citaData.id,
        fecha: fechaHora.toISOString(),
        estado: citaData.estado 
      };
  
      if (isPlatformBrowser(this.platformId)) {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
        this.http.put(`${baseUrl}/citas/${cita.id}`, cita, { headers }).subscribe(response => {
          console.log('Cita modificada:', response);
          this.notifications.push('Cita modificada');
          this.getCitas();
          this.getConsultas();
        }, error => {
          console.error('Error al modificar la cita:', error);
          if (error.status === 0) {
            console.error('El backend no está activado.');
          }
        });
      }
    }
  }
  aceptarCita(id: string) {
    this.actualizarEstadoCita(id, 'ACEPTADA');
  }

  rechazarCita(id: string) {
    this.actualizarEstadoCita(id, 'RECHAZADA');
  }
  private actualizarEstadoCita(id: string, estado: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${baseUrl}/citas/${id}`;
    const body = { estado };
  
    this.http.put(url, body, { headers }).subscribe(
      response => {
        console.log(`Cita ${estado.toLowerCase()} correctamente:`, response);
        this.notifications.push(`Cita ${estado.toLowerCase()}`);
        this.getCitas();
        this.getConsultas();
      },
      error => {
        console.error(`Error al ${estado.toLowerCase()} la cita:`, error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      }
    );
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

  getConsultas() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.get(`${baseUrl}/citas/consultas`, { headers }).subscribe((data: any) => {
        this.consultas = data.map((consulta: any) => {
          return {
            ...consulta,
            hora: new Date(consulta.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pacienteNombre: consulta.pacienteNombre || 'Desconocido'
          };
        });
      }, error => {
        console.error('Error al obtener las consultas:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      });
    }
  }

  getUsuarioData() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get<Usuario>(`${baseUrl}/usuarios/datos`, { headers }).subscribe(usuario => {
      this.usuarioForm.patchValue({
        id: usuario.idUsuario, // Asegúrate de asignar el ID del usuario aquí
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        contrasena: '', // No cargar la contraseña
        rol: usuario.rol
      });
    }, error => {
      console.error('Error al obtener los datos del usuario:', error);
    });
  }

  onUsuarioSubmit() {
    const usuarioData = { ...this.usuarioForm.value };
    delete usuarioData.id; // Excluir el campo 'id'
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
      this.http.patch(`${baseUrl}/usuarios/actualizar`, usuarioData, { headers }).subscribe(response => {
        console.log('Datos del usuario actualizados:', response);
        this.notifications.push('Datos del usuario actualizados');
        this.editMode = false;
  
        // Redirigir al dashboard correspondiente según el rol actualizado
        if (usuarioData.rol === 'MEDICO') {
          this.router.navigate(['/dashboard-medico']);
        } else if (usuarioData.rol === 'PACIENTE') {
          this.router.navigate(['/dashboard-paciente']);
        }
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
      const idControl = this.usuarioForm.get('id');
  
      if (idControl && idControl.value) {
        const idUsuario = idControl.value;
  
        this.http.delete(`${baseUrl}/usuarios/eliminar/${idUsuario}`, { headers, responseType: 'json' }).subscribe(response => {
          console.log('Usuario eliminado:', response);
          this.notifications.push('Usuario eliminado');
          this.router.navigate(['/login']); // Redirigir al login después de eliminar el usuario
        }, error => {
          console.error('Error al eliminar el usuario:', error);
          if (error.status === 0) {
            console.error('El backend no está activado.');
          }
        });
      } else {
        console.error('El control de ID del usuario es nulo o no tiene valor.');
      }
    }
  }

  showNotifications() {
    if (this.notifications.length > 0) {
      this.notifications.forEach(notification => {
        this.snackBar.open(notification, 'Cerrar', {
          duration: 3000,
        });
      });
      this.notifications = [];
    } else {
      this.snackBar.open('No hay notificaciones nuevas', 'Cerrar', {
        duration: 3000,
      });
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    }
    this.router.navigate(['']);
  }
}