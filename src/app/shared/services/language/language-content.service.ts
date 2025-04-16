import { Injectable, inject } from '@angular/core';
import { LanguageService } from './language.service';
import { Observable, map } from 'rxjs';

import { TranslationMap, translations } from './translations';

@Injectable({
    providedIn: 'root',
})
export class LanguageContentService {
    private languageService = inject(LanguageService);

    // Example of a basic translation dictionary
    private translations: TranslationMap = translations;

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
