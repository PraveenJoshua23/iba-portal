import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { TranslatePipe } from 'src/app/shared/pipes/language.pipe';
import { UserService } from 'src/app/shared/services/users/user.service';
import { DataService } from 'src/app/shared/services/data.service';
import { IUser } from 'src/app/shared/models/user.interface';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { LanguageService, Language } from 'src/app/shared/services/language/language.service';
import { LanguageContentService } from 'src/app/shared/services/language/language-content.service';
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
    languageService = inject(LanguageService);
    languageContent = inject(LanguageContentService);
    notificationService = inject(NotificationService);

    errMsg: string | null = null;
    currentUser: IUser | null = null;
    currentLanguage: string = 'English'; // Default language
    isLanguageDropdownOpen: boolean = false;

    availableLanguages: Language[] = [];
    private languageSubscription?: Subscription;

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.availableLanguages = this.languageService.getAvailableLanguages();

        // Subscribe to language changes
        this.languageSubscription = this.languageService.getCurrentLanguage().subscribe((language) => {
            this.currentLanguage = language;
        });

        this.loadUserData();
    }

    ngOnDestroy(): void {
        // Clean up the subscription when the component is destroyed
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
                    this.languageService.setLanguage(userLanguage);
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
        return this.languageService.getLanguageNameByCode(this.currentLanguage);
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
            this.languageService.setLanguage(languageCode);

            // Update local state
            this.currentUser.language = languageCode;
            this.isLanguageDropdownOpen = false;

            // Show a confirmation notification instead of reloading the page
            this.showLanguageChangeNotification(languageCode);
        } catch (error) {
            console.error('Error updating language preference:', error);
        }
    }

    private showLanguageChangeNotification(language: string): void {
        // Get the translated notification message
        const message = this.languageContent.translate('languageChanged');

        // Show a success notification
        this.notificationService.show(message, 'success', 3000);

        // Also log to console
        console.log(`Language changed to ${this.languageService.getLanguageNameByCode(language)}`);
    }

    signOut() {
        this.auth.signOut().subscribe({
            next: () => {
                this.router.navigateByUrl('/');
            },
            error: (err) => {
                this.errMsg = err.code;
                console.log(this.errMsg);
            },
        });

        localStorage.clear();
    }

    // Close the dropdown when clicking outside
    closeDropdown(): void {
        this.isLanguageDropdownOpen = false;
    }
}
