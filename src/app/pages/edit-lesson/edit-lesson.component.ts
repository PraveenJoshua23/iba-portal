import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LessonsService } from 'src/app/shared/services/lessons/lessons.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ILesson } from 'src/app/shared/models/lessons.interface';
import { Storage, deleteObject, getDownloadURL, ref, uploadBytesResumable } from '@angular/fire/storage';
import { Firestore, addDoc, collection, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';

@Component({
    selector: 'app-edit-lesson',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatPaginatorModule, MatSortModule, MatIconModule, MatDialogModule, FormsModule, ReactiveFormsModule],
    templateUrl: './edit-lesson.component.html',
    styleUrl: './edit-lesson.component.scss',
})
export class EditLessonComponent implements OnInit {
    // Table configuration
    displayedColumns: string[] = ['lessonNo', 'name', 'category', 'language', 'description', 'actions'];
    dataSource = new MatTableDataSource<ILesson>([]);

    // UI controls
    isLoading = false;
    isEditing = false;
    uploadProgress = 0;
    selectedFile: File | null = null;
    showForm = false;

    // Notification handling
    notification = {
        show: false,
        message: '',
        type: 'success', // 'success', 'error', 'info'
    };

    // Form configuration
    lessonForm: FormGroup;
    categories = [
        { value: 'bb', display: 'Beginning Basics' },
        { value: 'intro', display: 'Introductory' },
        { value: 'intermediate', display: 'Intermediate' },
        { value: 'advanced', display: 'Advanced' },
    ];
    languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic'];

    // Pagination
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    // Services
    lessonsService = inject(LessonsService);
    dataService = inject(DataService);
    storage = inject(Storage);
    firestore = inject(Firestore);
    fb = inject(FormBuilder);
    // We'll use a custom notification method instead of MatSnackBar

    constructor(public dialog: MatDialog) {
        this.lessonForm = this.fb.group({
            id: [''],
            name: ['', Validators.required],
            description: ['', Validators.required],
            lessonNo: ['', Validators.required],
            category: ['', Validators.required],
            language: ['', Validators.required],
            path: [''],
            instructor: [''],
        });
    }

    ngOnInit(): void {
        this.loadLessons();
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    loadLessons(): void {
        this.isLoading = true;

        // Use the existing data service method to get all lessons
        this.dataService.getAllLessons().subscribe({
            next: (lessons) => {
                // Get more detailed lesson data from subcollections
                this.loadAllLessonCategories();
            },
            error: (error) => {
                console.error('Error loading lessons:', error);
                this.showNotification('Failed to load lessons', 'error');
                this.isLoading = false;
            },
        });
    }

    loadAllLessonCategories(): void {
        const allLessons: ILesson[] = [];
        const categories = ['bb', 'intro', 'intermediate', 'advanced'];
        let completedCategories = 0;

        categories.forEach((category) => {
            this.dataService.getAllLessonSubCollection(category).subscribe({
                next: (lessons) => {
                    lessons.forEach((lesson: ILesson) => {
                        // Ensure the category is set on the lesson object if it's not already there
                        if (!lesson.category) {
                            lesson.category = category as any;
                        }
                        allLessons.push(lesson);
                    });

                    completedCategories++;
                    if (completedCategories === categories.length) {
                        this.dataSource.data = allLessons;
                        this.isLoading = false;
                    }
                },
                error: (error) => {
                    console.error(`Error loading ${category} lessons:`, error);
                    completedCategories++;
                    if (completedCategories === categories.length) {
                        this.dataSource.data = allLessons;
                        this.isLoading = false;
                    }
                },
            });
        });
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    // Custom notification methods
    showNotification(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
        this.notification = {
            show: true,
            message,
            type,
        };

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.notification.show = false;
        }, 3000);
    }

    hideNotification(): void {
        this.notification.show = false;
    }

    // CRUD Operations
    openAddLessonForm(): void {
        this.resetForm();
        this.isEditing = false;
        this.showForm = true;
    }

