import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from 'src/app/components/app-shell/app-shell.component';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { catchError, map, Observable, of, Subscription, take, tap } from 'rxjs';
import { DataService } from 'src/app/shared/services/data.service';
import { Lesson } from 'src/app/shared/models/lesson.model';
import { ProgressService } from 'src/app/shared/services/progress/progress.service';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { LessonsService } from 'src/app/shared/services/lessons/lessons.service';
import { seedUser } from 'src/app/shared/utils/init-data';
import { IProgress, LanguageProgress, LessonsProgress } from 'src/app/shared/models/progress.interface';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { Timestamp } from '@angular/fire/firestore';
import { UserService } from 'src/app/shared/services/users/user.service';
import { IUser } from 'src/app/shared/models/user.interface';
import { User } from '@angular/fire/auth';
import { TranslationService } from 'src/app/shared/services/language/language.service';
import { TranslatePipe } from '../../shared/pipes/translation.pipe';
import { VimeoService } from 'src/app/shared/services/vimeo/vimeo.service';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [CommonModule, RouterModule, TranslatePipe, MatIcon],
})
export class HomeComponent implements OnInit, OnDestroy {
    ds = inject(DataService);
    ps = inject(ProgressService);
    as = inject(AuthService);
    ls = inject(LessonsService);
    vimeoService = inject(VimeoService);
    userService = inject(UserService);
    translationService = inject(TranslationService);
    allBBLessons$: Observable<any> = this.ds.getAllLessonSubCollection('bb');

    bbLessons: any[] = [];
    initialLesson: Lesson[] = [];
    currentLesson: Lesson[] = [];
    // usersList: any = []
    progress!: any;
    progress$!: Subscription;
    userData!: IUser | null;
    email!: string | null;
    loadingProgress: boolean = true;
    selectedCategory = signal('bb');
    categoryProgress: LessonsProgress[] = [];
    currentLanguage: string = 'English'; // Default language
    langCode: string = 'en';
    languageSubscription!: Subscription;
    lessonThumbnails: { [key: string]: string } = {};

    constructor(private router: Router) {
        this.email = localStorage.getItem('email') ?? '';
    }

