import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule,MatDialogModule,MatButtonModule, ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {
  myUserForm!:  FormGroup;
  prevUser: any;
  editedValue:any = {};

  constructor(private form: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any, private fire: FirebaseService){
    
  }

  ngOnInit(): void {
      console.log(this.data);
      this.prevUser = this.data
      this.myUserForm = this.form.group({
        name: [this.prevUser.name, Validators.required],
        dob: [this.prevUser.dob, [Validators.required]],
        phone: [this.prevUser.phone, Validators.required],
        email: [this.prevUser.email, [Validators.required, Validators.email]],
        religion: [this.prevUser.religion, Validators.required],
        faith: [this.prevUser.faith, Validators.required],
        occupation: [this.prevUser.occupation, Validators.required],
        gender: [this.prevUser.gender, Validators.required],
        marital: [this.prevUser.marital, Validators.required],
        language: [this.prevUser.language, Validators.required],
        whyApply: [this.prevUser.whyApply, Validators.required],  
        linkFrom: [this.prevUser.linkFrom, Validators.required],
        studying: [this.prevUser.studying, Validators.required],
      });
  }

  onSubmit(){
    for (const key in this.myUserForm.value) {
      if (this.myUserForm.value[key] !== this.prevUser[key]) {
        this.editedValue[key] = this.myUserForm.value[key];
      }
    }
    console.log(this.editedValue);

    this.fire.updateUserByEmail(this.editedValue, this.prevUser.email).then(() => console.log(`User ${this.prevUser.email} Updated`))


  }


}
