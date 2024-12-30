import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {MatInputModule} from '@angular/material/input';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from './components/navbar/navbar.component'; 
import { SignupComponent } from './pages/signup/signup.component'; // Corrected path
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http'; // Import HttpClientModule y withFetch
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { HomeComponent } from './pages/home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatButtonModule,
    MatFormFieldModule, // Import MatFormFieldModule
    NavbarComponent, // Import standalone component
    SignupComponent,
    MatInputModule,// Import standalone component
    HttpClientModule, // Import HttpClientModule
    MatSnackBarModule
  ],
  providers: [
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add this line
  bootstrap: [AppComponent]
})
export class AppModule { }