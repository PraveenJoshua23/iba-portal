import { Injectable, inject } from '@angular/core';
import { LanguageService } from './language.service';
import { Observable, from, map, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { collection, getDocs, getFirestore, query, setDoc, doc, deleteDoc } from '@angular/fire/firestore';

import { TranslationMap, translations } from './translations';

@Injectable({
    providedIn: 'root',
})
export class LanguageContentService {
    private languageService = inject(LanguageService);
    private firestore = getFirestore();
    
    // Translation dictionary
    private translations: TranslationMap = translations;
    
    // Storage keys
    private readonly TRANSLATIONS_STORAGE_KEY = 'translations';
    private readonly TRANSLATIONS_TIMESTAMP_KEY = 'translationsTimestamp';
    
    // Cache expiration time in milliseconds (24 hours)
    private readonly CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;
    
    constructor() {
        // Load translations from cache or fetch from Firestore
        this.loadTranslations();
    }
    
    /**
     * Loads translations from localStorage if present and not expired, otherwise fetches from Firestore
     */
    private loadTranslations(): void {
        const cachedTranslations = localStorage.getItem(this.TRANSLATIONS_STORAGE_KEY);
        const cachedTimestamp = localStorage.getItem(this.TRANSLATIONS_TIMESTAMP_KEY);
        
        const now = new Date().getTime();
        const isExpired = !cachedTimestamp || (now - parseInt(cachedTimestamp, 10)) > this.CACHE_EXPIRATION_TIME;
        
        if (cachedTranslations && !isExpired) {
            try {
                this.translations = JSON.parse(cachedTranslations);
                console.log('Translations loaded from localStorage');
            } catch (error) {
                console.error('Error parsing cached translations:', error);
                this.fetchTranslationsFromFirestore();
            }
        } else {
            this.fetchTranslationsFromFirestore();
        }
    }
    
    /**
     * Fetches translations from Firestore and caches them in localStorage
     */
    private fetchTranslationsFromFirestore(): void {
        const translationsCollection = collection(this.firestore, 'translations');
        
        getDocs(query(translationsCollection))
            .then((querySnapshot) => {
                const newTranslations: TranslationMap = {};
                
                querySnapshot.forEach((doc) => {
                    const key = doc.id;
                    const data = doc.data() as { [language: string]: string };
                    newTranslations[key] = data;
                });
                
                if (Object.keys(newTranslations).length === 0) {
                    // Fallback to default translations if none found in Firestore
                    console.log('No translations found in Firestore, using defaults');
                } else {
                    this.translations = { ...this.translations, ...newTranslations };
                    
                    // Cache translations in localStorage with timestamp
                    localStorage.setItem(this.TRANSLATIONS_STORAGE_KEY, JSON.stringify(this.translations));
                    localStorage.setItem(this.TRANSLATIONS_TIMESTAMP_KEY, new Date().getTime().toString());
                    console.log('Translations fetched from Firestore and cached');
                }
            })
            .catch((error) => {
                console.error('Error fetching translations from Firestore:', error);
                // Continue using default translations on error
            });
    }
    
    /**
     * Refreshes translations from Firestore, ignoring cache
     */
    refreshTranslations(): Observable<TranslationMap> {
        return from(getDocs(query(collection(this.firestore, 'translations')))).pipe(
            map(querySnapshot => {
                const newTranslations: TranslationMap = {};
                
                querySnapshot.forEach((doc) => {
                    const key = doc.id;
                    const data = doc.data() as { [language: string]: string };
                    newTranslations[key] = data;
                });
                
                if (Object.keys(newTranslations).length > 0) {
                    this.translations = { ...this.translations, ...newTranslations };
                    
                    // Update cache
                    localStorage.setItem(this.TRANSLATIONS_STORAGE_KEY, JSON.stringify(this.translations));
                    localStorage.setItem(this.TRANSLATIONS_TIMESTAMP_KEY, new Date().getTime().toString());
                }
                
                return this.translations;
            }),
            catchError(error => {
                console.error('Error refreshing translations:', error);
                return of(this.translations);
            })
        );
    }
    
    /**
     * Seeds the initial translations from the local translations.ts file to Firestore
     * This should be called only once or when you want to reset the translations in Firestore
     */
    seedTranslationsToFirestore(): Observable<boolean> {
        const translationsCollection = collection(this.firestore, 'translations');
        const batch = [];
        
        // Create a promise for each translation key
        for (const key in translations) {
            if (translations.hasOwnProperty(key)) {
                const translationRef = doc(translationsCollection, key);
                batch.push(setDoc(translationRef, translations[key]));
            }
        }
        
        // Execute all promises and return a single observable
        return from(Promise.all(batch)).pipe(
            map(() => {
                console.log('Successfully seeded translations to Firestore');
                return true;
            }),
            catchError(error => {
                console.error('Error seeding translations to Firestore:', error);
                return of(false);
            })
        );
    }
    
    /**
     * Updates a single translation in Firestore
     */
    updateTranslationInFirestore(key: string, translationData: { [language: string]: string }): Observable<boolean> {
        const translationRef = doc(collection(this.firestore, 'translations'), key);
        
        return from(setDoc(translationRef, translationData)).pipe(
            map(() => {
                console.log(`Successfully updated translation '${key}' in Firestore`);
                
                // Update local cache
                this.translations[key] = translationData;
                localStorage.setItem(this.TRANSLATIONS_STORAGE_KEY, JSON.stringify(this.translations));
                localStorage.setItem(this.TRANSLATIONS_TIMESTAMP_KEY, new Date().getTime().toString());
                
                return true;
            }),
            catchError(error => {
                console.error(`Error updating translation '${key}' in Firestore:`, error);
                return of(false);
            })
        );
    }
    
    /**
     * Updates multiple translations in Firestore
     */
    updateAllTranslationsInFirestore(translations: TranslationMap): Observable<boolean> {
        const batch = [];
        const translationsCollection = collection(this.firestore, 'translations');
        
        for (const key in translations) {
            if (translations.hasOwnProperty(key)) {
                const translationRef = doc(translationsCollection, key);
                batch.push(setDoc(translationRef, translations[key]));
            }
        }
        
        return from(Promise.all(batch)).pipe(
            map(() => {
                console.log('Successfully updated all translations in Firestore');
                
                // Update local cache
                this.translations = translations;
                localStorage.setItem(this.TRANSLATIONS_STORAGE_KEY, JSON.stringify(this.translations));
                localStorage.setItem(this.TRANSLATIONS_TIMESTAMP_KEY, new Date().getTime().toString());
                
                return true;
            }),
            catchError(error => {
                console.error('Error updating translations in Firestore:', error);
                return of(false);
            })
        );
    }
    
    /**
     * Deletes a translation from Firestore by key
     */
    deleteTranslationFromFirestore(key: string): Observable<boolean> {
        const translationRef = doc(collection(this.firestore, 'translations'), key);
        
        return from(deleteDoc(translationRef)).pipe(
            map(() => {
                console.log(`Successfully deleted translation '${key}' from Firestore`);
                
                // Update local cache
                if (this.translations[key]) {
                    delete this.translations[key];
                    localStorage.setItem(this.TRANSLATIONS_STORAGE_KEY, JSON.stringify(this.translations));
                    localStorage.setItem(this.TRANSLATIONS_TIMESTAMP_KEY, new Date().getTime().toString());
                }
                
                return true;
            }),
            catchError(error => {
                console.error(`Error deleting translation '${key}' from Firestore:`, error);
                return of(false);
            })
        );
    }

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
