import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import baserUrl from './helper';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 

  constructor(private httpClient: HttpClient) {}

  public login(credentials: any): Observable<any> {
    return this.httpClient.post(`${baserUrl}/auth/login`, credentials);
  }
}