import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baserUrl from './helper';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient: HttpClient) { }
 
  public añadirUsuario(user:any) : Observable<any> {
    return this.httpClient.post(`${baserUrl}/usuarios/registrar`, user);
}
}
