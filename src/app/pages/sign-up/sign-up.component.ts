import { CommonModule } from '@angular/common';
import { HttpClient} from '@angular/common/http';
import { Component } from '@angular/core'; 
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

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
      dob: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', Validators.required],
      religion: ['Christian', Validators.required],
      faith: ['', Validators.required],
      occupation: ['', Validators.required],
      gender: ['', Validators.required],
      marital: ['', Validators.required],
      language: ['English', Validators.required],
      whyApply: ['', Validators.required],  
      linkFrom: ['', Validators.required],
      studying: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    console.log(this.myForm)
  }

  async onSubmit(){

    const formData = this.myForm.value;
    console.log(formData)

    if(this.myForm.invalid ) return

    this.firebase.addUserToDb(formData);
    await this.auth.register(formData.email, formData.password);
    
<<<<<<< HEAD
    // this.http.post('your-backend-api-url', formData)
    //   .subscribe((response: any) => {
    //     console.log('Backend response:', response);
    //   });

      // this.http.post('http://localhost:3000/reg/save-reg', formData)
      // .subscribe((response: any) => {
      //   console.log('Backend response:', response);
      // });

      // save-reg
=======
>>>>>>> 5ee580b5afc56e59daeb4a8120e84762503b414a
  }
}
