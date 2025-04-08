import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { LessonsService } from 'src/app/shared/services/lessons/lessons.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ILesson } from 'src/app/shared/models/lessons.interface';
import { Storage, deleteObject, getDownloadURL, ref, uploadBytesResumable } from '@angular/fire/storage';
import { Firestore, addDoc, collection, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';
import { VimeoService } from 'src/app/shared/services/vimeo/vimeo.service';
import { firstValueFrom } from 'rxjs';
import { VimeoMappingService, IVimeoMapping } from 'src/app/shared/services/vimeo/vimeo-mapping.service';

@Component({
    selector: 'app-edit-lesson',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatPaginatorModule, MatSortModule, MatIconModule, MatDialogModule, FormsModule, ReactiveFormsModule],
    templateUrl: './edit-lesson.component.html',
    styleUrl: './edit-lesson.component.scss',
})
export class EditLessonComponent implements OnInit {
    // Table configuration
    displayedColumns: string[] = ['lessonNo', 'name', 'category', 'language', 'vimeoIds', 'description', 'actions'];
    dataSource = new MatTableDataSource<ILesson>([]);

    // UI controls
    isLoading = false;
    isEditing = false;
    uploadProgress = 0;
    selectedFile: File | null = null;
    showForm = false;
    isTestingVimeo = false;
    vimeoTestMessage = '';
    vimeoTestType: 'success' | 'error' | 'info' = 'info';
    currentTestingLang: string = '';

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
    languages = ['English', 'Tamil', 'Hindi', 'Telugu', 'Odia'];
    instructors = ['Instructor 1', 'Instructor 2', 'Instructor 3'];
    languageCodes = {
        English: 'en',
        Tamil: 'ta',
        Telugu: 'te',
        Hindi: 'hi',
        Odia: 'or',
    };

    // Pagination
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    // Services
    lessonsService = inject(LessonsService);
    dataService = inject(DataService);
    storage = inject(Storage);
    firestore = inject(Firestore);
    fb = inject(FormBuilder);
    vimeoService = inject(VimeoService);
    vimeoMappingService = inject(VimeoMappingService);

