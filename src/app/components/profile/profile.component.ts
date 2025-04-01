import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageControlComponent } from '../image-control/image-control.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ProfileService } from 'src/app/shared/services/profile/profile.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from 'src/app/shared/services/data.service';
import { IUser } from 'src/app/shared/models/user.interface';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { createPasswordStrengthValidator, passwordMatchValidator } from 'src/app/shared/utils/validators';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ImageControlComponent, MatDialogModule, ReactiveFormsModule, MatSnackBarModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
    profilePath = signal('');
    isLoading = signal(true);
    profileError = signal(false);
    userEmail: string | null = null;
    userDetails: IUser | null = null;
    isLoadingUserData = signal(true);

    // Password change form
    passwordForm: FormGroup;
    isChangingPassword = signal(false);

    private profileService = inject(ProfileService);
    private dataService = inject(DataService);
    private fb = inject(FormBuilder);
    private snackBar = inject(MatSnackBar);
    private authService = inject(AuthService);

    constructor() {
        this.userEmail = localStorage.getItem('email');

        // Initialize password form
        this.passwordForm = this.fb.group(
            {
                currentPassword: ['', Validators.required],
                newPassword: ['', [Validators.required, createPasswordStrengthValidator()]],
                confirmPassword: ['', Validators.required],
            },
            { validators: passwordMatchValidator('newPassword', 'confirmPassword') },
        );

        if (this.userEmail) {
            this.profilePath.set(`profile/${this.userEmail}/profile`);

            // Load user data
            this.loadUserData();

            // Check if profile exists, initialize if it doesn't
            this.profileService.checkProfileExists(this.userEmail).subscribe((exists) => {
                if (!exists) {
                    // If profile doesn't exist, initialize it
                    this.profileService.initializeUserProfile(this.userEmail!).subscribe({
                        next: (result) => {
                            this.isLoading.set(false);
                            if (!result.success) {
                                this.profileError.set(true);
                            }
                        },
                        error: () => {
                            this.isLoading.set(false);
                            this.profileError.set(true);
                        },
                    });
                } else {
                    this.isLoading.set(false);
                }
            });
        } else {
            console.error('No email found in localStorage');
            this.isLoading.set(false);
            this.profileError.set(true);
            this.isLoadingUserData.set(false);
        }
    }

    imageReady(event: any) {
        console.log('Image loading status:', event);
    }

    async loadUserData() {
        if (!this.userEmail) {
            this.isLoadingUserData.set(false);
            return;
        }

        try {
            this.userDetails = await this.dataService.getUserByEmail(this.userEmail);
            this.isLoadingUserData.set(false);
        } catch (error) {
            console.error('Error loading user data:', error);
            this.isLoadingUserData.set(false);
        }
    }

    onChangePassword() {
        if (this.passwordForm.invalid || this.isChangingPassword()) return;

        this.isChangingPassword.set(true);
        const { currentPassword, newPassword } = this.passwordForm.value;

        this.authService.changePassword(currentPassword, newPassword).subscribe({
            next: () => {
                this.snackBar.open('Password changed successfully!', 'Close', {
                    duration: 3000,
                    panelClass: ['success-snackbar'],
                });
                this.passwordForm.reset();
                this.isChangingPassword.set(false);
            },
            error: (error) => {
                let errorMessage = 'Failed to change password';

                // Handle specific Firebase auth errors
                if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Current password is incorrect';
                } else if (error.code === 'auth/requires-recent-login') {
                    errorMessage = 'For security reasons, please log in again before changing your password';
                }

                this.snackBar.open(errorMessage, 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar'],
                });
                this.isChangingPassword.set(false);
            },
        });
    }
}
