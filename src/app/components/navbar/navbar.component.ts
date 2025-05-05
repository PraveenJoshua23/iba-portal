// src/app/components/navbar/navbar.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { TranslatePipe } from 'src/app/shared/pipes/translation.pipe';
import { UserService } from 'src/app/shared/services/users/user.service';
import { DataService } from 'src/app/shared/services/data.service';
import { IUser } from 'src/app/shared/models/user.interface';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { TranslationService, Language } from 'src/app/shared/services/language/language.service';
import { NotificationService } from '../notification/notification.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, ClickOutsideDirective, TranslatePipe],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
    auth = inject(AuthService);
    userService = inject(UserService);
    dataService = inject(DataService);
    translationService = inject(TranslationService);
    notificationService = inject(NotificationService);

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
}
