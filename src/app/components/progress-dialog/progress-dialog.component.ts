import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressService } from 'src/app/shared/services/progress/progress.service';
import { IProgress, CategoryProgress, LessonsProgress } from 'src/app/shared/models/progress.interface';
import { LessonsService } from 'src/app/shared/services/lessons/lessons.service';

@Component({
    selector: 'app-progress-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatExpansionModule, MatProgressBarModule, MatIconModule, MatSlideToggleModule, FormsModule],
    templateUrl: './progress-dialog.component.html',
    styleUrls: ['./progress-dialog.component.scss'],
})
export class ProgressDialogComponent implements OnInit {
    progressData: IProgress | null = null;
    isLoading = true;
    editMode = signal(false);
    selectedLanguage = 'en'; // Default language

    // Available languages for selection
    availableLanguages = [
        { code: 'en', name: 'English' },
        { code: 'ta', name: 'Tamil' },
        { code: 'te', name: 'Telugu' },
        { code: 'hi', name: 'Hindi' },
        { code: 'or', name: 'Odia' },
    ];

    // Inject services
    progressService = inject(ProgressService);
    lessonsService = inject(LessonsService);
    snackBar = inject(MatSnackBar);

    constructor(
        private dialogRef: MatDialogRef<ProgressDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { email: string; userName: string },
    ) {}

    ngOnInit(): void {
        this.loadProgressData();
    }

    async loadProgressData(): Promise<void> {
        try {
            // Get progress data for this user
            const progress = await this.progressService.getProgressByEmail(this.data.email);
            this.progressData = progress;

            // Set language based on user preference if available
            if (this.progressData && this.progressData.email) {
                const userEmail = this.progressData.email;
                // Get user's language preference (you might need to modify this based on your data structure)
                // For now, use default English
                this.selectedLanguage = 'en';
            }

            this.isLoading = false;
        } catch (error) {
            console.error('Error loading progress data:', error);
            this.snackBar.open('Error loading progress data', 'Close', { duration: 3000 });
            this.isLoading = false;
        }
    }

    toggleEditMode(): void {
        this.editMode.update((value) => !value);
    }

    getCategoryProgress(progress: string | undefined): number {
        if (!progress) return 0;
        return parseFloat(progress) || 0;
    }

    getLessonProgress(progress: string | undefined): number {
        if (!progress) return 0;
        return parseFloat(progress) || 0;
    }

    getFormattedDate(timestamp: any): string {
        if (!timestamp) return 'Not started';

        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Check if a language exists for a category
    languageExistsForCategory(category: CategoryProgress, language: string): boolean {
        return !!category?.languageProgress && !!category.languageProgress[language];
    }

    // Get the appropriate lessons array based on selected language
    getLessonsForLanguage(category: CategoryProgress): LessonsProgress[] {
        if (!category || !category.languageProgress) {
            return [];
        }

        if (!this.languageExistsForCategory(category, this.selectedLanguage)) {
            // Fall back to English if the selected language doesn't exist
            if (this.languageExistsForCategory(category, 'en')) {
                return category.languageProgress['en'].lessons || [];
            }
            return [];
        }
        return category.languageProgress[this.selectedLanguage].lessons || [];
    }

    // Get the language name from the code
    getLanguageName(languageCode: string): string {
        const language = this.availableLanguages.find((l) => l.code === languageCode);
        return language ? language.name : 'Unknown';
    }

    // Get language-specific progress for a category
    getLanguageProgress(category: CategoryProgress): string {
        if (!category || !category.languageProgress) {
            return '0';
        }

        if (!this.languageExistsForCategory(category, this.selectedLanguage)) {
            // Fall back to English if the selected language doesn't exist
            if (this.languageExistsForCategory(category, 'en')) {
                return category.languageProgress['en'].progress || '0';
            }
            return '0';
        }
        return category.languageProgress[this.selectedLanguage].progress || '0';
    }

    // Methods for editing progress
    updateLessonCompletion(category: CategoryProgress, lesson: LessonsProgress, completed: boolean): void {
        if (!this.editMode()) return;
        if (!category || !category.languageProgress) return;
        if (!this.languageExistsForCategory(category, this.selectedLanguage)) return;

        const lessons = category.languageProgress[this.selectedLanguage].lessons;
        if (!lessons) return;

        const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
        if (lessonIndex === -1) return;

        lessons[lessonIndex].completed = completed;
        lessons[lessonIndex].progress = completed ? '100' : lessons[lessonIndex].progress || '0';

        if (completed && !lessons[lessonIndex].completedDate) {
            lessons[lessonIndex].completedDate = {
                seconds: Math.floor(Date.now() / 1000),
                nanoseconds: 0,
            };
        }

        // If marking as incomplete, remove completion date
        if (!completed) {
            lessons[lessonIndex].completedDate = null;
        }

        // Update the language progress percentage
        this.updateLanguageProgress(category);
    }

    updateLessonLock(category: CategoryProgress, lesson: LessonsProgress, locked: boolean): void {
        if (!this.editMode()) return;
        if (!category || !category.languageProgress) return;
        if (!this.languageExistsForCategory(category, this.selectedLanguage)) return;

        const lessons = category.languageProgress[this.selectedLanguage].lessons;
        if (!lessons) return;

        const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
        if (lessonIndex === -1) return;

        lessons[lessonIndex].locked = locked;
    }

    // Helper method to update language progress percentage
    private updateLanguageProgress(category: CategoryProgress): void {
        if (!category || !category.languageProgress) return;
        if (!this.languageExistsForCategory(category, this.selectedLanguage)) return;

        const lessons = category.languageProgress[this.selectedLanguage].lessons;
        if (!lessons || lessons.length === 0) return;

        let totalProgress = 0;

        lessons.forEach((lesson) => {
            totalProgress += parseFloat(lesson.progress || '0');
        });

        const avgProgress = Math.round(totalProgress / lessons.length);
        category.languageProgress[this.selectedLanguage].progress = avgProgress.toString();

        // Update overall category progress based on all languages
        this.updateCategoryProgress(category);
    }

    // Helper method to update overall category progress
    private updateCategoryProgress(category: CategoryProgress): void {
        if (!category || !category.languageProgress) return;

        let totalProgress = 0;
        let languageCount = 0;

        Object.values(category.languageProgress).forEach((langProgress) => {
            if (langProgress && langProgress.progress) {
                totalProgress += parseFloat(langProgress.progress);
                languageCount++;
            }
        });

        const avgProgress = languageCount > 0 ? Math.round(totalProgress / languageCount) : 0;
        category.progress = avgProgress.toString();
    }

    saveChanges(): void {
        if (!this.progressData) return;

        this.isLoading = true;

        // Update the progress in Firestore
        this.progressService.updateProgress(this.data.email, this.progressData).subscribe({
            next: () => {
                this.snackBar.open('Progress updated successfully', 'Close', { duration: 3000 });
                this.editMode.set(false);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error updating progress:', error);
                this.snackBar.open('Error updating progress', 'Close', { duration: 3000 });
                this.isLoading = false;
            },
        });
    }

    close(): void {
        this.dialogRef.close();
    }
}
