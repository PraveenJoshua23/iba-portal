import { CommonModule } from '@angular/common';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// import { AuthService } from 'src/app/auth.service';
import { AuthService as Auth } from 'src/app/shared/services/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { DataService } from 'src/app/shared/services/data.service';
import { user } from '@angular/fire/auth';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AngularFireAuthModule],
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    loginForm!: FormGroup;
    isLoggingIn: boolean = false;
    isForgotten: boolean = false;
    userData: any;
    auth = inject(Auth);
    ds = inject(DataService);
    errorMsg: string | null = null;

    constructor(
        private fb: FormBuilder,
        private route: Router,
        private firebase: FirebaseService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$')]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            const email = this.loginForm.get('email')?.value;
            const password = this.loginForm.get('password')?.value;

            // Clear any previous error messages
            this.errorMsg = null;
            this.isLoggingIn = true;

            this.auth.signIn(email, password).subscribe({
                next: (user) => {
                    // this.getUser();
                    console.log(user);
                    localStorage.setItem('email', email);
                    this.route.navigateByUrl('/home');
                },
                error: (error) => {
                    console.log('Login error:', error);
                    console.log('Error code:', error.code);
                    console.log('Error message:', error.message);
                    console.log(error);
                    this.isLoggingIn = false;

                    // Set appropriate error message based on error code
                    switch (error.code) {
                        case 'auth/user-not-found':
                            this.errorMsg = 'No user found with this email address';
                            break;
                        case 'auth/wrong-password':
                            this.errorMsg = 'Incorrect password';
                            break;
                        case 'auth/invalid-credential':
                            this.errorMsg = 'Invalid credentials';
                            break;
                        case 'auth/too-many-requests':
                            this.errorMsg = 'Too many failed login attempts. Please try again later';
                            break;
                        case 'auth/user-disabled':
                            this.errorMsg = 'This account has been disabled';
                            break;
                        default:
                            this.errorMsg = 'An error occurred during sign in. Please try again';
                    }
                    // Force change detection to update the UI
                    this.cdr.detectChanges();
                },
            });
        }
    }

    forgotPassword() {
        this.isForgotten = true;
        const email = this.loginForm.get('email')?.value;

        this.auth.forgotPassword(email).subscribe({
            next: () => {
                this.isForgotten = false;
            },
            error: (error) => {
                this.isForgotten = false;
            },
        });
    }

    // async getUser(){
    //   const email = this.loginForm.get('email')?.value;

    //   this.userData = await this.ds.getUserByEmail(email)

    // }
}
