import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Time } from '@angular/common';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { Lesson } from 'src/app/shared/models/lesson.model';
import { Subscription } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { IProgress, LessonsProgress } from 'src/app/shared/models/progress.interface';
import { DataService } from 'src/app/shared/services/data.service';
import { LessonsService } from 'src/app/shared/services/lessons/lessons.service';
import { ProgressService } from 'src/app/shared/services/progress/progress.service';
import { ILesson } from 'src/app/shared/models/lessons.interface';

interface Progress {
    BB: LessonProg[];
    INTRO: LessonProg[];
    INTERMEDIATE: LessonProg[];
    ADVANCED: LessonProg[];
    registration: number;
}

interface LessonProg {
    id: string;
    lessonNo: 1;
    locked: boolean;
    progress: number;
    startDate: Timestamp;
    endDate: Timestamp;
    userId: string;
}

interface Timestamp {
    nanoseconds: number;
    seconds: number;
}

interface fileMetadata {
    contentType: string | null | undefined;
    name: string;
    size: number;
    path: string | undefined;
}
@Component({
    selector: 'app-lessons',
    standalone: true,
    imports: [CommonModule, VideoPlayerComponent, RouterLink],
    templateUrl: './lessons.component.html',
    styleUrls: ['./lessons.component.scss'],
})
export class LessonsComponent implements OnInit, OnDestroy {
    _progress: LessonsProgress | null = null;
    _lesson: any = null;
    _email: string | null = null;
    _category!: string;

    ds = inject(DataService);
    ls = inject(LessonsService);
    ps = inject(ProgressService);

    title!: string;
    isQuizOpen: boolean = false;
    currentQuizIndex = 0;
    currentLesson = signal<ILesson | null>(null);
    userAnswers: number[] = [];
    showCorrectAnswer = false;
    videoSrc: any;
    questions: any[] = [];
    isVideoCompleted: boolean = false;
    progressRate = signal(0);
    lessonId!: string;
    lessonNo!: number;
    category!: string;
    tabs = ['Materials', 'Notes', 'Quiz', 'QnA Forum'];
    activeTabIndex = 0;
    progress$!: Subscription;
    fileList: { name: string; videolink: any }[] = [];
    materialList: fileMetadata[] = [];
    imageArray: any[] = [];
    files: any[] = [];
    uploadCompleted = signal(false);

    private lastSavedProgress = 0;
    private PROGRESS_THRESHOLD = 10; // Only save when progress changes by 10%

    constructor(
        private route: Router,
        private firebase: FirebaseService,
        private ar: ActivatedRoute,
        private storage: AngularFireStorage,
    ) {
        this.ar.params.subscribe((params) => {
            this.lessonId = params['id'];
            this._category = params['category'];
        });
    }

    ngOnInit(): void {
        this._lesson = this.ds.getSelectedLesson() ?? this.lessonId;
        this._email = this.ds.getUserEmail() ?? localStorage.getItem('email');
        this._progress = this.getProgress();
        this.initLesson();

        console.log('progress: ', this._progress);

        this.materialList = [];
        const encoded = this.route.url.split('/')[3];
        this.title = decodeURIComponent(encoded);
    }

    ngOnDestroy(): void {
        // this.progress$.unsubscribe();
    }

    initLesson() {
        this.ls.getLessonById(this._lesson, this._category).subscribe({
            next: (lesson) => {
                this.currentLesson.set(lesson);
                console.log(this.currentLesson());
                if (!this.videoSrc) this.getVideoFromFirebase(this.currentLesson()!).then((url) => (this.videoSrc = url));

                // Initialize quiz if it exists
                if (lesson && lesson.quiz) {
                    this.questions = lesson.quiz;
                    this.userAnswers = new Array(this.questions.length).fill(-1);
                }
            },
            error: (err) => console.error(err),
        });
    }

