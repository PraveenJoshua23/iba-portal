import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { UserService } from 'src/app/shared/services/users/user.service';
import { IUser } from 'src/app/shared/models/user.interface';

@Component({
    selector: 'app-add-user-dialog',
    templateUrl: './add-user-dialog.component.html',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
})
export class AddUserDialogComponent {
    userForm: FormGroup;
    errorMsg: string | null = null;
    isSubmitting = false;

    // Dropdown toggles
    showRoleDropdown = false;
    showLanguageDropdown = false;
    showOccupationDropdown = false;

    // Form options
    occupationOptions = ['Office Worker', 'Student', 'Government Official', 'Teacher', 'Housewife', 'Other'];
    languageOptions = ['English', 'Tamil', 'Hindi', 'Telugu'];
    roleOptions = ['student', 'instructor', 'admin'];

    userService = inject(UserService);

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<AddUserDialogComponent>,
        private elementRef: ElementRef,
    ) {
        this.userForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            role: ['student', Validators.required],
            language: ['English', Validators.required],
            instructor: ['Priscilla'],
            networker: ['', Validators.required],
            classId: ['cls104', Validators.required],

            // User details
            dob: ['', Validators.required],
            phone: ['', Validators.required],
            religion: ['Christian', Validators.required],
            occupation: ['', Validators.required],
            gender: ['Male', Validators.required],
            marital: ['Married', Validators.required],
            whyApply: ['', Validators.required],
            studying: ['Yes', Validators.required],
        });

        // Set instructor based on language
        this.userForm.get('language')?.valueChanges.subscribe((lang) => {
            this.userForm.patchValue({
                instructor: lang === 'English' ? 'Priscilla' : 'Daniel',
            });
        });
    }

    // Close dropdowns when clicking outside
    @HostListener('document:click', ['$event'])
    clickOutside(event: Event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.showRoleDropdown = false;
            this.showLanguageDropdown = false;
            this.showOccupationDropdown = false;
        }
    }

    // Toggle dropdowns
    toggleDropdown(dropdown: string, event: Event) {
        event.stopPropagation();
        switch (dropdown) {
            case 'role':
                this.showRoleDropdown = !this.showRoleDropdown;
                this.showLanguageDropdown = false;
                this.showOccupationDropdown = false;
                break;
            case 'language':
                this.showLanguageDropdown = !this.showLanguageDropdown;
                this.showRoleDropdown = false;
                this.showOccupationDropdown = false;
                break;
            case 'occupation':
                this.showOccupationDropdown = !this.showOccupationDropdown;
                this.showRoleDropdown = false;
                this.showLanguageDropdown = false;
                break;
        }
    }

    // Select option from dropdown
    selectOption(field: string, value: string) {
        this.userForm.get(field)?.setValue(value);
        switch (field) {
            case 'role':
                this.showRoleDropdown = false;
                break;
            case 'language':
                this.showLanguageDropdown = false;
                break;
            case 'occupation':
                this.showOccupationDropdown = false;
                break;
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    async onSubmit() {
        if (this.userForm.invalid || this.isSubmitting) return;

        this.isSubmitting = true;
        this.errorMsg = null;

        const formData = this.userForm.value;

        const newUser: IUser = {
            id: '',
            role: formData.role,
            name: formData.name,
            email: formData.email,
            language: formData.language,
            instructor: formData.instructor,
            networker: formData.networker,
            classId: formData.classId,
            userDetails: {
                age: this.calculateAge(formData.dob).toString(),
                dob: formData.dob,
                phone: formData.phone,
                religion: formData.religion,
                occupation: formData.occupation,
                gender: formData.gender,
                marital: formData.marital,
                whyApply: formData.whyApply,
                studying: formData.studying,
            },
        };

        try {
            await this.userService.addUser(newUser);
            this.dialogRef.close(true);
        } catch (error) {
            console.error('Error adding user:', error);
            this.errorMsg = 'An error occurred while adding the user. Please try again.';
            this.isSubmitting = false;
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
}
