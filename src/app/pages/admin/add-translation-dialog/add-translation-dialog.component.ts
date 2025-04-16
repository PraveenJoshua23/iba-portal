import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface TranslationDialogData {
  availableLanguages: string[];
}

@Component({
  selector: 'app-add-translation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './add-translation-dialog.component.html',
})
export class AddTranslationDialogComponent {
  translationKey: string = '';
  translations: { [language: string]: string } = {};

  constructor(
    public dialogRef: MatDialogRef<AddTranslationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TranslationDialogData
  ) {
    // Initialize the translations object with empty strings for each language
    if (data.availableLanguages) {
      data.availableLanguages.forEach(lang => {
        this.translations[lang] = '';
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.translationKey.trim()) {
      return;
    }

    // Return the new translation
    this.dialogRef.close({
      key: this.translationKey,
      translations: this.translations
    });
  }
}
