import { CommonModule } from '@angular/common';
import { HttpClient} from '@angular/common/http';
import { Component } from '@angular/core'; 
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControlOptions, FormControl, FormControlName } from '@angular/forms';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { createPasswordStrengthValidator, dobFormatValidator, passwordMatchValidator } from '../../shared/utils/validators';
import { Router } from '@angular/router';


@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VideoPlayerComponent],
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  myForm!: FormGroup;

  constructor(private fb: FormBuilder, private firebase: FirebaseService, private auth: AuthService, private router: Router) { 
    this.myForm = this.fb.group({
      name: ['Thomas', Validators.required],
      dob: ['12/10/1998', [Validators.required]],
      phone: ['5252752752', Validators.required],
      email: ['thoomas@gmail.com', [Validators.required, Validators.email]],
      religion: ['Christian', Validators.required],
      faith: ['17', Validators.required],
      occupation: ['IT', Validators.required],
      gender: ['Male', Validators.required],
      marital: ['Married', Validators.required],
      language: ['English', Validators.required],
      whyApply: ['God', Validators.required],  
      linkFrom: ['HOOO', Validators.required],
      studying: ['Yes', Validators.required],
      password: ['Zion@123', [Validators.required, createPasswordStrengthValidator()]],
      confirmPassword: ['Zion@123', Validators.required],
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
      age: this.calculateAge(formData.dob),
      dob: formData.dob,
      phone: formData.phone,
      email: formData.email,
      religion: formData.religion,
      faith: formData.faith,
      occupation: formData.occupation,
      gender: formData.gender,
      marital: formData.marital,
      language: formData.language,
      whyApply: formData.whyApply,
      networker: formData.linkFrom,
      studying: formData.studying,
    }
    
    if(this.myForm.invalid ) return

    try {
      const addUserPromise = this.firebase.addUser(signUpData).then((v)=> {
        // v will return the email exist or not in users collection
        if(!v){
          this.auth.register(formData.email, formData.password);
          this.router.navigate(['login'])
        } else {

        }
      });
      //await Promise.all([addUserPromise]).then(()=> this.router.navigate(['login']));
    } catch (error) {
        console.error('Error during form submission:', error);
        // Handle the error, e.g., show a user-friendly message
    }
  }

  calculateAge(date:any){
    // Parse the date of birth string into a Date object
    const dobArray = date.split('/');
    const dob = new Date(`${dobArray[2]}-${dobArray[1]}-${dobArray[0]}`);

    // Get the current date
    const currentDate = new Date();

    // Calculate the age
    let age = currentDate.getFullYear() - dob.getFullYear();

    // Adjust age based on the month and day
    if (currentDate.getMonth() < dob.getMonth() || (currentDate.getMonth() === dob.getMonth() && currentDate.getDate() < dob.getDate())) {
      age--;
    }

  return age;
  }
}



