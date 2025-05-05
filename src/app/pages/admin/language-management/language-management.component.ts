import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface LanguageManagementData {
    existingLanguages: string[];
}

@Component({
    selector: 'app-language-management-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatListModule],
    template: `
        <h2 mat-dialog-title>Manage Languages</h2>
        <div mat-dialog-content>
            <div class="flex flex-col gap-4">
                <div>
                    <h3 class="font-medium mb-2">Add New Language</h3>
                    <div class="flex gap-2">
                        <mat-form-field appearance="fill" class="w-full">
                            <mat-label>Language Name</mat-label>
                            <input matInput [formControl]="languageNameControl" placeholder="e.g. Telugu" />
                            <mat-error *ngIf="languageNameControl.hasError('required')"> Language name is required </mat-error>
                        </mat-form-field>
                        <mat-form-field appearance="fill">
                            <mat-label>Code</mat-label>
                            <input matInput [formControl]="languageCodeControl" placeholder="e.g. te" />
                            <mat-hint>2-letter code</mat-hint>
                            <mat-error *ngIf="languageCodeControl.hasError('required')"> Language code is required </mat-error>
                            <mat-error *ngIf="languageCodeControl.hasError('pattern')"> Should be 2 letters </mat-error>
                        </mat-form-field>
                        <button mat-raised-button color="primary" [disabled]="languageNameControl.invalid || languageCodeControl.invalid" (click)="addLanguage()">Add</button>
                    </div>
                </div>

                <div>
                    <h3 class="font-medium mb-2">Current Languages</h3>
                    <div class="language-list">
                        @for (lang of languages; track lang) {
                            <div class="language-item">
                                <span class="language-name">{{ lang }}</span>
                                <button mat-icon-button color="warn" (click)="removeLanguage(lang)" [disabled]="lang === 'English'" *ngIf="lang !== 'English'">
                                    <mat-icon>delete</mat-icon>
                                    <span class="sr-only">Remove {{ lang }}</span>
                                    @if (lang === 'English') {
                                        <span class="sr-only">English cannot be removed</span>
                                    }
                                </button>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
        <div mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancel</button>
            <button mat-raised-button color="primary" (click)="onSave()">Save Changes</button>
        </div>
    `,
    styles: [
        `
            .language-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .language-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background-color: #f5f5f5;
                border-radius: 4px;
                min-height: 48px;
            }
            .language-name {
                font-size: 16px;
            }
        `,
    ],
})
export class LanguageManagementDialogComponent implements OnInit {
    languages: string[] = [];
    languageNameControl = new FormControl('', [Validators.required]);
    languageCodeControl = new FormControl('', [Validators.required, Validators.pattern('[a-z]{2}')]);

    constructor(
        public dialogRef: MatDialogRef<LanguageManagementDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: LanguageManagementData,
    ) {}

    ngOnInit(): void {
        this.languages = [...this.data.existingLanguages];
    }

    addLanguage(): void {
        const languageName = this.languageNameControl.value;
        if (languageName && !this.languages.includes(languageName)) {
            this.languages.push(languageName);
            this.languageNameControl.reset();
            this.languageCodeControl.reset();
        }
    }

    removeLanguage(language: string): void {
        if (language !== 'English') {
            this.languages = this.languages.filter((lang) => lang !== language);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close(this.languages);
    }
}
