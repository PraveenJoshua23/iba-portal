// src/app/shared/services/language/firestore-translate-loader.ts
import { inject, Injectable } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { collection, Firestore, getDocs, getFirestore, query } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FirestoreTranslateLoader implements TranslateLoader {
    private firestore = inject(Firestore);

    // Language name to code mapping
    private languageMap: Record<string, string> = {
        English: 'en',
        Tamil: 'ta',
        Telugu: 'te',
        Hindi: 'hi',
        Odia: 'or',
    };

    // Reverse mapping (code to name)
    private codeToName: Record<string, string> = {
        en: 'English',
        ta: 'Tamil',
        te: 'Telugu',
        hi: 'Hindi',
        or: 'Odia',
    };

    /**
     * Gets the translations from Firestore for a given language
     * @param langCode The language code to get translations for
     */
    getTranslation(langCode: string): Observable<any> {
        // Get the translations collection reference
        const translationsCollection = collection(this.firestore, 'translations');

        return from(getDocs(query(translationsCollection))).pipe(
            map((querySnapshot) => {
                const translations: Record<string, string> = {};

                querySnapshot.forEach((doc) => {
                    const key = doc.id;
                    const data = doc.data() as Record<string, string>;

                    // Get language name from code
                    const langName = this.getLanguageNameFromCode(langCode);

                    // Debug the language name and available keys

                    // Add the translation if it exists for this language
                    if (data[langName]) {
                        translations[key] = data[langName];
                    } else {
                        console.error(`FirestoreTranslateLoader: No translation found for ${key} in language ${langName}`);
                    }
                });

                return translations;
            }),
            catchError((error) => {
                console.error('Error loading translations from Firestore:', error);
                return of({}); // Return empty object on error
            }),
        );
    }

    // Helper method to get language name from code
    private getLanguageNameFromCode(code: string): string {
        return this.codeToName[code] || 'English';
    }

    // Helper method to get language code from name
    private getLanguageCodeFromName(name: string): string {
        return this.languageMap[name] || 'en';
    }
}
