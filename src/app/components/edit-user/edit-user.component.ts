import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { IUser } from 'src/app/shared/models/user.interface';
import { UserService } from 'src/app/shared/services/users/user.service';

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
  editMode = signal(true);
  us = inject(UserService);


  constructor(private form: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any, private fire: FirebaseService){
    
  }

  ngOnInit(): void {
      console.log(this.data);
     
      this.prevUser = this.data
      this.myUserForm = this.form.group({
        name: [this.prevUser.name, Validators.required],
        instructor: [this.prevUser.instructor, Validators.required],
        networker: [this.prevUser.networker, Validators.required],
        classId: [this.prevUser.classId, Validators.required],
        age: [this.prevUser.userDetails.age, Validators.required],
        dob: [this.prevUser.userDetails.dob, [Validators.required]],
        phone: [this.prevUser.userDetails.phone, Validators.required],
        email: [this.prevUser.email, [Validators.required, Validators.email]],
        religion: [this.prevUser.userDetails.religion, Validators.required],
        faith: [this.prevUser.userDetails.faith, Validators.required],
        occupation: [this.prevUser.userDetails.occupation, Validators.required],
        gender: [this.prevUser.userDetails.gender, Validators.required],
        marital: [this.prevUser.userDetails.marital, Validators.required],
        language: [this.prevUser.language, Validators.required],
        whyApply: [this.prevUser.userDetails.whyApply, Validators.required],  
        studying: [this.prevUser.userDetails.studying, Validators.required],
      });
  }

  onSubmit(){
    console.log(this.myUserForm.dirty)
    const form = this.myUserForm.value;
    const editedData: IUser = {
      ...this.prevUser,
      name: form.name,
      classId: form.classId,
      email: form.email,
      instructor: form.instructor,
      networker: form.networker,
      language: form.language,
      userDetails: {
        age: form.age,
        dob: form.dob,
        faith: form.faith,
        phone: form.phone,
        gender: form.gender,
        marital: form.marital,
        religion: form.religion,
        studying: form.studying,
        whyApply: form.whyApply,
        occupation: form.occupation
      }
    }
    // for (const key in this.myUserForm.value) {
    //   if (this.myUserForm.value[key] !== this.prevUser[key]) {
    //     this.editedValue[key] = this.myUserForm.value[key];
    //   }
    // }
    this.us.updateUser(editedData);

    // this.fire.updateUserByEmail(this.editedValue, this.prevUser.email).then(() => console.log(`User ${this.prevUser.email} Updated`))


  }

  editDetails(){
    this.editMode.set(!this.editMode());
    console.log(this.editMode())
  }
}
