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
import { VimeoService } from 'src/app/shared/services/vimeo/vimeo.service';
import { firstValueFrom, switchMap, of } from 'rxjs';
import { LanguageService } from 'src/app/shared/services/language/language.service';
import { GeminiService } from 'src/app/shared/services/gemini/gemini.service';

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
    vimeoService = inject(VimeoService);
    languageService = inject(LanguageService);
    geminiService = inject(GeminiService);

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
    tabs = ['Notes', 'Quiz']; //Removed Materials and QnA tabs
    activeTabIndex = 0;
    progress$!: Subscription;
    fileList: { name: string; videolink: any }[] = [];
    materialList: fileMetadata[] = [];
    imageArray: any[] = [];
    files: any[] = [];
    uploadCompleted = signal(false);
    qualityMenuOpen: boolean = false;
    currentQuality: 'sd' | 'hd' | 'highest' = 'highest';
    currentLanguage: string = 'en';

    // AI Summary related properties
    lessonSummary: string | null = null;
    isGeneratingSummary = false;

    private lastSavedProgress = 0;
    private PROGRESS_THRESHOLD = 10; // Only save when progress changes by 10%
    paramSubscription: Subscription | undefined;
    private languageSubscription: Subscription | undefined;

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
        this.currentLanguage = this.languageService.getCurrentLanguageValue();
        this.paramSubscription = this.ar.params.subscribe((params) => {
            this.lessonId = params['id'];
            this._category = params['category'];

            // Reset component state for new lesson
            this._lesson = this.ds.getSelectedLesson() ?? this.lessonId;
            this._email = this.ds.getUserEmail() ?? localStorage.getItem('email');
            this._progress = this.getProgress();

            this.languageSubscription = this.languageService.getCurrentLanguage().subscribe((lang) => {
                this.reloadLessonVideoForLanguage(lang);
            });

            // Check if lesson is already completed and set progressRate accordingly
            this.checkAndSetProgress();

            this.isQuizOpen = false;
            this.showCorrectAnswer = false;
            this.videoSrc = null;

            // Load the new lesson data
            this.initLesson();
        });

        const encoded = this.route.url.split('/')[3];
        this.title = decodeURIComponent(encoded);
    }

    ngOnDestroy(): void {
        if (this.paramSubscription) {
            this.paramSubscription.unsubscribe();
        }

        if (this.languageSubscription) {
            this.languageSubscription.unsubscribe();
        }
    }

    // New method to check and set progress
    checkAndSetProgress(): void {
        if (this._progress) {
            // Check if progress is already 100%
            if (this._progress.progress === '100' || this._progress.completed) {
                this.progressRate.set(100);
                this.isVideoCompleted = true;
            } else {
                // If progress exists but is not 100%
                const currentProgress = parseInt(this._progress.progress || '0');
                this.progressRate.set(currentProgress);
                this.isVideoCompleted = currentProgress === 100;
            }
        } else {
            console.error('No progress data found');
        }
    }

    // Get video from Vimeo
    async getVideoFromVimeo(lesson: ILesson): Promise<string | null> {
        if (!lesson) {
            console.error('Cannot get video URL: Lesson is undefined');
            return null;
        }

        let lang;
        switch (lesson.language) {
            case 'Tamil':
                lang = 'ta';
                break;
            case 'English':
            default:
                lang = 'en';
                break;
        }

        try {
            // Use the data service without quality parameter
            return await this.ds.getVideo(lesson.category, lang, lesson.path);
        } catch (error) {
            console.error('Failed to get video URL:', error);
            return null;
        }
    }

    // The initLesson method updated to use async/await with error handling
    initLesson() {
        this.ls.getLessonById(this._lesson, this._category).subscribe({
            next: async (lesson) => {
                this.currentLesson.set(lesson);

                // Get the saved video position from Firestore
                let savedPosition: number | undefined = undefined;

                if (this._email && lesson?.id) {
                    try {
                        savedPosition = await this.ps.getVideoPosition(this._email, this._category, lesson.id);
                        console.log(`Retrieved saved position from Firestore: ${savedPosition}`);
                    } catch (error) {
                        console.error('Failed to get saved position:', error);
                    }
                }

                if (lesson && !this.videoSrc) {
                    try {
                        // Get video from Vimeo without quality parameter
                        const url = await this.getVideoFromVimeo(lesson);
                        this.videoSrc = url;
                        // Store the saved position to pass to video player
                        this.savedVideoPosition = savedPosition;
                    } catch (error) {
                        console.error('Failed to load video:', error);
                    }
                }

                // Initialize quiz if it exists
                if (lesson && lesson.quiz) {
                    this.questions = lesson.quiz;
                    this.userAnswers = new Array(this.questions.length).fill(-1);
                }
            },
            error: (err) => console.error('Error fetching lesson:', err),
        });
    }

    // Method to handle video quality selection
    async changeVideoQuality(quality: 'sd' | 'hd' | 'highest'): Promise<void> {
        if (!this.currentLesson()) {
            return;
        }

        try {
            // Store current playback position
            const currentTime = this.getCurrentVideoTime();

            // Get new video URL with selected quality
            const newUrl = await this.getVideoFromVimeo(this.currentLesson()!);
            if (newUrl) {
                this.videoSrc = newUrl;
                this.currentQuality = quality;

                // We need to wait for video to load and then set the time
                setTimeout(() => {
                    this.setVideoTime(currentTime);
                }, 1000); // Allow some time for the video to load
            }
        } catch (error) {
            console.error('Failed to change video quality:', error);
        }
    }

    // Get current video playback time
    getCurrentVideoTime(): number {
        // Implement based on your video player implementation
        // For example, if using the HTML5 video element:
        const videoElement = document.querySelector('video');
        return videoElement ? videoElement.currentTime : 0;
    }

    // Set video playback time
    setVideoTime(time: number): void {
        // Implement based on your video player implementation
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.currentTime = time;
        }
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
        return null;
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

        // Show answers
        this.showCorrectAnswer = true;

        // Store quiz results
        if (this.currentLesson()) {
            this.storeQuiz();
        } else {
            console.error('Cannot submit quiz: No current lesson data');
        }

        // If they passed, update progress to allow next lesson
        if (score >= 70) {
            // Assuming 70% is passing
            // Update progress to mark lesson as completed
            if (this._progress) {
                this._progress.completed = true;

                // Update in database
                const currentLesson = this.currentLesson();
                if (currentLesson?.id && this._email && this._category) {
                    // Call your service to update lesson completion status
                    this.ps
                        .updateLessonCompletion(this._email, this._category, currentLesson.id)
                        .then(() => console.log('Lesson completion status updated'))
                        .catch((err) => console.error('Error updating lesson completion:', err));

                    // Also update localStorage if that's how you're caching progress
                    this.updateLocalStorageProgress(currentLesson.id, true);
                }
            }
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
            console.log('Navigating to next lesson:', '/lesson' + this._category + nextLessonId);
            // Navigate to the next lesson with a page reload
            window.location.href = `/lesson/${this._category}/${nextLessonId}`;
        } else {
            console.error('Could not determine next lesson ID from current ID:', currentId);
        }
    }

    navigateToPreviousLesson() {
        // Extract the current lesson number from the ID
        const currentLesson = this.currentLesson();
        if (!currentLesson) return;

        // Parse the current lesson ID format (e.g., bblesson01)
        const currentId = currentLesson.id || '';

        // Extract the numeric part and decrement
        const currentNumericPart = currentId.match(/\d+$/)?.[0]; // Get the digits at the end

        if (currentNumericPart) {
            // Prevent going to lesson 0 or negative
            const currentNum = parseInt(currentNumericPart);
            if (currentNum <= 1) {
                console.warn('Already at the first lesson');
                return;
            }

            // Convert to number, decrement, and format back with leading zeros
            const prevNum = currentNum - 1;
            const prevNumericPart = prevNum.toString().padStart(currentNumericPart.length, '0');

            // Reconstruct the ID with the same prefix
            const prefix = currentId.replace(/\d+$/, ''); // Remove the digits at the end
            const prevLessonId = prefix + prevNumericPart; // e.g., "bblesson01" from "bblesson02"

            // Navigate to the previous lesson

            this.route.navigateByUrl(`/lesson/${this._category}/${prevLessonId}`);
        } else {
            console.error('Could not determine previous lesson ID from current ID:', currentId);
        }
    }

    onVideoEnd() {
        // Skip if lesson is already completed
        if (this.progressRate() === 100 || this.isVideoCompleted) {
            return;
        }

        this.isQuizOpen = true;
        this.isVideoCompleted = true;

        // Force save the final progress (100%)
        this.progressRate.set(100);
        this.saveProgressToDatabase();

        // Extract lessonNo from currentLesson if available
        const currentLesson = this.currentLesson();
        const lessonNo = currentLesson?.lessonNo ? parseInt(currentLesson.lessonNo) : null;

        if (lessonNo !== null && this._category) {
            // Use _category instead of category
            this.firebase.vidEndNxtLessonUpdate(lessonNo, this._category, this.progressRate());

            // Update local progress object
            if (this._progress) {
                this._progress.progress = '100';
                this._progress.watchDuration = 100;
                // Note: completed status will be set to true after quiz completion
            }
        } else {
            console.error('Cannot update lesson progress: Missing lesson number or category');
        }
    }

    progressUpdate(update: number) {
        // Only update if progress is less than what's coming in
        // This ensures we don't reduce progress when rewatching
        if (update > this.progressRate()) {
            this.progressRate.set(update);
            this.saveProgressToDatabase();
        }
    }

    saveProgressToDatabase() {
        const currentProgress = this.progressRate();

        // Only save if progress has changed significantly
        if (Math.abs(currentProgress - this.lastSavedProgress) >= this.PROGRESS_THRESHOLD) {
            this.lastSavedProgress = currentProgress;

            const currentLesson = this.currentLesson();
            if (currentLesson?.id && this._category) {
                // Use DataService instead of FirebaseService
                this.ds.updateLessonProgress(this._email || '', this._category, currentLesson.id, currentProgress);
            }
        }
    }

    // Add this helper method to the LessonsComponent class
    private updateLocalStorageProgress(lessonId: string, completed: boolean) {
        const categoryProgress = localStorage.getItem('categoryProgress');
        if (categoryProgress) {
            const parsedCategory = JSON.parse(categoryProgress);

            // Find the category matching the current category
            const updatedCategories = parsedCategory.map((category: any) => {
                if (category.categoryName.toLowerCase() === this._category.toLowerCase()) {
                    // Update the specific lesson within this category
                    const updatedLessons = category.lessons.map((lesson: any) => {
                        if (lesson.id === lessonId) {
                            return {
                                ...lesson,
                                completed: completed,
                                progress: '100',
                                completedDate: completed ? new Date() : null,
                            };
                        }
                        return lesson;
                    });

                    return { ...category, lessons: updatedLessons };
                }
                return category;
            });

            // Update localStorage with the modified data
            localStorage.setItem('categoryProgress', JSON.stringify(updatedCategories));

            // Also update the local reference
            if (this._progress) {
                this._progress.completed = completed;
                this._progress.progress = '100';
                this._progress.completedDate = completed
                    ? {
                          seconds: Math.floor(Date.now() / 1000),
                          nanoseconds: 0,
                      }
                    : null;
            }
        }
    }

    isChoiceSelected(): boolean {
        return this.userAnswers[this.currentQuizIndex] === -1;
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

            // Store answers in Firebase as before
            this.firebase.storeUserQuizAnswers(category, id, this.userAnswers, score);

            // Also update the progress collection with the quiz answers
            this.updateQuizAnswersInProgress(id, this.userAnswers);
        } else {
            console.error('Cannot store quiz results: Current lesson data is not available');
        }
    }

    // New method to update quiz answers in the Progress collection
    private updateQuizAnswersInProgress(lessonId: string, quizAnswers: number[]) {
        if (!this._email) {
            console.error('Cannot update quiz answers: No user email found');
            return;
        }

        // Call method from progress service to update quiz answers
        this.ps
            .updateQuizAnswers(this._email, this._category, lessonId, quizAnswers)
            .then(() => {
                console.log('Quiz answers saved to progress data');

                // Also update localStorage if you're caching progress there
                this.updateLocalStorageQuizAnswers(lessonId, quizAnswers);
            })
            .catch((err) => console.error('Error saving quiz answers to progress:', err));
    }
    savedVideoPosition: number | undefined = undefined;

    onVideoPositionUpdate(event: { lessonId: string; position: number }): void {
        if (!this._email) {
            console.error('Cannot save video position: No user email');
            return;
        }

        console.log(`Saving position ${event.position.toFixed(2)} for lesson ${event.lessonId}`);

        // Use the progress service to save the position to Firestore
        this.ps
            .saveVideoPosition(this._email, this._category, event.lessonId, event.position)
            .then(() => console.log('Position saved to Firestore'))
            .catch((err) => console.error('Error saving position to Firestore:', err));
    }

    // New method to update quiz answers in localStorage
    private updateLocalStorageQuizAnswers(lessonId: string, quizAnswers: number[]) {
        const categoryProgress = localStorage.getItem('categoryProgress');
        if (categoryProgress) {
            const parsedCategory = JSON.parse(categoryProgress);

            // Find the category matching the current category
            const updatedCategories = parsedCategory.map((category: any) => {
                if (category.categoryName.toLowerCase() === this._category.toLowerCase()) {
                    // Update the specific lesson within this category
                    const updatedLessons = category.lessons.map((lesson: any) => {
                        if (lesson.id === lessonId) {
                            return {
                                ...lesson,
                                quizAnswers: quizAnswers,
                            };
                        }
                        return lesson;
                    });

                    return { ...category, lessons: updatedLessons };
                }
                return category;
            });

            // Update localStorage with the modified data
            localStorage.setItem('categoryProgress', JSON.stringify(updatedCategories));

            // Also update the local reference
            if (this._progress) {
                this._progress.quizAnswers = quizAnswers;
            }
        }
    }

    setActiveTab(index: number): void {
        this.activeTabIndex = index;
    }

    getFileList() {
        const ref = this.storage.ref('materials/bb/english');
        let myurlsubscription = ref.listAll().subscribe((data) => {
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
                // Get download URL if needed:
                const downloadURL = snapshot.ref.getDownloadURL();

                // Check if all files are uploaded
                if (index === this.imageArray.length - 1) {
                    // Clear imageArray
                    this.imageArray = [];

                    // Set uploadCompleted to true
                    this.uploadCompleted.set(true);
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

    // Add this to your component class (such as a user profile or admin component)
    resetUserProgress() {
        // Confirm with the user before resetting
        if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
            // Get the current user's email
            const userEmail = this._email || localStorage.getItem('email');

            if (!userEmail) {
                console.error('Cannot reset progress: No user email found');
                return;
            }

            // Show loading indicator if you have one
            // this.isLoading = true;

            // Call the DataService to reset progress
            this.ds
                .resetProgressStructure(userEmail)
                .then(() => {
                    // Success message
                    alert('Progress has been reset successfully.');

                    // Reload the current page or navigate to refresh the UI
                    window.location.reload();
                })
                .catch((error) => {
                    console.error('Error resetting progress:', error);
                    alert('Failed to reset progress. Please try again later.');
                })
                .finally(() => {
                    // Hide loading indicator
                    // this.isLoading = false;
                });
        }
    }

    reloadLessonVideoForLanguage(lang: string) {
        const lesson = this.currentLesson();
        if (!lesson) return;
        // Optionally, update lesson.language if needed
        lesson.language = lang;
        this.getVideoFromVimeo(lesson).then((url) => {
            this.videoSrc = url;
        });
    }

    /**
     * Generate a summary of the current lesson using Gemini AI
     * This method gets the video transcript from Vimeo and then uses Gemini AI to generate a summary
     */
    generateLessonSummary() {
        const lesson = this.currentLesson();
        if (!lesson) {
            console.error('No lesson selected');
            return;
        }

        this.isGeneratingSummary = true;
        this.lessonSummary = null;

        // Get the Vimeo ID first
        // If the lesson already has vimeoIds, use that directly, otherwise map the path
        if (lesson.vimeoIds && lesson.vimeoIds[lesson.language || 'en']) {
            const vimeoId = lesson.vimeoIds[lesson.language || 'en'];
            console.log('Using existing Vimeo ID:', vimeoId);
            this.processVimeoIdForSummary(vimeoId);
        } else {
            console.error('No Vimeo ID or path found for this lesson');
            this.isGeneratingSummary = false;
            alert('Failed to find video ID. No Vimeo ID or path found for this lesson.');
        }
    }

    /**
     * Helper method to process a Vimeo ID for summary generation
     * @param vimeoId The Vimeo ID to process
     */
    private processVimeoIdForSummary(vimeoId: string) {
        this.vimeoService
            .getVideoTranscript(vimeoId)
            .pipe(
                switchMap((transcript) => {
                    // Use the direct method since we have the API key in environment
                    return this.geminiService.generateSummaryDirect(transcript);
                }),
            )
            .subscribe({
                next: (summary) => {
                    this.lessonSummary = summary;
                    this.isGeneratingSummary = false;
                },
                error: (error) => {
                    console.error('Error generating lesson summary:', error);
                    this.isGeneratingSummary = false;
                    alert('Failed to generate summary. ' + error.message);
                },
            });
    }
}
