import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControlOptions } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { createPasswordStrengthValidator, passwordMatchValidator } from '../../shared/utils/validators';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TermsDialogComponent } from 'src/app/components/terms-dialog/terms-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserService } from 'src/app/shared/services/users/user.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sign-up',
    templateUrl: './sign-up.component.html',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatCheckboxModule],
    styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnDestroy {
    myForm!: FormGroup;
    auth = inject(AuthService);
    auth$!: Subscription;
    userService = inject(UserService);
    errorMsg: string | null = null;
    readonly defaultRole: 'student' | 'instructor' | 'admin' = 'student';

    // Occupation options
    occupationOptions = ['Office Worker', 'Student', 'Government Official', 'Teacher', 'Housewife', 'Other'];

    constructor(
        private fb: FormBuilder,
        private firebase: FirebaseService,
        private router: Router,
        public dialog: MatDialog,
    ) {
        this.initializeForm();
    }

    initializeForm(): void {
        this.myForm = this.fb.group(
            {
                name: ['', Validators.required],
                dob: ['', [Validators.required]],
                phoneCode: ['+91', Validators.required],
                phone: ['', Validators.required],
                email: ['', [Validators.required, Validators.email]],
                religion: ['Christian', Validators.required],
                occupation: ['', Validators.required],
                gender: ['Male', Validators.required],
                marital: ['Married', Validators.required],
                language: ['English', Validators.required],
                whyApply: ['', Validators.required],
                linkFrom: ['', Validators.required],
                studying: ['Yes', Validators.required],
                password: ['', [Validators.required, createPasswordStrengthValidator()]],
                confirmPassword: ['', Validators.required],
            },
            {
                validator: passwordMatchValidator('password', 'confirmPassword'),
            } as AbstractControlOptions,
        );
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        if (this.auth$) {
            this.auth$.unsubscribe();
        }
    }

    async onSubmit() {
        if (this.myForm.invalid) return;

        const formData = this.myForm.value;

        const signUpData = {
            id: '',
            role: this.defaultRole,
            name: formData.name,
            email: formData.email,
            language: formData.language,
            instructor: formData.language === 'English' ? 'Priscilla' : 'Daniel',
            networker: formData.linkFrom,
            classId: '',
            userDetails: {
                age: this.calculateAge(formData.dob).toString(),
                dob: formData.dob,
                phone: `${formData.phoneCode} ${formData.phone}`, // Combine phone code and number
                religion: formData.religion,
                occupation: formData.occupation,
                gender: formData.gender,
                marital: formData.marital,
                whyApply: formData.whyApply,
                studying: formData.studying,
            },
        };

        try {
            this.userService
                .addUser(signUpData)
                .then((v) => {
                    console.log(v);
                    this.auth$ = this.auth.register(formData.email, formData.password, formData.name).subscribe({
                        next: () => this.router.navigateByUrl('/login'),
                        error: (err) => (this.errorMsg = err.code),
                    });
                })
                .catch((err) => {
                    console.error(err);
                    this.errorMsg = 'An error occurred during registration. Please try again.';
                });
        } catch (error) {
            console.error('Error during form submission:', error);
            this.errorMsg = 'An unexpected error occurred. Please try again later.';
        }
    }

    calculateAge(date: string) {
        // Parse the date of birth
        const dob = new Date(date);

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

    openTermsDialog(): void {
        const dialogRef = this.dialog.open(TermsDialogComponent, {
            width: '500px',
            disableClose: true, // Dialog can only be closed via the Agree button
        });

        dialogRef.afterClosed().subscribe(() => {
            console.log('User agreed to terms and conditions');
        });
    }
}
