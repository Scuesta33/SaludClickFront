import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field'; // Import MatFormFieldModule
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule
import { MatSelectModule } from '@angular/material/select'; // Import MatSelectModule
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, FormsModule, HttpClientModule], // Import MatFormFieldModule
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent { 
  constructor(private userService: UserService, private snack:MatSnackBar) {}

  onSubmit(signupForm: NgForm) {
    const formData = {
      nombre: signupForm.value.nombre,
      email: signupForm.value.email,
      contrasena: signupForm.value.contrasena,
      telefono: signupForm.value.telefono,
      direccion: signupForm.value.direccion,
      activo: true,
      rol: signupForm.value.rol
    };

    this.userService.añadirUsuario(formData).subscribe(
      (data) => {
        console.log(data);
        Swal.fire({
          icon: 'success',
          title: 'Usuario añadido con éxito',
          showConfirmButton: true,
          timer: 3000
        });
      },
      (error) => {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error al añadir usuario',
          showConfirmButton: true,
          timer: 3000
        });
      }
    );
  }
}