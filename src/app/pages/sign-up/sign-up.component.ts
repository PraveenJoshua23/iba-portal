import { CommonModule } from '@angular/common';
import { HttpClient} from '@angular/common/http';
import { Component } from '@angular/core'; 
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControlOptions, FormControl, FormControlName } from '@angular/forms';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { createPasswordStrengthValidator, dobFormatValidator, passwordMatchValidator } from '../../shared/utils/validators';


@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VideoPlayerComponent],
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  myForm!: FormGroup;

  constructor(private fb: FormBuilder, private firebase: FirebaseService, private auth: AuthService) { 
    this.myForm = this.fb.group({
      name: ['', Validators.required],
      age: ['', Validators.required],
      dob: ['', [Validators.required, dobFormatValidator()]],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)]],
      religion: ['Christian', Validators.required],
      faith: ['', Validators.required],
      occupation: ['', Validators.required],
      gender: ['', Validators.required],
      marital: ['', Validators.required],
      language: ['English', Validators.required],
      whyApply: ['', Validators.required],  
      linkFrom: ['', Validators.required],
      studying: ['', Validators.required],
      password: ['', [Validators.required, createPasswordStrengthValidator()]],
      confirmPassword: ['', Validators.required],
      networker: ['', Validators.required]
    }, {
      validator: passwordMatchValidator('password', 'confirmPassword')
    } as AbstractControlOptions);
  }

  ngOnInit(): void {
    
  }

  async onSubmit(){

    const formData = this.myForm.value;

    const signUpData = {
      name: formData.name,
      age: formData.age,
      dob: formData.dob,
      phone: formData.phone,
      email: formData.email,
      religion: formData.religion,
      faith: formData.faith,
      occupation: formData.occupation,
      gender: formData.gender,
      marital: formData.marital,
      language: formData.marital,
      whyApply: formData.whyApply,
      linkFrom: formData.linkFrom,
      studying: formData.studying,
      networker: formData.networker
    }
    
    if(this.myForm.invalid ) return

    try {
      const addUserPromise = this.firebase.addUser(signUpData).then(()=> {
        this.auth.register(formData.email, formData.password);
      });

      await Promise.all([addUserPromise]);
    } catch (error) {
        console.error('Error during form submission:', error);
        // Handle the error, e.g., show a user-friendly message
    }
  }
}
