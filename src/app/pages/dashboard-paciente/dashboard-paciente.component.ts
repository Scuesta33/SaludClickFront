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
import { MatSnackBar } from '@angular/material/snack-bar';
import baseUrl from '../../services/helper';

interface Usuario {
  idUsuario: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
}
interface Cita {
  id: number;
  fecha: string;
  estado: string;
  medicoNombre: string;
}
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
  horarios: any[] = [];
  notifications: string[] = [];
  displayedColumns: string[] = ['id', 'fecha', 'hora', 'estado', 'medicoNombre'];
  displayedColumnsHorarios: string[] = ['medicoNombre', 'diaSemana', 'horaInicio', 'horaFin'];
  editMode: boolean = false;

  // ...existing code...
constructor(
  @Inject(PLATFORM_ID) private platformId: Object,
  private router: Router,
  private fb: FormBuilder,
  private http: HttpClient,
  private snackBar: MatSnackBar
) {
  this.isScreenSmall = isPlatformBrowser(this.platformId) ? window.innerWidth < 768 : false;
  this.citaForm = this.fb.group({
    fecha: [''],
    hora: [''],
    estado: ['PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA'],
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
    id: [''], // Asegúrate de que el control 'id' esté definido aquí
    nombre: [''],
    email: [''],
    telefono: [''],
    contrasena: [''],
    rol: ['']
  });

  if (isPlatformBrowser(this.platformId)) {
    this.getUsuarioData();
    this.getCitas();
  }
}
// ...existing code...

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
  // ...existing code...

onSubmit() {
  const citaData = this.citaForm.value;
  const fechaHora = new Date(citaData.fecha);
  const [hours, minutes] = citaData.hora.split(':');
  fechaHora.setHours(hours, minutes);

  const cita = {
    fecha: fechaHora.toISOString(), // Ensure this is in the correct format
    estado: citaData.estado, // Ensure this matches the EstadoCita enum in the backend
    medicoNombre: citaData.medicoNombre // Ensure this is the email of the doctor
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
      this.notifications.push('Cita creada');
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

// ...existing code...
 
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
        this.notifications.push('Cita modificada');
        if (cita.estado === 'CANCELADA') {
          this.http.delete(`${baseUrl}/citas/${cita.id}`, { headers }).subscribe(deleteResponse => {
            console.log('Cita eliminada:', deleteResponse);
            this.notifications.push('Cita eliminada');
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

  // ...existing code...
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
// ...existing code...
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
    this.router.navigate(['/login']);
  }
}