    ngOnInit(): void {
        // this.ls.seedLessonsByCategory(this.selectedCategory(), bbLessonsInit).
        //   subscribe(v=> console.log(v));
        // this.userService.seedUsersToFirestore(seedUser)

        // Get current language from language service
        this.currentLanguage = this.translationService.getCurrentLanguageValue();
        this.langCode = this.translationService.getLanguageCodeByName(this.currentLanguage);

        this.translationService.getCurrentLanguage().subscribe((language) => {
            this.currentLanguage = language;
            this.langCode = this.translationService.getLanguageCodeByName(language);

            // Update category progress if progress is already loaded
            if (this.progress) {
                this.getCategoryProgress(this.selectedCategory(), this.progress);
            }
        });

        this.as.authState$.subscribe((user: User | null) => {
            if (user) {
                this.email = localStorage.getItem('email') ?? '';
                if (this.email === '') {
                    console.error('Email not found');
                    this.email = this.as.getUserEmail();
                }
                this.getUser();
            } else {
                console.error('User is not logged in!');
            }
        });

        this.email = localStorage.getItem('email') ?? '';
        if (this.email === '') {
            console.error('Email not found');
            this.email = this.as.getUserEmail();
        }
        this.ps.initializeProgressOnLoad(this.email!).subscribe({
            next: (progress) => {
                this.progress = progress;
                this.getCategoryProgress(this.selectedCategory(), this.progress);
                this.loadingProgress = false;
            },
            error: (error) => {
                console.error(error);
                this.loadingProgress = false;
            },
        });

        // Subscribe to lessons and load thumbnails
        this.allBBLessons$
            .pipe(
                take(3),
                tap((lessons) => {
                    // Load thumbnails for lessons with videoId
                    lessons.forEach((lesson: any) => {
                        if (lesson.vimeoIds && !lesson.thumbnailUrl) {
                            const result = this.loadThumbnail(lesson.vimeoIds?.[this.langCode]);
                            if (typeof result === 'string') {
                                // If it's a direct string (default image), use it directly
                                this.lessonThumbnails[lesson.vimeoIds[0]] = result;
                            } else {
                                // If it's an Observable, subscribe to it
                                result.subscribe((url) => {
                                    this.lessonThumbnails[lesson.vimeoIds[0]] = url;
                                });
                            }
                        }
                    });
                }),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        // Unsubscribe to prevent memory leaks
        if (this.progress$) {
            this.progress$.unsubscribe();
        }

        if (this.languageSubscription) {
            this.languageSubscription.unsubscribe();
        }
    }

    async getUser() {
        if (this.email) {
            this.userData = await this.ds.getUserByEmail(this.email);
        } else {
            console.error('Email is not found');
        }
    }

    selectLesson(id: string, lessonNo: number) {
        // const lessonId = this.selectedCategory().toLowerCase() + 'lesson' + `${Number(lessonNo) < 10 ? `0${lessonNo}` : lessonNo}`;
        this.updateLessonProgress(id, lessonNo);
    }

    startLesson(id: string) {
        this.selectedCategory.set(id);
        this.ps.initializeProgressOnLoad(this.email!).subscribe({
            next: (progress) => {
                this.progress = progress;
                this.getCategoryProgress(this.selectedCategory(), this.progress);
                this.loadingProgress = false;
            },
            error: (error) => {
                console.error('Error initializing progress:', error);
                this.loadingProgress = false;
                // Handle the error (e.g., show a user-friendly message)
            },
        });
    }

    getCategoryProgress(category: string, progress: IProgress) {
        const categoryProg = progress.categoryProgress.filter((val) => val.categoryName.toLocaleLowerCase() === category.toLocaleLowerCase());

        if (categoryProg.length === 0) {
            console.error(`Category ${category} not found in progress data`);
            this.categoryProgress = [];
            return;
        }

        // Use the langCode property directly instead of retrieving it indirectly
        const languageProgress = categoryProg[0].languageProgress[this.langCode];
        if (!languageProgress) {
            console.error(`No progress data found for language ${this.currentLanguage} (code: ${this.langCode})`);
            this.categoryProgress = [];
            return;
        }

        this.categoryProgress = languageProgress?.lessons || [];
    }

    updateLessonProgress(lessonName: string, lessonNo: number): void {
        if (!this.progress || this.progress?.categoryProgress.length === 0 || !this.categoryProgress) return;
        const lessonId = this.selectedCategory().toLowerCase() + 'lesson' + `${Number(lessonNo) < 10 ? `0${lessonNo}` : lessonNo}`;
        // Find the lesson in the current category progress by title
        const lessonIndex = this.categoryProgress.findIndex((lesson) => lesson.id === lessonId);

        const lesson = this.categoryProgress[lessonIndex];

        if (lessonIndex === -1) {
            console.error(`Lesson with title ${lessonId} not found in category ${this.selectedCategory()}`);
            return;
        }

        // Only update if the lesson hasn't been started yet
        if (lesson.progress === '0' && lesson.watchDuration === 0) {
            // Find the category index for database update
            const categoryIndex = this.progress.categoryProgress.findIndex((cat: { categoryName: string }) => cat.categoryName.toLowerCase() === this.selectedCategory().toLowerCase());

            if (categoryIndex === -1) {
                console.error(`Category ${this.selectedCategory()} not found in progress data`);
                return;
            }

            // Create a deep copy of the progress data
            const updatedProgress = JSON.parse(JSON.stringify(this.progress));

            // Update the specific lesson - use langCode directly
            updatedProgress.categoryProgress[categoryIndex].languageProgress[this.langCode].lessons[lessonIndex].progress = '1';
            updatedProgress.categoryProgress[categoryIndex].languageProgress[this.langCode].lessons[lessonIndex].startDate = Timestamp.now();

            // Update in database
            this.ps.updateProgress(this.email!, updatedProgress).subscribe({
                next: (updatedProgress) => {
                    this.progress = updatedProgress;
                    // Make sure to set the lesson data in DataService before navigation
                    this.ds.setLessonData(updatedProgress, lesson, this.email!);
                    this.router.navigate([`/lesson/${this.selectedCategory().toLowerCase()}`, lessonId]);
                },
                error: (error) => {
                    console.error('[HomeComponent] Error updating progress:', error);
                },
            });
        } else {
            // If lesson already started, just navigate to it
            // Make sure to set the lesson data in DataService before navigation
            this.ds.setLessonData(this.progress, lesson, this.email!);
            this.router.navigate([`/lesson/${this.selectedCategory().toLowerCase()}`, lessonId]);
        }
    }

    /**
     * Load thumbnail for a lesson
     */
    loadThumbnail(videoId: any): string | Observable<string> {
        if (!videoId) return 'assets/images/video-placeholder.png';

        return this.vimeoService.getVideoThumbnail(videoId).pipe(
            map((thumbnailData: any) => {
                console.log('Thumbnail data:', thumbnailData);
                // Find the appropriate size thumbnail (medium or the first available)
                const thumbnail = thumbnailData.sizes.find((size: any) => size.width >= 400 && size.width <= 800) || thumbnailData.sizes[0];
                return thumbnail?.link || 'assets/images/video-placeholder.png';
            }),
            catchError((err) => {
                console.error(`Failed to load thumbnail for lesson ${videoId}:`, err);
                // Return a default placeholder
                return of('assets/images/video-placeholder.png');
            }),
        );
    }
}
