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
import { IProgress, LessonsProgress } from 'src/app/shared/models/progress.interface';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { Timestamp } from '@angular/fire/firestore';
import { UserService } from 'src/app/shared/services/users/user.service';
import { IUser } from 'src/app/shared/models/user.interface';
import { User } from '@angular/fire/auth';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [CommonModule, AppShellComponent, RouterModule, SortPipe],
})
export class HomeComponent implements OnInit {
    ds = inject(DataService);
    ps = inject(ProgressService);
    as = inject(AuthService);
    ls = inject(LessonsService);
    userService = inject(UserService);
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

    constructor(
        private fb: FirebaseService,
        private router: Router,
    ) {
        this.email = localStorage.getItem('email') ?? '';
    }

    ngOnInit(): void {
        // this.ls.seedLessonsByCategory(this.selectedCategory(), bbLessonsInit).
        //   subscribe(v=> console.log(v));
        // this.userService.seedUsersToFirestore(seedUser)

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
        this.categoryProgress = categoryProg[0].lessons;
    }

    updateLessonProgress(lessonId: string): void {
        if (!this.progress || this.progress?.categoryProgress.length === 0) return;
        localStorage.setItem('categoryProgress', JSON.stringify(this.progress.categoryProgress));
        for (const category of this.progress.categoryProgress) {
            const lessonToUpdate = category.lessons.find((l: { id: string }) => l.id === lessonId);

            if (lessonToUpdate && lessonToUpdate.progress === '0' && lessonToUpdate.watchDuration === 0) {
                const updatedLessonData: Partial<IProgress> = {
                    categoryProgress: this.progress.categoryProgress.map((cat: { lessons: { id: string }[] }) => ({
                        ...cat,
                        lessons: cat.lessons.map((lesson: { id: string }) =>
                            lesson.id === lessonId
                                ? {
                                      ...lesson,
                                      progress: '1',
                                      startDate: Timestamp.now(), // Current timestamp
                                  }
                                : lesson,
                        ),
                    })),
                };
                this.ps.updateProgress(this.email!, updatedLessonData).subscribe({
                    next: (updatedProgress) => {
                        this.progress = updatedProgress;
                        this.ds.setLessonData(updatedProgress, lessonToUpdate, this.email!);
                        this.router.navigate([`/lesson/${this.selectedCategory().toLocaleLowerCase()}`, lessonId]);
                        // Optionally update your UI here
                    },
                    error: (error) => {
                        console.error('Error updating progress:', error);
                        // Handle error here
                    },
                });
            } else {
                this.ds.setLessonData(this.progress, lessonId, this.email!);
                this.router.navigate([`/lesson/${this.selectedCategory().toLocaleLowerCase()}`, lessonId]);
            }
        }
    }
}
