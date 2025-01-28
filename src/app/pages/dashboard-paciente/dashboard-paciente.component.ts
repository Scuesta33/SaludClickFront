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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import baseUrl from '../../services/helper';

// interface para notificaciones
interface Notification {
  idNotificacion: number;
  asunto: string;
  mensaje: string;
  fechaEnvio: Date;
  usuario: { nombre: string };
}
// interface para usuario
interface Usuario {
  idUsuario: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
}

// interface para citas
interface Cita {
  id: number;
  fecha: string;
  estado: string;
  medicoNombre: string;
}
@Component({
  selector: 'app-dashboard-paciente',
  standalone: true, //indica que es un componente independiente
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
  styleUrls: ['./dashboard-paciente.component.css'],
  providers: [DatePipe]
})
export class DashboardPacienteComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  activeSection: string = 'horarios';//sección activa por defecto
  isScreenSmall: boolean;//indica si la pantalla es pequeña
  citaForm: FormGroup;         //formularios para crear citas, modificar citas, datos del usuario  
  modificarCitaForm: FormGroup;
  usuarioForm: FormGroup;
  citas: any[] = [];//arreglo para citas
  horarios: any[] = [];//arreglo para horarios
  notificacion: string[] = [];
  notificacionNueva: Notification[] = [];
  mostrarCitas: string[] = ['id', 'fecha', 'hora', 'estado', 'medicoNombre'];
  mostrarHorariosMedicos: string[] = ['medicoNombre', 'diaSemana', 'horaInicio', 'horaFin'];
  columnaNotificaciones: string[] = ['asunto', 'mensaje', 'remitente', 'fecha', 'acciones'];
  editMode: boolean = false;
  notificacionForm: FormGroup;


  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {
    this.isScreenSmall = isPlatformBrowser(this.platformId) ? window.innerWidth < 768 : false;
    this.citaForm = this.fb.group({
      fecha: [''],
      hora: [''],
      estado: ['PENDIENTE'],
      medicoNombre: ['']
    });
    this.modificarCitaForm = this.fb.group({
      id: [''],
      fecha: [''],
      hora: [''],
      estado: ['PENDIENTE'],
      medicoNombre: ['']
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
      this.getHorariosDisponibles();
      this.getNotificaciones();
    }
  }

//obtiene datos del usuario, citas, consultas, disponibilidades y notificaciones
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (isPlatformBrowser(this.platformId)) {
      this.isScreenSmall = event.target.innerWidth < 768;
    }
  }
//para cambiar sección activa
  setActiveSection(section: string) {
    this.activeSection = section;
  }
// se cierra el sidenav si la pantalla es pequeña
  closeSidenavIfSmall() {
    if (this.isScreenSmall && this.sidenav) {
      this.sidenav.close();
    }
  }


//traer horarios de médicos
  getHorariosDisponibles() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    
    this.http.get<any[]>(`${baseUrl}/disponibilidad/todas`, { headers }).subscribe(
      (data) => {
        console.log('Datos de horarios recibidos:', data); 
        
        this.horarios = data.map((horario) => ({
          ...horario,
          medicoNombre: horario.medico?.nombre || 'Sin médico asignado', 
          horaInicio: this.datePipe.transform(new Date(`1970-01-01T${horario.horaInicio}`), 'HH:mm'),
          horaFin: this.datePipe.transform(new Date(`1970-01-01T${horario.horaFin}`), 'HH:mm')
        }));
      },
      (error) => {
        console.error('Error al obtener los horarios:', error);
      }
    );
  }


//crear cita
  crearCitas() {
    const citaData = this.citaForm.value;
    const fechaHora = new Date(citaData.fecha);
    const [hours, minutes] = citaData.hora.split(':');
    fechaHora.setHours(hours, minutes);

    const cita = {
      fecha: fechaHora.toISOString(), 
      estado: citaData.estado, 
      medicoNombre: citaData.medicoNombre 
    };

    if (!cita.fecha || !cita.estado || !cita.medicoNombre) {
      console.error('Datos incompletos para crear la cita:', cita);
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.post(`${baseUrl}/citas/crear`, cita, { headers }).subscribe(response => {
        console.log('Cita creada:', response);
        this.notificacion.push('Cita creada');
        this.getCitas(); // Actualizar la lista de citas después de crear una nueva
      }, error => {
        console.error('Error al crear la cita:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        } else if (error.status === 400) {
          console.error('Solicitud incorrecta. Verifica los datos enviados:', cita);
          if (error.error) {
            console.error('Detalles del error:', error.error);
          }
        }
      });
    }
  }