    constructor(public dialog: MatDialog) {
        this.lessonForm = this.fb.group({
            id: [''],
            name: ['', Validators.required],
            description: ['', Validators.required],
            lessonNo: ['', Validators.required],
            category: ['', Validators.required],
            language: ['', Validators.required],
            path: [''],
            vimeoEntries: this.fb.array([]), // Form array for language-specific Vimeo IDs
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

    // Getter for vimeoEntries form array
    get vimeoEntries(): FormArray {
        return this.lessonForm.get('vimeoEntries') as FormArray;
    }

    // Create a new vimeo entry form group
    createVimeoEntry(language: string = '', vimeoId: string = ''): FormGroup {
        return this.fb.group({
            language: [language, Validators.required],
            vimeoId: [vimeoId, Validators.required],
        });
    }

    // Add a new vimeo entry to the form array
    addVimeoEntry(language: string = '', vimeoId: string = ''): void {
        this.vimeoEntries.push(this.createVimeoEntry(language, vimeoId));
    }

    // Remove a vimeo entry from the form array
    removeVimeoEntry(index: number): void {
        this.vimeoEntries.removeAt(index);
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
        this.resetForm(); // Clear the form first

        // Patch the basic info
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

        // Add entries for each language-specific Vimeo ID
        if (lesson.vimeoIds) {
            Object.entries(lesson.vimeoIds).forEach(([lang, id]) => {
                // Find a human-readable language name for the code
                const languageName = Object.entries(this.languageCodes).find(([name, code]) => code === lang)?.[0] || lang;
                this.addVimeoEntry(languageName, id);
            });
        }

        // If there are no entries, add an empty one for the lesson's main language
        if (this.vimeoEntries.length === 0) {
            this.addVimeoEntry(lesson.language, '');
        }

        this.isEditing = true;
        this.showForm = true;
    }

    resetForm(): void {
        this.lessonForm.reset();

        // Clear the vimeoEntries form array
        while (this.vimeoEntries.length > 0) {
            this.vimeoEntries.removeAt(0);
        }

        this.selectedFile = null;
        this.uploadProgress = 0;
        this.vimeoTestMessage = '';
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

    // Test Vimeo ID for a specific language
    async testVimeoId(index: number): Promise<void> {
        const entry = this.vimeoEntries.at(index) as FormGroup;
        const vimeoId = entry.get('vimeoId')?.value;
        const language = entry.get('language')?.value;

        if (!vimeoId) {
            this.vimeoTestMessage = 'Please enter a Vimeo ID to test';
            this.vimeoTestType = 'error';
            this.currentTestingLang = language;
            return;
        }

        this.isTestingVimeo = true;
        this.vimeoTestMessage = `Testing Vimeo ID for ${language}...`;
        this.vimeoTestType = 'info';
        this.currentTestingLang = language;

        try {
            const details = await firstValueFrom(this.vimeoService.getVideoDetails(vimeoId));
            this.vimeoTestMessage = `Vimeo video for ${language} found: "${details.name}" (Duration: ${Math.floor(details.duration / 60)}m ${details.duration % 60}s)`;
            this.vimeoTestType = 'success';
        } catch (error) {
            this.vimeoTestMessage = `Error: Invalid Vimeo ID for ${language} or video not accessible`;
            this.vimeoTestType = 'error';
            console.error('Vimeo test error:', error);
        } finally {
            this.isTestingVimeo = false;
        }
    }

    async saveLesson(): Promise<void> {
        if (this.lessonForm.invalid) {
            this.showNotification('Please fill all required fields', 'error');
            return;
        }

        this.isLoading = true;
        const lessonData = { ...this.lessonForm.value };
        const category = lessonData.category;

        try {
            // If there's a new file selected, upload it first
            if (this.selectedFile) {
                const path = await this.uploadLessonVideo(category, lessonData.language, this.selectedFile);
                lessonData.path = path;
            }

            // Process the vimeoEntries into a vimeoIds object
            const vimeoIds: { [key: string]: string } = {};
            lessonData.vimeoEntries.forEach((entry: { language: string; vimeoId: string }) => {
                // Convert language name to language code
                const langCode = Object.prototype.hasOwnProperty.call(this.languageCodes, entry.language) ? this.languageCodes[entry.language as keyof typeof this.languageCodes] : entry.language.toLowerCase();
                vimeoIds[langCode] = entry.vimeoId;
            });

            // Replace the vimeoEntries array with the vimeoIds object
            delete lessonData.vimeoEntries;
            lessonData.vimeoIds = vimeoIds;

            // Create mappings for each language
            if (lessonData.path) {
                for (const [langCode, vimeoId] of Object.entries(vimeoIds)) {
                    const firebasePath = `${category}/${langCode}/${lessonData.path}`;

                    // Create mapping
                    const mapping: IVimeoMapping = {
                        firebasePath: firebasePath,
                        vimeoId: vimeoId,
                        title: lessonData.name,
                        description: lessonData.description,
                    };

                    // Add mapping to Firestore
                    await firstValueFrom(this.vimeoMappingService.addMapping(mapping));
                }
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

    // Helper method to count entries in an object
    getObjectLength(obj: any): number {
        if (!obj) return 0;
        return Object.keys(obj).length;
    }

    // Helper method to convert Vimeo IDs object to an array for display
    getVimeoEntries(vimeoIds: { [key: string]: string }): { lang: string; id: string }[] {
        if (!vimeoIds) return [];

        // Convert language codes to readable names where possible
        return Object.entries(vimeoIds).map(([code, id]) => {
            // Find the language name for this code
            const langName = Object.entries(this.languageCodes).find(([name, langCode]) => langCode === code)?.[0] || code;

            return {
                lang: langName,
                id: id,
            };
        });
    }
}
