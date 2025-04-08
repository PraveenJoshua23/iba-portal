import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
    name: string;
    code: string;
}

@Injectable({
    providedIn: 'root',
})
export class LanguageService {
    private availableLanguages: Language[] = [
        { name: 'English', code: 'English' },
        { name: 'Tamil', code: 'Tamil' },
        // Add more languages as needed
    ];

    private currentLanguageSubject = new BehaviorSubject<string>('English');

    constructor() {
        // Load initial language preference from localStorage if available
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) {
            this.currentLanguageSubject.next(savedLanguage);
        }
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
}