    openEditLessonForm(lesson: ILesson): void {
        this.lessonForm.patchValue({
            id: lesson.id,
            name: lesson.name,
            description: lesson.description,
            lessonNo: lesson.lessonNo,
            category: lesson.category,
            language: lesson.language,
            path: lesson.path,
            instructor: lesson.instructor,
        });

        this.isEditing = true;
        this.showForm = true;
    }

    resetForm(): void {
        this.lessonForm.reset();
        this.selectedFile = null;
        this.uploadProgress = 0;
    }

    cancelForm(): void {
        this.showForm = false;
        this.resetForm();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
        }
    }

    async saveLesson(): Promise<void> {
        if (this.lessonForm.invalid) {
            this.showNotification('Please fill all required fields', 'error');
            return;
        }

        this.isLoading = true;
        const lessonData = this.lessonForm.value;
        const category = lessonData.category;

        try {
            // If there's a new file selected, upload it first
            if (this.selectedFile) {
                const path = await this.uploadLessonVideo(category, lessonData.language, this.selectedFile);
                lessonData.path = path;
            }

            if (this.isEditing) {
                await this.updateLesson(lessonData);
            } else {
                await this.createLesson(lessonData);
            }

            this.showForm = false;
            this.resetForm();
            this.loadLessons();
            this.showNotification('Lesson saved successfully', 'success');
        } catch (error) {
            console.error('Error saving lesson:', error);
            this.showNotification('Failed to save lesson', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async createLesson(lessonData: Partial<ILesson>): Promise<void> {
        const category = lessonData.category;
        const lessonCollectionRef = collection(this.firestore, `lessons/${category}/lesson`);

        // Remove id if it's empty (for new lessons)
        if (!lessonData.id) {
            delete lessonData.id;
        }

        await addDoc(lessonCollectionRef, lessonData as ILesson);
    }

    async updateLesson(lessonData: Partial<ILesson>): Promise<void> {
        const category = lessonData.category;
        const lessonId = lessonData.id;

        if (!lessonId) {
            throw new Error('Lesson ID is missing for update operation');
        }

        const lessonDocRef = doc(this.firestore, `lessons/${category}/lesson/${lessonId}`);

        // Remove id from the data to be updated (Firestore doesn't need it in the document data)
        const { id, ...updateData } = lessonData;

        await updateDoc(lessonDocRef, updateData);
    }

    async deleteLesson(lesson: ILesson): Promise<void> {
        if (confirm(`Are you sure you want to delete lesson "${lesson.name}"?`)) {
            try {
                this.isLoading = true;
                const category = lesson.category;
                const lessonId = lesson.id;

                // Delete the document from Firestore
                const lessonDocRef = doc(this.firestore, `lessons/${category}/lesson/${lessonId}`);
                await deleteDoc(lessonDocRef);

                // Delete the video from storage if it exists
                if (lesson.path) {
                    const storagePath = `lessons/${category}/${lesson.language}/${lesson.path}.mp4`;
                    const storageRef = ref(this.storage, storagePath);

                    try {
                        await deleteObject(storageRef);
                    } catch (error) {
                        console.warn('Video file may not exist:', error);
                    }
                }

                this.loadLessons();
                this.showNotification('Lesson deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting lesson:', error);
                this.showNotification('Failed to delete lesson', 'error');
            } finally {
                this.isLoading = false;
            }
        }
    }

    async uploadLessonVideo(category: string, language: string, file: File): Promise<string> {
        // Generate a unique path for the file (excluding extension)
        const timestamp = new Date().getTime();
        const uniquePath = `lesson_${timestamp}`;
        const storagePath = `lessons/${category}/${language}/${uniquePath}.mp4`;
        const storageRef = ref(this.storage, storagePath);

        return new Promise<string>((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                },
                (error) => {
                    console.error('Upload failed:', error);
                    reject(error);
                },
                async () => {
                    try {
                        await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(uniquePath); // Return just the unique path without extension
                    } catch (error) {
                        reject(error);
                    }
                },
            );
        });
    }
}
