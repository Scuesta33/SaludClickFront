import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(loginForm: NgForm) {
    const formData = {
      email: loginForm.value.email,
      contrasena: loginForm.value.contrasena
    };

    this.authService.login(formData).subscribe(
      (response: any) => {
        console.log(response);
        localStorage.setItem('token', response.token);
        localStorage.setItem('userRole', response.rol); // Almacena el rol del usuario
        Swal.fire({
          icon: 'success',
          title: 'Inicio de sesión exitoso',
          showConfirmButton: true,
          timer: 3000
        }).then(() => {
          if (response.rol === 'MEDICO') {
            this.router.navigate(['/dashboard-medico']);
          } else if (response.rol === 'PACIENTE') {
            this.router.navigate(['/dashboard-paciente']);
          } else {
            Swal.fire('Error', 'Rol de usuario no reconocido', 'error');
          }
        });
      },
      (error) => {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error al iniciar sesión',
          showConfirmButton: true,
          timer: 3000
        });
      }
    );
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}