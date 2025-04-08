import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { IUser } from 'src/app/shared/models/user.interface';
import { UserService } from 'src/app/shared/services/users/user.service';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-edit-user',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, ReactiveFormsModule, MatSelectModule, MatInputModule, MatFormFieldModule],
    templateUrl: './edit-user.component.html',
    styleUrls: ['./edit-user.component.scss'],
})
export class EditUserComponent implements OnInit {
    myUserForm!: FormGroup;
    prevUser: any;
    editedValue: any = {};
    editMode = signal(true);

    // Inject services
    userService = inject(UserService);
    snackBar = inject(MatSnackBar);

    // Dropdown options
    occupationOptions = ['Office Worker', 'Student', 'Government Official', 'Teacher', 'Housewife', 'Other'];
    roleOptions = ['student', 'instructor', 'admin'];
    languageOptions = ['English', 'Tamil', 'Hindi', 'Telugu'];

    constructor(
        private form: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dialogRef: MatDialogRef<EditUserComponent>,
    ) {}

    ngOnInit(): void {
        this.prevUser = this.data;

        // Initialize the form with values from the user data
        this.initializeForm();
    }

    initializeForm(): void {
        this.myUserForm = this.form.group({
            role: [this.prevUser.role || 'student', Validators.required],
            name: [this.prevUser.name, Validators.required],
            instructor: [this.prevUser.instructor, Validators.required],
            networker: [this.prevUser.networker, Validators.required],
            classId: [this.prevUser.classId || '', Validators.required],
            age: [this.prevUser.userDetails?.age || '', Validators.required],
            dob: [this.prevUser.userDetails?.dob || '', Validators.required],
            phone: [this.prevUser.userDetails?.phone || '', Validators.required],
            email: [this.prevUser.email, [Validators.required, Validators.email]],
            religion: [this.prevUser.userDetails?.religion || 'Christian', Validators.required],
            occupation: [this.prevUser.userDetails?.occupation || '', Validators.required],
            gender: [this.prevUser.userDetails?.gender || 'Male', Validators.required],
            marital: [this.prevUser.userDetails?.marital || 'Single', Validators.required],
            language: [this.prevUser.language || 'English', Validators.required],
            whyApply: [this.prevUser.userDetails?.whyApply || '', Validators.required],
            studying: [this.prevUser.userDetails?.studying || 'Yes', Validators.required],
        });
    }

    onSubmit() {
        if (this.myUserForm.invalid) {
            this.snackBar.open('Please correct form errors before submitting', 'Close', {
                duration: 3000,
            });
            return;
        }

        const form = this.myUserForm.value;

        // Create updated user object with the form values
        const editedData: IUser = {
            ...this.prevUser,
            name: form.name,
            role: form.role,
            classId: form.classId,
            email: form.email,
            instructor: form.instructor,
            networker: form.networker,
            language: form.language,
            userDetails: {
                age: form.age,
                dob: form.dob,
                phone: form.phone,
                gender: form.gender,
                marital: form.marital,
                religion: form.religion,
                studying: form.studying,
                whyApply: form.whyApply,
                occupation: form.occupation,
            },
        };

        // Update the user in Firestore
        this.userService
            .updateUser(editedData)
            .then(() => {
                this.snackBar.open(`User ${form.name} updated successfully`, 'Close', {
                    duration: 3000,
                });
                this.dialogRef.close(true); // Close dialog with success result
            })
            .catch((error) => {
                console.error('Error updating user:', error);
                this.snackBar.open('Error updating user', 'Close', {
                    duration: 3000,
                });
            });
    }

    editDetails() {
        this.editMode.update((value) => !value);
    }
}
