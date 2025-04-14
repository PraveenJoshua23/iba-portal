import { Injectable, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, user, authState, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from '@angular/fire/auth';
import { Observable, Subscription, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private firebaseAuth = inject(Auth);
    user$ = user(this.firebaseAuth);
    currentUserSignal = signal<any | null | undefined>(undefined);
    authState$ = authState(this.firebaseAuth);
    authStateSubscription!: Subscription;

    getUserEmail(): string | null {
        const user = localStorage.getItem('email');
        if (user === '') {
            const user = this.firebaseAuth.currentUser;
            return user ? user.email : null;
        } else {
            return user;
        }
    }

    forgotPassword(email: string): Observable<void> {
        const promise = sendPasswordResetEmail(this.firebaseAuth, email);
        return from(promise);
    }

    signOut() {
        return from(signOut(this.firebaseAuth));
    }

    register(email: string, password: string, username: string): Observable<void> {
        const promise = createUserWithEmailAndPassword(this.firebaseAuth, email, password).then((response) => updateProfile(response.user, { displayName: username }));
        return from(promise);
    }

    signIn(email: string, password: string): Observable<void> {
        // Don't catch the error here, let it propagate to the subscriber
        const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password)
            .then(() => {
                console.log('Signed In successfully!');
            });
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

    /**
     * Change user password
     * @param currentPassword Current password for verification
     * @param newPassword New password to set
     * @returns Observable that completes when password is changed
     */
    changePassword(currentPassword: string, newPassword: string): Observable<void> {
        const user = this.firebaseAuth.currentUser;

        if (!user || !user.email) {
            return throwError(() => new Error('User not logged in'));
        }

        // Create credential with the user's email and current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);

        // Reauthenticate the user first (required for sensitive operations)
        return from(
            reauthenticateWithCredential(user, credential).then(() => {
                // After successful reauthentication, update the password
                return updatePassword(user, newPassword);
            }),
        ).pipe(
            catchError((error) => {
                console.error('Error changing password:', error);
                return throwError(() => error);
            }),
        );
    }
}
