import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from 'src/app/components/app-shell/app-shell.component';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { Observable, Subscription } from 'rxjs';
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
import { LanguageService } from 'src/app/shared/services/language/language.service';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [CommonModule, RouterModule],
})
export class HomeComponent implements OnInit {
    ds = inject(DataService);
    ps = inject(ProgressService);
    as = inject(AuthService);
    ls = inject(LessonsService);
    userService = inject(UserService);
    languageService = inject(LanguageService);
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
    currentLanguage: string = 'en'; // Default language
    langCode: string = 'en';
    constructor(private router: Router) {
        this.email = localStorage.getItem('email') ?? '';
    }

    ngOnInit(): void {
        // this.ls.seedLessonsByCategory(this.selectedCategory(), bbLessonsInit).
        //   subscribe(v=> console.log(v));
        // this.userService.seedUsersToFirestore(seedUser)

        // Get current language from language service
        this.currentLanguage = this.languageService.getCurrentLanguageValue();
        this.langCode = this.languageService.getLanguageCodeByName(this.currentLanguage);

        this.languageService.getCurrentLanguage().subscribe((language) => {
            this.currentLanguage = language;

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
                console.error('Error initializing progress:', error);
                this.loadingProgress = false;
                // Handle the error (e.g., show a user-friendly message)
            },
        });
    }

    async getUser() {
        if (this.email) {
            this.userData = await this.ds.getUserByEmail(this.email);
        } else {
            console.error('Email is not found');
        }
    }

    selectLesson(id: string) {
        this.updateLessonProgress(id);
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

        const languageProgress = categoryProg[0].languageProgress[this.langCode];
        if (!languageProgress) {
            console.error(`No progress data found for language ${this.currentLanguage}`);
            this.categoryProgress = [];
            return;
        }

        this.categoryProgress = languageProgress?.lessons || [];
    }

    updateLessonProgress(lessonName: string): void {
        if (!this.progress || this.progress?.categoryProgress.length === 0 || !this.categoryProgress) return;

        // Find the lesson in the current category progress by title
        const lessonIndex = this.categoryProgress.findIndex((lesson) => lesson.name === lessonName);

        if (lessonIndex === -1) {
            console.error(`Lesson with title ${lessonName} not found in category ${this.selectedCategory()}`);
            return;
        }

        const lesson = this.categoryProgress[lessonIndex];

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

            // Update the specific lesson
            updatedProgress.categoryProgress[categoryIndex].languageProgress[this.langCode].lessons[lessonIndex].progress = '1';
            updatedProgress.categoryProgress[categoryIndex].languageProgress[this.langCode].lessons[lessonIndex].startDate = Timestamp.now();

            // Update in database
            this.ps.updateProgress(this.email!, updatedProgress).subscribe({
                next: (updatedProgress) => {
                    this.progress = updatedProgress;
                    this.ds.setLessonData(updatedProgress, lesson, this.email!);
                    this.router.navigate([`/lesson/${this.selectedCategory().toLowerCase()}`, lesson.id]);
                },
                error: (error) => {
                    console.error('Error updating progress:', error);
                },
            });
        } else {
            // If lesson already started, just navigate to it
            this.ds.setLessonData(this.progress, lesson, this.email!);
            this.router.navigate([`/lesson/${this.selectedCategory().toLowerCase()}`, lesson.id]);
        }
    }
}
