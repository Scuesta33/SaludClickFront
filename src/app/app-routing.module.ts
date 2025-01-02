import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SignupComponent } from './pages/signup/signup.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardMedicoComponent } from './pages/dashboard-medico/dashboard-medico.component';
import { DashboardPacienteComponent } from './pages/dashboard-paciente/dashboard-paciente.component'; 
const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },
  {
    path: 'signup',
    component: SignupComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'dashboard-medico',
    component: DashboardMedicoComponent,
    pathMatch: 'full'
  },
  {
    path: 'dashboard-paciente',
    component: DashboardPacienteComponent,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }