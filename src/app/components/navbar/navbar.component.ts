// src/app/components/navbar/navbar.component.ts
import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/shared/services/auth/auth.service';

import { UserService } from 'src/app/shared/services/users/user.service';
import { DataService } from 'src/app/shared/services/data.service';
import { IUser } from 'src/app/shared/models/user.interface';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { TranslationService, Language } from 'src/app/shared/services/language/language.service';
import { NotificationService } from '../notification/notification.service';
import { Subscription, take } from 'rxjs';
import { SupportService } from 'src/app/shared/services/support/support.service';
import { SupportDialogComponent } from '../support-dialog/support-dialog.component';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, ClickOutsideDirective, SupportDialogComponent],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
    @ViewChild('supportDialog') supportDialog!: SupportDialogComponent;
    auth = inject(AuthService);
    userService = inject(UserService);
    dataService = inject(DataService);
    translationService = inject(TranslationService);
    notificationService = inject(NotificationService);
    supportService = inject(SupportService);

    errMsg: string | null = null;
    currentUser: IUser | null = null;
    currentLanguage: string = 'English';
    isLanguageDropdownOpen: boolean = false;

    availableLanguages: Language[] = [];
    private languageSubscription?: Subscription;

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.availableLanguages = this.translationService.getAvailableLanguages();

        // Subscribe to language changes
        this.languageSubscription = this.translationService.getCurrentLanguage().subscribe((language) => {
            this.currentLanguage = language;
        });

        this.loadUserData();
    }

    ngOnDestroy(): void {
        if (this.languageSubscription) {
            this.languageSubscription.unsubscribe();
        }
    }

    async loadUserData(): Promise<void> {
        const userEmail = this.auth.getUserEmail() || localStorage.getItem('email');

        if (userEmail) {
            try {
                const user = await this.dataService.getUserByEmail(userEmail);
                if (user) {
                    this.currentUser = user;

                    // Set the language from user preferences
                    const userLanguage = user.language || 'English';
                    this.translationService.setLanguage(userLanguage);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        }
    }

    toggleLanguageDropdown(): void {
        this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
    }

    getCurrentLanguageName(): string {
        return this.translationService.getLanguageNameByCode(this.currentLanguage);
    }

    async selectLanguage(languageCode: string): Promise<void> {
        if (!this.currentUser || this.currentLanguage === languageCode) {
            this.isLanguageDropdownOpen = false;
            return;
        }

        try {
            // Update the language in the user object
            const updatedUser = {
                ...this.currentUser,
                language: languageCode,
            };

            // Update the user in Firestore
            await this.userService.updateUser(updatedUser);

            // Update the language service
            this.translationService.setLanguage(languageCode);

            // Update local state
            this.currentUser.language = languageCode;
            this.isLanguageDropdownOpen = false;

            // Show a confirmation notification
            this.showLanguageChangeNotification(languageCode);
        } catch (error) {
            console.error('Error updating language preference:', error);
        }
    }

    private showLanguageChangeNotification(language: string): void {
        // Get the translated notification message
        const message = this.translationService.instant('languageChanged');

        // Show a success notification
        this.notificationService.show(message, 'success', 3000);
    }

    signOut() {
        this.auth.signOut().subscribe({
            next: () => {
                this.router.navigateByUrl('/login');
            },
            error: (err) => {
                this.errMsg = err.code;
            },
        });

        localStorage.clear();
    }

    closeDropdown(): void {
        this.isLanguageDropdownOpen = false;
    }

    // method to handle support form submission
    handleSupportSubmit(formData: any) {
        this.supportService
            .submitSupportRequest(formData)
            .pipe(take(1))
            .subscribe({
                next: (response) => {
                    // Show success notification
                    this.notificationService.show(this.translationService.instant('supportRequestSubmitted') || 'Your support request has been submitted successfully!', 'success', 3000);

                    // Close the dialog - reference to the dialog component is needed
                    this.supportDialog.closeDialog();
                },
                error: (error) => {
                    console.error('Error submitting support request:', error);
                    this.notificationService.show(this.translationService.instant('supportRequestError') || 'Failed to submit support request. Please try again later.', 'error', 3000);

                    // Optionally, you can still close the dialog on error or leave it open to let the user try again
                    // this.supportDialog.closeDialog();
                },
            });
    }
}
