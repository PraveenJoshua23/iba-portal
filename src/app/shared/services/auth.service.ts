import { Injectable, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, user } from '@angular/fire/auth';
// import { AngularFireAuth } from '@angular/fire/compat/auth';
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
  firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth);
  currentUserSignal = signal<any|null|undefined>(undefined)

  constructor( private route: Router) { }

  // signIn(params: SignIn): Observable<any>{
  //   return from(this.auth.signInWithEmailAndPassword(
  //     params.email, params.password
  //   ))
  // }

  forgotPassword(email:string): Observable<void>{
    const promise = sendPasswordResetEmail(this.firebaseAuth, email);
    // return from(this.auth.sendPasswordResetEmail(email))
    return from(promise);
  }

  signOut(){
    // return from(this.auth.signOut());
    return from(signOut(this.firebaseAuth))
  }

  register(email:string, password:string, username: string): Observable<void>{
    const promise = createUserWithEmailAndPassword(this.firebaseAuth, email, password)
                      .then(response => updateProfile(response.user, {displayName: username}))
    return from(promise);
  }

  signIn(email: string, password: string):Observable<void>{
    const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password).then(()=> {});
    return from(promise);
  }
}
