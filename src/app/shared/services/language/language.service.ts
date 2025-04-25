import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { collection, getDocs, getFirestore, query } from '@angular/fire/firestore';

export interface Language {
    name: string;
    code: string;
}

@Injectable({
    providedIn: 'root',
})
export class LanguageService {
    private availableLanguages: Language[] = [];
    private firestore = getFirestore();
    private readonly LANGUAGES_STORAGE_KEY = 'availableLanguages';

    private currentLanguageSubject = new BehaviorSubject<string>('English');

    constructor() {
        // Load initial language preference from localStorage if available
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) {
            this.currentLanguageSubject.next(savedLanguage);
        }

        // Load available languages
        this.loadAvailableLanguages();
    }

    /**
     * Loads available languages from localStorage if present, otherwise fetches from Firestore
     */
    private loadAvailableLanguages(): void {
        const cachedLanguages = localStorage.getItem(this.LANGUAGES_STORAGE_KEY);

        if (cachedLanguages) {
            try {
                this.availableLanguages = JSON.parse(cachedLanguages);
            } catch (error) {
                console.error('Error parsing cached languages:', error);
                this.fetchLanguagesFromFirestore();
            }
        } else {
            this.fetchLanguagesFromFirestore();
        }
    }

    /**
     * Fetches available languages from Firestore and caches them in localStorage
     */
    private fetchLanguagesFromFirestore(): void {
        const languagesCollection = collection(this.firestore, 'languages');

        getDocs(query(languagesCollection))
            .then((querySnapshot) => {
                const languages: Language[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as Language;
                    languages.push({
                        name: data.name,
                        code: data.code,
                    });
                });

                if (languages.length === 0) {
                    // Fallback to default languages if none found in Firestore
                    this.availableLanguages = [
                        { name: 'English', code: 'en' },
                        { name: 'Tamil', code: 'ta' },
                        { name: 'Telugu', code: 'te' },
                        { name: 'Hindi', code: 'hi' },
                        { name: 'Odia', code: 'or' },
                    ];
                } else {
                    this.availableLanguages = languages;
                }

                // Cache languages in localStorage
                localStorage.setItem(this.LANGUAGES_STORAGE_KEY, JSON.stringify(this.availableLanguages));
            })
            .catch((error) => {
                console.error('Error fetching languages from Firestore:', error);
                // Fallback to default languages on error
                this.availableLanguages = [
                    { name: 'English', code: 'en' },
                    { name: 'Tamil', code: 'ta' },
                    { name: 'Telugu', code: 'te' },
                    { name: 'Hindi', code: 'hi' },
                    { name: 'Odia', code: 'or' },
                ];
            });
    }

    /**
     * Refreshes the languages list from Firestore, ignoring cache
     */
    refreshLanguages(): Observable<Language[]> {
        return from(getDocs(query(collection(this.firestore, 'languages')))).pipe(
            map((querySnapshot) => {
                const languages: Language[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as Language;
                    languages.push({
                        name: data.name,
                        code: data.code,
                    });
                });

                if (languages.length > 0) {
                    this.availableLanguages = languages;
                    localStorage.setItem(this.LANGUAGES_STORAGE_KEY, JSON.stringify(this.availableLanguages));
                }

                return this.availableLanguages;
            }),
            catchError((error) => {
                console.error('Error refreshing languages:', error);
                return of(this.availableLanguages);
            }),
        );
    }

    getAvailableLanguages(): Language[] {
        return this.availableLanguages;
    }

    getCurrentLanguage(): Observable<string> {
        return this.currentLanguageSubject.asObservable();
    }

    getCurrentLanguageValue(): string {
        return this.currentLanguageSubject.value;
    }

    setLanguage(languageCode: string): void {
        // Save to localStorage for persistence
        localStorage.setItem('preferredLanguage', languageCode);

        // Update the BehaviorSubject
        this.currentLanguageSubject.next(languageCode);
    }

    getLanguageNameByCode(code: string): string {
        const language = this.availableLanguages.find((lang) => lang.code === code);
        return language ? language.name : 'English';
    }

    /**
     * Returns the language code for a given language name
     * @param name The language name to convert to code
     * @returns The corresponding language code, or the name itself if not found
     */
    getLanguageCodeByName(name: string): string {
        const language = this.availableLanguages.find((lang) => lang.name === name);
        return language ? language.code : name;
    }
}
