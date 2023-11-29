import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = "http://localhost:3000/reg";
  constructor() { }

  getUser(email: string, password: string){
    const url = `${this.baseUrl}/getuser`;
    const params = {email, password};

    return new Observable(observer => {
      axios.get(url, {params})
      .then(res => {
        observer.next(res.data);
        observer.complete();
      })
      .catch(error => {
        observer.error(error);
      })
    })
  }
}
