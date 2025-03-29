import { Injectable, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, user, authState } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, Subscription, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth);
  currentUserSignal = signal<any|null|undefined>(undefined)
  authState$ = authState(this.firebaseAuth);
  authStateSubscription!: Subscription;

  constructor( private route: Router) {
  
   }

  getUserEmail(): string|null{
    const user = localStorage.getItem('email');
    if(user === ''){
      const user = this.firebaseAuth.currentUser;
      return user ? user.email : null; 
    } else {
      return user;
    }
  }

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
    const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password)
      .then(()=> {
        console.log("Signed In successfully!")
      }).catch(err => console.error(err));
    return from(promise);
  }

  handleLoginSuccess(user: any) {
    localStorage.setItem('authState', JSON.stringify(user)); // Store in localStorage
    // ...
  }

  getAuthState() {
    const storedAuthState = localStorage.getItem('authState');
    return storedAuthState ? JSON.parse(storedAuthState) : null;
  }

}