    getProgress() {
        const categoryProgress = localStorage.getItem('categoryProgress');
        if (categoryProgress) {
            const parsedCategory = JSON.parse(categoryProgress!);
            const allprogress = parsedCategory.filter((category: any) => category.categoryName.toLocaleLowerCase() === this._category.toLocaleLowerCase());
            const filterProgress = allprogress[0].lessons.filter((lesson: { id: any }) => lesson.id === this._lesson);
            return filterProgress[0];
        } else {
            console.log('Cannot find progress from localStorage.');
        }
        // this.ps.getProgressByEmail(this._email!).then(progress=> {
        //   const categoryLesson = progress.categoryProgress.filter((progress: { categoryName: string; })=> progress.categoryName === category)
        //   console.log(progress)
        //   return categoryLesson
        // });
    }

    async initializeLesson(email: string) {
        // this.firebase.getLessonbyCategory(this.category,this.lessonId).subscribe(lesson=> {
        //   this.currentLesson = lesson;
        //   if (!this.videoSrc) this.getVideoFromFirebase(this.currentLesson).then(url => this.videoSrc = url);
        //   this.initializeQuiz(this.currentLesson);
        // })
        this.getFileList();
    }

    initializeQuiz(lesson: Lesson[]) {
        this.questions = lesson[0].quiz;
        this.userAnswers = new Array(this.questions.length).fill(-1);
    }

    nextQuestion() {
        this.currentQuizIndex++;
        this.showCorrectAnswer = false;
    }

    prevQuestion() {
        this.currentQuizIndex--;
        this.showCorrectAnswer = false;
    }