//metodo para revisar notificaciones
  revisarNuevasNotificaciones() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`${baseUrl}/notificaciones/destinatario`, { headers }).subscribe(
      (data) => {
        if (data && data.length > 0) {
          this.notificacion.push('Has recibido una nueva notificación');
          this.mostrarNotificaciones(); // Mostrar la notificación una vez
        }
      },
      (error) => {
        console.error('Error al obtener notificaciones:', error);
      }
    );
  }
//obtener notificaciones
  getNotificaciones() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Notification[]>(`${baseUrl}/notificaciones/destinatario`, { headers }).subscribe(
      (data) => {
        this.notificacionNueva = data;
      },
      (error) => {
        console.error('Error al obtener notificaciones:', error);
      }
    );
  }
  //eliminar notificaciones
  deleteNotificacion(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`${baseUrl}/notificaciones/eliminar/${id}`, { headers }).subscribe(
      () => {
        this.notificacionNueva = this.notificacionNueva.filter(notification => notification.idNotificacion !== id);
        this.snackBar.open('Notificación eliminada', 'Cerrar', {
          duration: 3000,
        });
      },
      (error) => {
        console.error('Error al eliminar la notificación:', error);
      }
    );
  }
  //enviar notificaciones
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

//obtener citas del paciente
  getCitas() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.get<Cita[]>(`${baseUrl}/citas`, { headers }).subscribe((data: Cita[]) => {
        this.citas = data.map(cita => {
          return {
            ...cita,
            hora: new Date(cita.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            medicoNombre: cita.medicoNombre || 'Desconocido'
          };
        });
      }, error => {
        console.error('Error al obtener las citas:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      });
    }
  }

//modificar citas del paciente
  modificarCita() {
    if (this.modificarCitaForm.valid) {
      const formValue = this.modificarCitaForm.value;
      const fecha = new Date(formValue.fecha);
      const [hours, minutes] = formValue.hora.split(':');
      fecha.setHours(hours, minutes, 0, 0); // Asegúrate de establecer los segundos y milisegundos a 0

      const citaModificada = {
        id: formValue.id,
        fecha: fecha.toISOString(),
        estado: formValue.estado || 'PENDIENTE',
        medicoNombre: formValue.medicoNombre // El paciente no puede modificar el estado
      };

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.put(`${baseUrl}/citas/${formValue.id}`, citaModificada, { headers }).subscribe(response => {
        this.snackBar.open('Cita modificada correctamente', 'Cerrar', {
          duration: 3000,
        });
        this.getCitas();
      }, error => {
        console.error('Error al modificar la cita:', error);
        this.snackBar.open('Error al modificar la cita', 'Cerrar', {
          duration: 3000,
        });
      });
    }
  }
//eliminar citas del paciente
  eliminarCita(id: number) {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.delete(`${baseUrl}/citas/${id}`, { headers }).subscribe(response => {
        console.log('Cita eliminada:', response);
        this.notificacion.push('Cita eliminada');
        this.getCitas(); // Actualizar la lista de citas después de eliminar una cita
      }, error => {
        console.error('Error al eliminar la cita:', error);
        if (error.status === 0) {
          console.error('El backend no está activado.');
        }
      });
    }
  }
  //traer datos del usuario
  getUsuarioData() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Usuario>(`${baseUrl}/usuarios/datos`, { headers }).subscribe(usuario => {
      this.usuarioForm.patchValue({
        id: usuario.idUsuario, 
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        contrasena: '', // No cargar la contraseña para no mostrarla
        rol: usuario.rol
      });
    }, error => {
      console.error('Error al obtener los datos del usuario:', error);
    });
  }
  //actualizar datos del usuario
  actualizarUsuario() {
    const usuarioData = { ...this.usuarioForm.value };
    delete usuarioData.id; // Excluir el campo 'id'

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.patch(`${baseUrl}/usuarios/actualizar`, usuarioData, { headers }).subscribe(response => {
        console.log('Datos del usuario actualizados:', response);
        this.notificacion.push('Datos del usuario actualizados');
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

 //eliminar usuario
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
  //mostrar notificacionese
  mostrarNotificaciones() {
    if (this.notificacion.length > 0) {
      this.snackBar.open(this.notificacion[0], 'Cerrar', {
        duration: 3000, // Duración de 3 segundos
      });
      this.notificacion = []; // Limpiar las notificaciones después de mostrarlas
    } else {
      this.snackBar.open('No hay notificaciones nuevas', 'Cerrar', {
        duration: 3000,
      });
    }
  }
  //cerrar sesión y redirigir al home
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    }
    this.router.navigate(['/home']);
  }
}