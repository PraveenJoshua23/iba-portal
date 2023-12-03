import { CommonModule } from '@angular/common';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
// import { AuthService } from 'src/app/auth.service';
import { AuthService as Auth } from 'src/app/shared/services/auth.service';
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

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private route: Router,
    private firebase: FirebaseService
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.getUser();

  }

  onSubmit() {
    if (this.loginForm.valid) {
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      this.isLoggingIn = true;

      this.auth.signIn({ email: email, password: password }).subscribe({
        next: () => this.route.navigate(['/home']),
        error: (error) => {
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
    const email = "johndoe@gmail.com";
    this.firebase.getUserByEmail(email).subscribe(user => {
      this.userData = user[0]
      console.log(this.userData)

      localStorage.setItem('username', this.userData.name)
      localStorage.setItem('email', this.userData.email)
      localStorage.setItem('language', this.userData.userDetails.language)

    })
    
  }
  
}