    submitQuiz() {
        // Calculate score
        let correctAnswers = 0;
        this.questions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correctAnswer) {
                correctAnswers++;
            }
        });

        const score = (correctAnswers / this.questions.length) * 100;

        // Show answers and unlock next lesson if pass threshold
        this.showCorrectAnswer = true;

        // Store quiz results
        // Only call storeQuiz if we have valid lesson data
        if (this.currentLesson()) {
            this.storeQuiz();
        } else {
            console.error('Cannot submit quiz: No current lesson data');
        }

        // If they passed, update progress to allow next lesson
        if (score >= 70) {
            // Assuming 70% is passing
            // Update progress to mark lesson as completed
            // Unlock next lesson
        }
    }

    retryQuiz(lesson: any) {
        this.currentQuizIndex = 0;
        this.userAnswers = new Array(this.questions.length).fill(-1);
        this.showCorrectAnswer = false;
    }

    goToNextLesson() {
        // Extract the current lesson number from the ID
        const currentLesson = this.currentLesson();
        if (!currentLesson) return;

        // Parse the current lesson ID format (bblesson01)
        const currentId = currentLesson.id || '';

        // Extract the numeric part and increment
        const currentNumericPart = currentId.match(/\d+$/)?.[0]; // Get the digits at the end

        if (currentNumericPart) {
            // Convert to number, increment, and format back with leading zeros
            const nextNum = parseInt(currentNumericPart) + 1;
            const nextNumericPart = nextNum.toString().padStart(currentNumericPart.length, '0');

            // Reconstruct the ID with the same prefix
            const prefix = currentId.replace(/\d+$/, ''); // Remove the digits at the end
            const nextLessonId = prefix + nextNumericPart; // e.g., "bblesson02"

            // Navigate to the next lesson
            this.route.navigate(['/lesson', this._category, nextLessonId]);
        } else {
            console.error('Could not determine next lesson ID from current ID:', currentId);
        }
    }

    onVideoEnd() {
        console.log('triggered');
        this.isQuizOpen = true;
        this.isVideoCompleted = true;

        // Extract lessonNo from currentLesson if available
        const currentLesson = this.currentLesson();
        const lessonNo = currentLesson?.lessonNo ? parseInt(currentLesson.lessonNo) : null;

        if (lessonNo !== null && this._category) {
            // Use _category instead of category
            this.firebase.vidEndNxtLessonUpdate(lessonNo, this._category, this.progressRate());
        } else {
            console.error('Cannot update lesson progress: Missing lesson number or category');
            console.log('LessonNo:', lessonNo, 'Category:', this._category);
        }
    }

    progressUpdate(update: number) {
        this.progressRate.set(update);
    }

    saveProgressToDatabase() {
        const currentProgress = this.progressRate();

        // Only save if progress has changed significantly
        if (Math.abs(currentProgress - this.lastSavedProgress) >= this.PROGRESS_THRESHOLD) {
            this.lastSavedProgress = currentProgress;

            const currentLesson = this.currentLesson();
            if (currentLesson?.id && this._category) {
                this.firebase.updateLessonProgress(currentLesson.id, this._category, currentProgress);
            }
        }
    }

    isChoiceSelected(): boolean {
        return this.userAnswers[this.currentQuizIndex] === -1;
    }

    async getVideoFromFirebase(lesson: ILesson) {
        let lang;
        switch (lesson.language) {
            case 'English':
                lang = 'en';
                break;
            case 'Tamil':
                lang = 'ta';
                break;
            default:
                lang = 'en';
        }
        return await this.ds.getVideo(lesson.category, lang, lesson.path);
    }

    storeQuiz() {
        // Use the current lesson data instead of localStorage
        const currentLesson = this.currentLesson();

        if (currentLesson) {
            const category = this._category; // You already have this in the component
            const id = currentLesson.id;

            // Calculate actual score instead of hardcoding 90
            let correctAnswers = 0;
            this.questions.forEach((question, index) => {
                if (this.userAnswers[index] === question.correctAnswer) {
                    correctAnswers++;
                }
            });

            const score = Math.round((correctAnswers / this.questions.length) * 100);

            this.firebase.storeUserQuizAnswers(category, id, this.userAnswers, score);
        } else {
            console.error('Cannot store quiz results: Current lesson data is not available');
        }
    }

    setActiveTab(index: number): void {
        this.activeTabIndex = index;
    }

    getFileList() {
        const ref = this.storage.ref('materials/bb/english');
        let myurlsubscription = ref.listAll().subscribe((data) => {
            console.log(data.items);
            data.items.forEach((item) => {
                let metadata: fileMetadata;
                item.getMetadata().then((meta) => {
                    metadata = {
                        contentType: meta.contentType,
                        name: meta.name,
                        size: meta.size,
                        path: '',
                    };
                });
                item.getDownloadURL().then((val) => {
                    metadata.path = val;
                    this.materialList.push(metadata);
                    console.log(this.materialList);
                });
            });
        });
    }

    downloadFile(path: string | undefined) {
        if (path == undefined) return;
        window.open(path, '_blank');
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        const files: unknown = event.dataTransfer?.files;
        if (files) {
            Array.from(files as any[]).forEach((file: File) => {
                this.preview(file);
            });
        }
    }

    fileUpload(event: any) {
        const files: File[] = Array.from(event.target.files);
        files.forEach((file: File) => {
            this.preview(file);
        });
    }

    preview(file: File) {
        this.files.push(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            this.imageArray.push(reader.result);
        };
        console.log(this.imageArray);
    }

    //Remove the image from the array
    deleteImage(index: number) {
        this.imageArray.splice(index, 1);
    }

    isPdfFile(url: string): boolean {
        return /^data:application\/pdf/.test(url);
    }

    uploadNotes() {
        this.imageArray.forEach((file, index) => {
            const email = localStorage.getItem('email');
            const { base64Content, contentType } = this.splitDataUri(file);
            const fileRef = this.storage.ref(`notes/${email}/${this.lessonId}/note_${index}`);
            fileRef.putString(base64Content, 'base64', { contentType: contentType }).then((snapshot) => {
                console.log('File uploaded successfully:', snapshot.totalBytes);
                // Get download URL if needed:
                const downloadURL = snapshot.ref.getDownloadURL();
                console.log(downloadURL);
                // Check if all files are uploaded
                if (index === this.imageArray.length - 1) {
                    // Clear imageArray
                    this.imageArray = [];

                    // Set uploadCompleted to true
                    this.uploadCompleted.set(true);

                    console.log('Upload completed');
                }
            });
        });
    }

    splitDataUri(dataUri: string): { base64Content: string; contentType: string } {
        const base64Index = dataUri.indexOf(';base64,');
        if (base64Index === -1) {
            throw new Error('Invalid data URI: Missing ;base64');
        }

        const contentType = dataUri.substring(5, base64Index); // Extract content type
        const base64Content = dataUri.substring(base64Index + 8); // Extract base64 content

        return { base64Content, contentType };
    }
}
