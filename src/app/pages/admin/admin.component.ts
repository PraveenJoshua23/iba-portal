import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { EditAllUserComponent } from '../edit-user/edit-all-user.component';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { DataService } from 'src/app/shared/services/data.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EditLessonComponent } from '../edit-lesson/edit-lesson.component';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslationMap } from 'src/app/shared/services/language/translations';
import { AddTranslationDialogComponent } from './add-translation-dialog/add-translation-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { TranslationService } from 'src/app/shared/services/language/language.service';
import { LanguageManagementDialogComponent } from './language-management/language-management.component';

@Component({
    selector: 'app-admin',
    standalone: true,
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatDialogModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        FormsModule,
        EditAllUserComponent,
        EditLessonComponent,
        MatTabsModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
    ],
})
export class AdminComponent implements OnInit {
    translations: TranslationMap = {};
    translationKeys: string[] = [];
    availableLanguages: string[] = [];
    rightLanguage: string = 'Tamil'; // Default right-side language
    editedTranslations: { [key: string]: string } = {};
    isSaving: boolean = false;
    isLoading: boolean = true;
    saveMessage: string = '';
    displayedColumns: string[] = ['id', 'name', 'language', 'networker', 'instructor', 'class', 'progress', 'action'];
    dataSource = new MatTableDataSource<any>([]);
    visibleRowCount = 5; // Default number of visible rows
    searchTerm: string = '';
    originalData: any = [];
    appearance: MatFormFieldAppearance = 'fill';
    selectedTabIndex = 0;

    // Service injections
    private translationService = inject(TranslationService);
    private snackBar = inject(MatSnackBar);
    private ds = inject(DataService);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        public dialog: MatDialog,
        private _liveAnnouncer: LiveAnnouncer,
    ) {}

    ngOnInit(): void {
        // Load available languages from service
        this.availableLanguages = this.translationService.getAvailableLanguages().map((lang) => lang.name);

        // Load translations from Firebase
        this.loadTranslationsFromFirebase();
    }

    onLanguageChange(lang: string) {
        this.rightLanguage = lang;
    }

    onTranslationEdit(key: string, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.editedTranslations[key] = value;
        this.translations[key][this.rightLanguage] = value;
    }

    saveTranslations() {
        this.isSaving = true;
        this.saveMessage = '';

        // Convert translations object to key-by-key format for the service
        const savePromises = [];
        for (const key of this.translationKeys) {
            const translations = this.translations[key];
            savePromises.push(this.translationService.updateTranslation(key, translations));
        }

        // Use Promise.all to wait for all updates
        Promise.all(savePromises)
            .then(() => {
                this.saveMessage = 'Translations saved to Firebase successfully!';
                this.snackBar.open('Translations saved successfully!', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                });
            })
            .catch((error) => {
                console.error('Error saving translations:', error);
                this.saveMessage = 'Failed to save translations to Firebase';
                this.snackBar.open('Failed to save translations', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                });
            })
            .finally(() => {
                this.isSaving = false;
            });
    }

    loadTranslationsFromFirebase(): void {
        this.isLoading = true;
        this.translationService.refreshTranslations().subscribe({
            next: () => {
                // Get all translations
                this.translations = {};
                this.translationKeys = [];

                this.availableLanguages.forEach((langName) => {
                    // Get language code
                    const langCode = this.translationService.getLanguageCodeByName(langName);

                    // Get translations for this language
                    const langTranslations = this.getAllTranslationsForLanguage(langName);

                    // Add to our translations object
                    for (const key in langTranslations) {
                        if (!this.translations[key]) {
                            this.translations[key] = {};
                            this.translationKeys.push(key);
                        }
                        this.translations[key][langName] = langTranslations[key];
                    }
                });

                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading translations:', error);
                this.isLoading = false;
            },
        });
    }

    // Helper method to get all translations for a language
    getAllTranslationsForLanguage(language: string): { [key: string]: string } {
        const langCode = this.translationService.getLanguageCodeByName(language);
        return this.translationService.translate?.store?.translations[langCode] || {};
    }

    // Method to handle tab change events if needed
    onTabChange(event: any): void {
        this.selectedTabIndex = event.index;
        // You can add logic here if needed when tabs change
    }

    // Open dialog to add a new translation
    openAddTranslationDialog(): void {
        const dialogRef = this.dialog.open(AddTranslationDialogComponent, {
            width: '500px',
            data: { availableLanguages: this.availableLanguages },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Add the new translation to the translations object
                this.translations[result.key] = result.translations;

                // Update the keys array to include the new key
                this.translationKeys = Object.keys(this.translations);

                // Save the new translation to Firebase
                this.translationService.updateTranslation(result.key, result.translations);
            }
        });
    }

    /**
     * Delete a translation by key
     */
    deleteTranslation(key: string): void {
        if (confirm(`Are you sure you want to delete the translation for "${key}"?`)) {
            this.isLoading = true;

            // Remove translation from all languages
            this.deleteTranslationFromFirestore(key).then((success) => {
                this.isLoading = false;
                if (success) {
                    // Remove from local array
                    delete this.translations[key];
                    this.translationKeys = this.translationKeys.filter((k) => k !== key);

                    this.snackBar.open(`Translation "${key}" deleted successfully!`, 'Close', {
                        duration: 3000,
                    });
                } else {
                    this.snackBar.open(`Failed to delete translation "${key}"`, 'Close', {
                        duration: 3000,
                    });
                }
            });
        }
    }

    // Helper method to delete a translation from Firestore
    // This is a temporary solution until you add this method to your TranslationService
    private deleteTranslationFromFirestore(key: string): Promise<boolean> {
        // You should implement this method in your TranslationService
        return Promise.resolve(false);
    }

    // Add a method to open the language management dialog
    openLanguageManagementDialog(): void {
        const dialogRef = this.dialog.open(LanguageManagementDialogComponent, {
            width: '600px',
            data: { existingLanguages: this.availableLanguages },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Update languages
                this.availableLanguages = result;

                // Check if we need to change the selected language
                if (!this.availableLanguages.includes(this.rightLanguage)) {
                    this.rightLanguage = 'English';
                }

                // Update translations with new languages
                this.updateTranslationsWithLanguages(result);
            }
        });
    }

    // Add a method to update translations with new languages
    updateTranslationsWithLanguages(languages: string[]): void {
        // Add missing languages to all translations
        for (const key of this.translationKeys) {
            for (const lang of languages) {
                if (!this.translations[key][lang]) {
                    this.translations[key][lang] = '';
                }
            }
        }

        // Save updated translations to Firestore
        this.saveTranslations();
    }
}
