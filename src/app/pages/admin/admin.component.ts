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
import { translations as initialTranslations, TranslationMap } from 'src/app/shared/services/language/translations';
import { AddTranslationDialogComponent } from './add-translation-dialog/add-translation-dialog.component';
import { LanguageContentService } from 'src/app/shared/services/language/language-content.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

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
    // --- Translations Management ---
    translations: TranslationMap = {};
    translationKeys: string[] = [];
    availableLanguages: string[] = [];
    rightLanguage: string = 'Tamil'; // Default right-side language
    editedTranslations: { [key: string]: string } = {};
    isSaving: boolean = false;
    isLoading: boolean = true;
    saveMessage: string = '';
    
    // Service injections
    private languageContentService = inject(LanguageContentService);
    private snackBar = inject(MatSnackBar);

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
        
        // Save to Firebase Firestore
        this.languageContentService.updateAllTranslationsInFirestore(this.translations)
            .pipe(finalize(() => this.isSaving = false))
            .subscribe(success => {
                if (success) {
                    this.saveMessage = 'Translations saved to Firebase successfully!';
                    this.snackBar.open('Translations saved successfully!', 'Close', {
                        duration: 3000,
                        horizontalPosition: 'center',
                        verticalPosition: 'bottom',
                    });
                    
                    // Also generate a downloadable backup file
                    const fileContent = `export interface TranslationMap {
    [key: string]: {
        [language: string]: string;
    };
}

export const translations: TranslationMap = ${JSON.stringify(this.translations, null, 4)};
`;
                    
                    const blob = new Blob([fileContent], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'translations_backup.ts';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    this.saveMessage = 'Failed to save translations to Firebase';
                    this.snackBar.open('Failed to save translations', 'Close', {
                        duration: 3000,
                        horizontalPosition: 'center',
                        verticalPosition: 'bottom',
                    });
                }
            });
    }
    // --- End Translations Management ---
    displayedColumns: string[] = ['id', 'name', 'language', 'networker', 'instructor', 'class', 'progress', 'action'];
    dataSource = new MatTableDataSource<any>([]);
    visibleRowCount = 5; // Default number of visible rows
    searchTerm: string = '';
    originalData: any = [];
    appearance: MatFormFieldAppearance = 'fill';
    selectedTabIndex = 0;

    ds = inject(DataService);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        public dialog: MatDialog,
        private _liveAnnouncer: LiveAnnouncer,
    ) {}

    ngOnInit(): void {
        // Load translations from Firebase
        this.loadTranslationsFromFirebase();
    }
    
    /**
     * Load translations from Firebase
     */
    loadTranslationsFromFirebase(): void {
        this.isLoading = true;
        this.languageContentService.refreshTranslations()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe(translations => {
                this.translations = translations;
                this.translationKeys = Object.keys(this.translations);
                this.availableLanguages = Array.from(
                    new Set(Object.values(this.translations).flatMap(obj => Object.keys(obj)))
                );
                console.log('Translations loaded from Firebase:', this.translations);
            });
    }
    
    /**
     * Seed initial translations to Firebase
     */
    seedTranslationsToFirebase(): void {
        if (confirm('This will overwrite any existing translations in Firebase with the default translations. Continue?')) {
            this.isLoading = true;
            this.languageContentService.seedTranslationsToFirestore()
                .pipe(finalize(() => this.isLoading = false))
                .subscribe(success => {
                    if (success) {
                        this.snackBar.open('Translations seeded to Firebase successfully!', 'Close', {
                            duration: 3000,
                        });
                        // Reload translations
                        this.loadTranslationsFromFirebase();
                    } else {
                        this.snackBar.open('Failed to seed translations to Firebase', 'Close', {
                            duration: 3000,
                        });
                    }
                });
        }
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
                this.languageContentService.updateTranslationInFirestore(result.key, result.translations)
                    .subscribe(success => {
                        if (success) {
                            this.snackBar.open('New translation added successfully!', 'Close', {
                                duration: 3000,
                            });
                        } else {
                            this.snackBar.open('Translation added locally but failed to save to Firebase', 'Close', {
                                duration: 3000,
                            });
                        }
                    });
            }
        });
    }
    
    /**
     * Delete a translation by key
     */
    deleteTranslation(key: string): void {
        if (confirm(`Are you sure you want to delete the translation for "${key}"?`)) {
            this.isLoading = true;
            this.languageContentService.deleteTranslationFromFirestore(key)
                .pipe(finalize(() => this.isLoading = false))
                .subscribe(success => {
                    if (success) {
                        // Remove from local array
                        delete this.translations[key];
                        this.translationKeys = Object.keys(this.translations);
                        
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

    // openDialog(item:any) {
    //   console.log(item)
    //   const dialogRef = this.dialog.open(EditUserComponent,{
    //     data: item
    //   });

    //   dialogRef.afterClosed().subscribe(result => {
    //     console.log(`Dialog result: ${result}`);
    //   });
    // }

    // // Function to update the number of visible rows
    // updateVisibleRows(count: number) {
    //   this.visibleRowCount = count;
    // }

    // ngAfterViewInit() {
    //   this.dataSource.paginator = this.paginator;
    // }

    // getAllUsers(){
    //   return this.ds.getAllUsersData().subscribe(users=>{
    //     this.dataSource.data = users;
    //     this.originalData = this.dataSource.data;
    //     this.dataSource.sort = this.sort;
    //   })
    // }

    // applyFilter(event: Event) {
    //   const filterValue = (event.target as HTMLInputElement).value;
    //   this.searchTerm = filterValue.trim().toLowerCase();
    //   console.log(filterValue)
    //   this.dataSource.data = this.searchTerm ?
    //     this.originalData.filter((user: { name: string; }) =>
    //       user.name.toLowerCase().includes(this.searchTerm)
    //       // ... add more filter conditions for other fields
    //     ) : this.originalData;

    //     console.log(this.dataSource.data)
    // }

    // announceSortChange(sortState: Sort) {
    //   if (sortState.direction) {
    //     this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    //   } else {
    //     this._liveAnnouncer.announce('Sorting cleared');
    //   }
    //   }
}
