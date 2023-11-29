import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';

type SignIn = {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: AngularFireAuth, private route: Router) { }

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

  async register(email:string, password:string){
    await this.auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        // User registration successful
        console.log('User registered:', userCredential.user);
        this.route.navigate(['/login'])

      })
      .catch(error => {
        // Handle errors
        console.error('Error during registration:', error);
      });
  }
}
