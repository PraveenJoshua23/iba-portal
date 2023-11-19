import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core'; 
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  myForm!: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) { 
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

  onSubmit(){
    
    const formData = this.myForm.value;
    console.log(formData)
    
    // this.http.post('your-backend-api-url', formData)
    //   .subscribe((response: any) => {
    //     console.log('Backend response:', response);
    //   });
  }
}
