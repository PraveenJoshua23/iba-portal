import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
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
import { UserFilterPipe } from '../../shared/pipes/user-filter.pipe';
import { Observable } from 'rxjs';
import { EditClassComponent } from '../edit-class/edit-class.component';
import { EditLessonComponent } from '../edit-lesson/edit-lesson.component';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { translations as initialTranslations, TranslationMap } from 'src/app/shared/services/language/translations';
import { AddTranslationDialogComponent } from './add-translation-dialog/add-translation-dialog.component';
// Browser-compatible approach for saving translations

@Component({
    selector: 'app-admin',
    standalone: true,
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    imports: [CommonModule, MatTableModule, MatButtonModule, MatDialogModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, FormsModule, EditAllUserComponent, EditClassComponent, EditLessonComponent, MatTabsModule],
})
export class AdminComponent implements OnInit {
    // --- Translations Management ---
    translations: TranslationMap = JSON.parse(JSON.stringify(initialTranslations)); // Deep copy for editing
    translationKeys: string[] = Object.keys(initialTranslations);
    availableLanguages: string[] = Array.from(
        new Set(
            Object.values(initialTranslations).flatMap(obj => Object.keys(obj))
        )
    );
    rightLanguage: string = 'Tamil'; // Default right-side language
    editedTranslations: { [key: string]: string } = {};
    isSaving: boolean = false;
    saveMessage: string = '';

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
        const fileContent =
`export interface TranslationMap {
    [key: string]: {
        [language: string]: string;
    };
}

export const translations: TranslationMap = ${JSON.stringify(this.translations, null, 4)};
`;
        
        try {
            // Browser-only approach: Show code for manual copy
            this.isSaving = false;
            this.saveMessage = 'Copy the below code into translations.ts:';
            // You could show fileContent in a modal or textarea for copy
            alert('Copy the following into translations.ts:\n\n' + fileContent);
            
            // Alternative: Create a downloadable file
            const blob = new Blob([fileContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'translations.ts';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            this.isSaving = false;
            this.saveMessage = 'Failed to save: ' + e;
        }
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
        //  this.getAllUsers();
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
            data: { availableLanguages: this.availableLanguages }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Add the new translation to the translations object
                this.translations[result.key] = result.translations;
                
                // Update the keys array to include the new key
                this.translationKeys = Object.keys(this.translations);
                
                // Show a temporary message
                this.saveMessage = 'New translation added. Remember to save changes!';
                setTimeout(() => {
                    if (this.saveMessage === 'New translation added. Remember to save changes!') {
                        this.saveMessage = '';
                    }
                }, 3000);
            }
        });
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
