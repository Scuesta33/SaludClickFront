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

interface Notification {
  idNotificacion: number;
  asunto: string;
  mensaje: string;
  fechaEnvio: Date;
  usuario: { nombre: string };
}
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
  activeSection: string = 'crear-disponibilidades';// sección activa por defecto
  isScreenSmall: boolean;//indica si la pantalla es pequeña
  disponibilidadForm: FormGroup;
  modificarCitaForm: FormGroup;
  usuarioForm: FormGroup;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']; 
  citas: any[] = [];
  consultas: any[] = [];
  disponibilidades: any[] = [];
  mostrarDisponibilidades: string[] = ['diaSemana', 'horaInicio', 'horaFin', 'acciones'];
  columnaNotificaciones: string[] = ['asunto', 'mensaje', 'remitente', 'fecha', 'acciones'];
  notificacion: string[] = [];
  notificacionNueva: Notification[] = [];
  mostrarConsultas: string[] = ['id', 'fecha', 'hora', 'estado', 'pacienteNombre', 'acciones'];
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
      asunto: ['', Validators.required],
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
  //método para ajustar la pantalla cuando cambia el tamaño
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (isPlatformBrowser(this.platformId)) {
      this.isScreenSmall = event.target.innerWidth < 768;
    }
  }
  //para cambiar la sección activa
  setActiveSection(section: string) {
    this.activeSection = section;
  }
  //para cerrar el sidenav si la pantalla es pequeña
  closeSidenavIfSmall() {
    if (this.isScreenSmall && this.sidenav) {
      this.sidenav.close();
    }
  }
  
  crearDisponibilidad() {
    const disponibilidadData = [this.disponibilidadForm.value]; 
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (!token) {
        this.snackBar.open('no se encontró de autenticación :(', 'Cerrar', {
          duration: 3000,
        });
        return;
      }
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); //configura las cabeceras
      this.http.post(`${baseUrl}/disponibilidad/crear`, disponibilidadData, { headers }).subscribe(response => {
        console.log('Disponibilidad creada:', response);
        this.notificacion.push('Disponibilidad creada :)');
      }, error => {
        console.error('error al crear la disponibilidad:', error);
        if (error.status === 0) {
          console.error('el backend no está activado, arráncalo :)');
        } else if (error.status === 403) {
          console.error('no puedes realizar esta acción :(');
          this.snackBar.open('no puedes realizar esta acción :(', 'Cerrar', {
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
      asunto: notificacionData.asunto,
      estado: 'PENDIENTE', // Estado predeterminado
      mensaje: notificacionData.mensaje,
      destinatarioNombre: notificacionData.destinatarioNombre
    };
    this.http.post(`${baseUrl}/notificaciones/enviar`, null, { headers, params }).subscribe(
      (response) => {
        console.log('notificación enviada:', response);
        this.snackBar.open('notificación enviada :)', 'Cerrar', {
          duration: 3000,
        });
      },
      (error) => {
        console.error('error al enviar la notificación:', error);
      }
    );
  }
  revisarNuevasNotificaciones() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(`${baseUrl}/notificaciones/destinatario`, { headers }).subscribe(
      (data) => {
        if (data && data.length > 0) {
          this.notificacion.push('has recibido una nueva notificación :)');
          this.mostrarNotificaciones(); 
        }
      },
      (error) => {
        console.error('error al obtener notificaciones:', error);
      }
    );
  }
  getNotificaciones() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<Notification[]>(`${baseUrl}/notificaciones/destinatario`, { headers }).subscribe(
      (data) => {
        this.notificacionNueva = data;
      },
      (error) => {
        console.error('error al obtener notificaciones:', error);
      }
    );
  }
  deleteNotificacion(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`${baseUrl}/notificaciones/eliminar/${id}`, { headers }).subscribe(
      () => {
        this.notificacionNueva = this.notificacionNueva.filter(notification => notification.idNotificacion !== id);
        this.snackBar.open('notificación eliminada', 'Cerrar', {
          duration: 3000,
        });
      },
      (error) => {
        console.error('error al eliminar la notificación:', error);
      }
    );
  }

  getDisponibilidades() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.snackBar.open('no se encontró el token :(', 'Cerrar', {
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
        console.error('error al obtener las disponibilidades:', error);
        if (error.status === 403) {
          this.snackBar.open('no puedes realizar esta acción :(', 'Cerrar', {
            duration: 3000,
          });
        }
      }
    );
  }
  deleteDisponibilidad(idDisponibilidad: number): void {
    if (idDisponibilidad === undefined || idDisponibilidad === null) {
      console.error('ID de disponibilidad no válido:', idDisponibilidad);
      this.snackBar.open('ID de disponibilidad no válido :(', 'Cerrar', {
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
        console.error('error al eliminar la disponibilidad:', error);
        if (error.status === 403) {
          this.snackBar.open('no puedes realizar esta accion :(', 'Cerrar', {
            duration: 3000,
          });
        } else {
          this.snackBar.open('error al eliminar la disponibilidad :(', 'Cerrar', {
            duration: 3000,
          });
        }
      }
    );
  }

  modificarCitas() {
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
          console.log('cita modificada:', response);
          this.notificacion.push('cita modificada');
          this.getCitas();
          this.getConsultas();
        }, error => {
          console.error('error al modificar la cita:', error);
          if (error.status === 0) {
            console.error('el backend no está activado, arráncalo :)');
          }
        });
      }
    }
  }
  deleteCita(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`${baseUrl}/citas/${id}`, { headers }).subscribe(
      () => {
        this.snackBar.open('Cita eliminada', 'Cerrar', {
          duration: 3000,
        });
        this.getCitas(); // Actualiza la lista de citas después de eliminar una
      },
      (error) => {
        console.error('error al eliminar la cita:', error);
        this.snackBar.open('error al eliminar la cita', 'Cerrar', {
          duration: 3000,
        });
      }
    );
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
        this.notificacion.push(`Cita ${estado.toLowerCase()}`);
        this.getCitas();
        this.getConsultas();
      },
      error => {
        console.error(`Error al ${estado.toLowerCase()} la cita:`, error);
        if (error.status === 0) {
          console.error('el backend no está activado, arráncalo :)');
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
        console.error('error al obtener las citas:', error);
        if (error.status === 0) {
          console.error('el backend no está activado, arráncalo :)');
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
        console.error('error al obtener las consultas:', error);
        if (error.status === 0) {
          console.error('el backend no está activado, arráncalo :)');
        }
      });
    }
  }
  getUsuarioData() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<Usuario>(`${baseUrl}/usuarios/datos`, { headers }).subscribe(usuario => {
      this.usuarioForm.patchValue({
        id: usuario.idUsuario, 
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        contrasena: '', 
        rol: usuario.rol
      });
    }, error => {
      console.error('error al obtener los datos del usuario:', error);
    });
  }
  actualizarUsuario() {
    const usuarioData = { ...this.usuarioForm.value };
    delete usuarioData.id;
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.patch(`${baseUrl}/usuarios/actualizar`, usuarioData, { headers }).subscribe(response => {
        console.log('Datos del usuario actualizados:', response);
        this.notificacion.push('Datos del usuario actualizados');
        this.editMode = false;

        // redirigir al dashboard correspondiente según el rol actualizado
        if (usuarioData.rol === 'MEDICO') {
          this.router.navigate(['/dashboard-medico']);
        } else if (usuarioData.rol === 'PACIENTE') {
          this.router.navigate(['/dashboard-paciente']);
        }
      }, error => {
        console.error('error al actualizar los datos del usuario:', error);
        if (error.status === 0) {
          console.error('el backend no está activado, arráncalo :)');
        }
      });
    }
  }
  deleteUsuario() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const idControl = this.usuarioForm.get('id');

      if (idControl && idControl.value) {
        const idUsuario = idControl.value;
        this.http.delete(`${baseUrl}/usuarios/eliminar/${idUsuario}`, { headers, responseType: 'json' }).subscribe(response => {
          console.log('Usuario eliminado:', response);
          this.notificacion.push('Usuario eliminado');
          this.router.navigate(['/login']); // redirigir al login después de eliminar el usuario
        }, error => {
          console.error('error al eliminar el usuario:', error);
          if (error.status === 0) {
            console.error('el backend no está activado, arráncalo :)');
          }
        });
      } else {
        console.error('ID de usuario no válido');
      }
    }
  }
  mostrarNotificaciones() {
    if (this.notificacion.length > 0) {
      // Mostrar la notificación de que se ha recibido una nueva notificación
      this.snackBar.open(this.notificacion[0], 'Cerrar', {
        duration: 3000, // 3 segundos
      });
      this.notificacion = [];
    } else {

      this.snackBar.open('No hay notificaciones nuevas', 'Cerrar', {
        duration: 3000,
      });
    }
  }
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token'); // se elimina el token
      localStorage.removeItem('userRole');
    }
    this.router.navigate(['']);
  }
}