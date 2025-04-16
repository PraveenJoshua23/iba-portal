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

    // Inject services
    progressService = inject(ProgressService);
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

    getCategoryProgress(progress: string): number {
        return parseFloat(progress) || 0;
    }

    getLessonProgress(progress: string): number {
        return parseFloat(progress) || 0;
    }

    getFormattedDate(timestamp: any): string {
        if (!timestamp) return 'Not started';

        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Methods for editing progress
    updateLessonCompletion(category: CategoryProgress, lesson: LessonsProgress, completed: boolean): void {
        if (!this.editMode()) return;

        lesson.completed = completed;
        lesson.progress = completed ? '100' : lesson.progress;

        if (completed && !lesson.completedDate) {
            lesson.completedDate = {
                seconds: Math.floor(Date.now() / 1000),
                nanoseconds: 0,
            };
        }

        // If marking as incomplete, remove completion date
        if (!completed) {
            lesson.completedDate = null;
        }
    }

    updateLessonLock(category: CategoryProgress, lesson: LessonsProgress, locked: boolean): void {
        if (!this.editMode()) return;
        lesson.locked = locked;
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
