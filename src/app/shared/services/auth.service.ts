import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from } from 'rxjs';

type SignIn = {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: AngularFireAuth) { }

  signIn(params: SignIn): Observable<any>{
    return from(this.auth.signInWithEmailAndPassword(
      params.email, params.password
    ))
  }

  forgotPassword(email:string): Observable<void>{
    return from(this.auth.sendPasswordResetEmail(email))
  }

  signOut(){
    return from(this.auth.signOut());
  }
}
