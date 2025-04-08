import { Injectable, inject } from '@angular/core';
import { LanguageService } from './language.service';
import { Observable, map } from 'rxjs';

export interface TranslationMap {
    [key: string]: {
        [language: string]: string;
    };
}

@Injectable({
    providedIn: 'root',
})
export class LanguageContentService {
    private languageService = inject(LanguageService);

    // Example of a basic translation dictionary
    private translations: TranslationMap = {
        home: {
            English: 'Home',
            Tamil: 'முகப்பு',
        },
        lessons: {
            English: 'Lessons',
            Tamil: 'பாடங்கள்',
        },
        signOut: {
            English: 'Sign Out',
            Tamil: 'வெளியேறு',
        },
        languages: {
            English: 'Languages',
            Tamil: 'மொழிகள்',
        },
        profile: {
            English: 'Profile',
            Tamil: 'சுயவிவரம்',
        },
        progress: {
            English: 'Progress',
            Tamil: 'முன்னேற்றம்',
        },
        quiz: {
            English: 'Quiz',
            Tamil: 'வினாடி வினா',
        },
        notes: {
            English: 'Notes',
            Tamil: 'குறிப்புகள்',
        },
        backToHome: {
            English: 'Back to Home',
            Tamil: 'முகப்புக்குத் திரும்பு',
        },
        next: {
            English: 'Next',
            Tamil: 'அடுத்து',
        },
        previous: {
            English: 'Previous',
            Tamil: 'முந்தைய',
        },
        languageChanged: {
            English: 'Language changed to English',
            Tamil: 'மொழி தமிழாக மாற்றப்பட்டது',
        },
        // Add more translations as needed
    };

    constructor() {}

    /**
     * Get translated text for a key using the current language
     */
    translate(key: string): string {
        const currentLang = this.languageService.getCurrentLanguageValue();

        if (this.translations[key] && this.translations[key][currentLang]) {
            return this.translations[key][currentLang];
        }

        // Fallback to English if translation not found
        if (this.translations[key] && this.translations[key]['English']) {
            return this.translations[key]['English'];
        }

        // Fallback to key if no translation exists
        return key;
    }

    /**
     * Get translated text as an Observable (for reactive updates)
     */
    translateAsync(key: string): Observable<string> {
        return this.languageService.getCurrentLanguage().pipe(
            map((lang) => {
                if (this.translations[key] && this.translations[key][lang]) {
                    return this.translations[key][lang];
                }

                // Fallback to English
                if (this.translations[key] && this.translations[key]['English']) {
                    return this.translations[key]['English'];
                }

                return key;
            }),
        );
    }

    /**
     * Add new translations dynamically
     */
    addTranslation(key: string, translations: { [language: string]: string }): void {
        this.translations[key] = translations;
    }
}
