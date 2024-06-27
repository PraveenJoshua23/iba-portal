import { CommonModule } from '@angular/common';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
// import { AuthService } from 'src/app/auth.service';
import { AuthService as Auth } from 'src/app/shared/services/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

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
  errorMsg: string|null = null;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private firebase: FirebaseService
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });

  }

  onSubmit() {
    if (this.loginForm.valid) {
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      this.isLoggingIn = true;

      this.auth.signIn( email, password ).subscribe({
        next: () => {
          this.getUser();
          this.route.navigateByUrl('/home');
          localStorage.setItem('email', email);
        },
        error: (error) => {
          console.log(error)
          this.isLoggingIn = false;
        },
      });

      // this.as.getUser(email, password).subscribe((res:any) => {
      //   if(res['success']) this.route.navigate(['/home'])
      // })
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

  getUser(){
    const email = this.loginForm.get('email')?.value;
    this.firebase.getUserByEmail(email).subscribe(user => {
      this.userData = user[0]

      localStorage.setItem('username', this.userData.name)
      localStorage.setItem('email', this.userData.email)
      localStorage.setItem('language', this.userData.userDetails.language)

    })
    
  }
  
}
