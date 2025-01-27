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
//interface para notificaciones
interface Notification {
  idNotificacion: number;
  asunto: string;
  mensaje: string;
  fechaEnvio: Date;
  usuario: { nombre: string };
}
//interface para usuario
interface Usuario {
  idUsuario: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
}

@Component({
  selector: 'app-dashboard-medico',
  standalone: true, // indica que es un componente independiente
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
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']; // Días de la semana
  citas: any[] = [];
  consultas: any[] = [];
  disponibilidades: any[] = [];
  displayedColumnsDisponibilidades: string[] = ['diaSemana', 'horaInicio', 'horaFin', 'acciones'];//para visualizar disponinilidades
  displayedColumnsNotifications: string[] = ['asunto', 'mensaje', 'remitente', 'fecha', 'acciones'];//para visualizar notificaciones
  notifications: string[] = [];// lista de notificaciones
  notificationsNew: Notification[] = [];// lista de notificaciones nuevas
  displayedColumnsConsultas: string[] = ['id', 'fecha', 'hora', 'estado', 'pacienteNombre', 'acciones'];//para visualizar consultas
  editMode: boolean = false; // indica si se está editando el usuario
  notificacionForm: FormGroup; // Formulario para enviar notificaciones


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

    if (isPlatformBrowser(this.platformId)) {//obtiene datos del usuario, citas, consultas, disponibilidades y notificaciones
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
  //enviar el formulario de disponibilidad
  onSubmitDisponibilidad() {
    const disponibilidadData = [this.disponibilidadForm.value]; // Enviar como lista
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');//obtiene el token
      if (!token) {
        this.snackBar.open('No se encontró el token de autenticación', 'Cerrar', {
          duration: 3000,
        });
        return;
      }
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); //configura las cabeceras
    //realiza la petición post y maneja la respuesta
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
  // envía una notificación
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
        console.log('Notificación enviada:', response);
        this.snackBar.open('Notificación enviada', 'Cerrar', {
          duration: 3000,
        });
      },
      (error) => {
        console.error('Error al enviar la notificación:', error);
      }
    );
  }
  //verifica si hay nuevas notificaciones
  checkForNewNotifications() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`${baseUrl}/notificaciones/destinatario`, { headers }).subscribe(
      (data) => {
        if (data && data.length > 0) {
          this.notifications.push('Has recibido una nueva notificación');
          this.showNotifications(); // Muestra la notificación una vez
        }
      },
      (error) => {
        console.error('Error al obtener notificaciones:', error);
      }
    );
  }
//obtiene las notificaciones del backend
  getNotificaciones() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Notification[]>(`${baseUrl}/notificaciones/destinatario`, { headers }).subscribe(
      (data) => {
        this.notificationsNew = data;
      },
      (error) => {
        console.error('Error al obtener notificaciones:', error);
      }
    );
  }
  //elimina una notificación por id
  deleteNotification(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`${baseUrl}/notificaciones/eliminar/${id}`, { headers }).subscribe(
      () => {
        this.notificationsNew = this.notificationsNew.filter(notification => notification.idNotificacion !== id);
        this.snackBar.open('Notificación eliminada', 'Cerrar', {
          duration: 3000,
        });
      },
      (error) => {
        console.error('Error al eliminar la notificación:', error);
      }
    );
  }


//obtiene las disponibilidades del backend
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
//elimina una disponibilidad por id
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

//modifica una cita existente
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
  //método para aceptar una cita
  aceptarCita(id: string) {
    this.actualizarEstadoCita(id, 'ACEPTADA');
  }
//método para rechazar una cita
  rechazarCita(id: string) {
    this.actualizarEstadoCita(id, 'RECHAZADA');
  }

  //método para actualizar el estado de una cita
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
  //obtener las citas del backend
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
//obtener las consultas del backend
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
//obtener los datos del usuario
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
//método para actualizar datos de usuario
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
//método para eliminar un usuario
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
//método para mostrar notificaciones
  showNotifications() {
    if (this.notifications.length > 0) {
      // Mostrar la notificación de que se ha recibido una nueva notificación
      this.snackBar.open(this.notifications[0], 'Cerrar', {
        duration: 3000, // 3 segundos
      });
      this.notifications = []; 
    } else {
      
      this.snackBar.open('No hay notificaciones nuevas', 'Cerrar', {
        duration: 3000,
      });
    }
  }
//método para cerrar sesión
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    }
    this.router.navigate(['']);
  }
}