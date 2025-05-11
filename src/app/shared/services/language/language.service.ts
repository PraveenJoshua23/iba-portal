// src/app/shared/services/language/translation.service.ts
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { collection, doc, Firestore, getDocs, getFirestore, query, setDoc } from '@angular/fire/firestore';
import { FirestoreTranslateLoader } from './firebase-translation-loader';

export interface Language {
    name: string;
    code: string;
}

@Injectable({
    providedIn: 'root',
})
export class TranslationService {
    private firestore = inject(Firestore);
    translate = inject(TranslateService);
    private firestoreLoader = inject(FirestoreTranslateLoader);

    // Keep these variables for compatibility with existing services
    private currentLanguageSubject = new BehaviorSubject<string>('English');

    // Available languages
    private availableLanguages: Language[] = [
        { name: 'English', code: 'en' },
        { name: 'Tamil', code: 'ta' },
        { name: 'Telugu', code: 'te' },
        { name: 'Hindi', code: 'hi' },
        { name: 'Odia', code: 'or' },
        { name: 'Kannada', code: 'ka' },
    ];

    constructor() {
        // Initialize the translation service
        this.initTranslation();
    }

    /**
     * Initialize the translation service
     */
    private initTranslation(): void {
        // Add available languages to ngx-translate
        const langCodes = this.availableLanguages.map((lang) => lang.code);
        this.translate.addLangs(langCodes);

        // Set default language
        this.translate.setDefaultLang('en');

        // Get saved language preference
        const savedLanguage = localStorage.getItem('preferredLanguage');

        // Use saved language or detect browser language
        let langToUse = 'English';
        if (savedLanguage) {
            langToUse = savedLanguage;
        } else {
            // Try to detect browser language
            const browserLang = this.translate.getBrowserLang();

            // Check if browser language is supported
            if (browserLang && langCodes.includes(browserLang)) {
                langToUse = this.getLanguageNameByCode(browserLang);
            }
        }

        this.setLanguage(langToUse);

        // Pre-load all translations
        this.refreshTranslations().subscribe({
            next: (success) => {
                console.log('TranslationService: Initial translations loaded', success);
            },
            error: (error) => {
                console.error('TranslationService: Error loading initial translations', error);
            },
        });
    }

    /**
     * Set the current language
     */
    setLanguage(language: string): void {
        // Check if it's a code or name
        let langCode: string;
        let langName: string;

        if (language.length === 2) {
            // It's a code
            langCode = language;
            langName = this.getLanguageNameByCode(langCode);
        } else {
            // It's a name
            langName = language;
            langCode = this.getLanguageCodeByName(langName);
        }

        // Use the language code for ngx-translate
        this.translate.use(langCode);

        // Update the behavior subject with the language name
        this.currentLanguageSubject.next(langName);

        // Save to localStorage
        localStorage.setItem('preferredLanguage', langName);
    }

    /**
     * Refresh translations from Firestore
     */
    refreshTranslations(): Observable<any> {
        const langCode = this.getLanguageCodeByName(this.currentLanguageSubject.value);
        return this.firestoreLoader.getTranslation(langCode).pipe(
            tap((translations) => {
                // Update ngx-translate with the refreshed translations
                this.translate.setTranslation(langCode, translations, true);
            }),
        );
    }

    /**
     * Add or update a translation in Firestore
     */
    updateTranslation(key: string, translations: { [language: string]: string }): Observable<boolean> {
        const translationRef = doc(collection(this.firestore, 'translations'), key);

        return from(setDoc(translationRef, translations)).pipe(
            map(() => {
                // Update ngx-translate translations
                Object.keys(translations).forEach((langName) => {
                    const langCode = this.getLanguageCodeByName(langName);
                    const update: { [key: string]: string } = {};
                    update[key] = translations[langName];
                    this.translate.setTranslation(langCode, update, true);
                });

                return true;
            }),
            catchError((error) => {
                console.error(`Error updating translation '${key}' in Firestore:`, error);
                return of(false);
            }),
        );
    }

    /**
     * Get current language observable
     */
    getCurrentLanguage(): Observable<string> {
        return this.currentLanguageSubject.asObservable();
    }

    /**
     * Get current language value
     */
    getCurrentLanguageValue(): string {
        return this.currentLanguageSubject.value;
    }

    /**
     * Get language code by name
     */
    getLanguageCodeByName(name: string): string {
        const language = this.availableLanguages.find((lang) => lang.name === name);
        return language ? language.code : 'en';
    }

    /**
     * Get language name by code
     */
    getLanguageNameByCode(code: string): string {
        const language = this.availableLanguages.find((lang) => lang.code === code);
        return language ? language.name : 'English';
    }

    /**
     * Get available languages
     */
    getAvailableLanguages(): Language[] {
        return this.availableLanguages;
    }

    /**
     * Get a translation using ngx-translate
     */
    instant(key: string, params?: any): string {
        return this.translate.instant(key, params);
    }

    /**
     * Get a translation observable
     */
    get(key: string, params?: any): Observable<string> {
        return this.translate.get(key, params);
    }

    // Add to TranslationService
    detectBrowserLanguage(): string {
        // Check navigator language
        const browserLang = navigator.language;

        // Extract the language code (e.g., 'en-US' -> 'en')
        const langCode = browserLang.split('-')[0];

        // Check if this language is supported
        const isSupported = this.availableLanguages.some((lang) => lang.code === langCode);

        // Return the language code if supported, otherwise return default
        return isSupported ? langCode : 'en';
    }

    /**
     * Preload all translations for all languages
     * This is useful to call at app startup
     */
    preloadAllTranslations(): Observable<boolean> {
        console.log('TranslationService: Preloading all translations');

        const langCodes = this.availableLanguages.map((lang) => lang.code);
        const observables: Observable<any>[] = [];

        // Request translations for each language
        langCodes.forEach((langCode) => {
            observables.push(
                // Use the built-in translate service to load which uses our FirestoreTranslateLoader
                from(this.translate.getTranslation(langCode)),
            );
        });

        // Wait for all translations to load
        return from(Promise.all(observables)).pipe(
            map(() => {
                console.log('TranslationService: All translations loaded');
                return true;
            }),
            catchError((error) => {
                console.error('TranslationService: Error preloading translations', error);
                return of(false);
            }),
        );
    }
}
