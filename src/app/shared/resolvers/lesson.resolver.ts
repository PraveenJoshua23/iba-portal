import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { DataService } from '../services/data.service';
import { ProgressService } from '../services/progress/progress.service';
import { LessonsService } from '../services/lessons/lessons.service';
import { ILesson } from '../models/lessons.interface';

export interface LessonResolverData {
    lesson: ILesson | null;
    progress: any;
    videoUrl: string | null;
}

@Injectable({
    providedIn: 'root',
})
export class LessonResolver implements Resolve<LessonResolverData> {
    constructor(
        private dataService: DataService,
        private progressService: ProgressService,
        private lessonsService: LessonsService,
        private router: Router,
    ) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<LessonResolverData> {
        const category = route.paramMap.get('category') || '';
        const lessonId = route.paramMap.get('id') || '';

        // Check if we already have the data in the service
        const storedLesson = this.dataService.getSelectedLesson();
        const storedProgress = this.dataService.getProgressData();
        const userEmail = this.dataService.getUserEmail() || localStorage.getItem('email');

        // If we have all the data already stored, use it
        if (storedLesson && storedProgress && userEmail && storedLesson.id === lessonId) {
            // Need to still fetch the lesson details from database
            return this.lessonsService.getLessonById(lessonId, category).pipe(
                switchMap((lesson) => {
                    if (!lesson) {
                        return of({ lesson: null, progress: storedProgress, videoUrl: null });
                    }

                    // Get video URL
                    return this.getVideoUrl(lesson, category).pipe(
                        map((videoUrl) => ({
                            lesson,
                            progress: storedProgress,
                            videoUrl,
                        })),
                    );
                }),
                catchError((error) => {
                    console.error('Error resolving lesson data:', error);
                    this.router.navigate(['/home']);
                    return of({ lesson: null, progress: null, videoUrl: null });
                }),
            );
        }

        // If we don't have the data, fetch everything
        if (!userEmail) {
            console.error('No user email found');
            this.router.navigate(['/home']);
            return of({ lesson: null, progress: null, videoUrl: null });
        }

        return this.progressService.initializeProgressOnLoad(userEmail).pipe(
            switchMap((progress) => {
                // Find the specific lesson in progress data
                const categoryObj = progress.categoryProgress.find((cat) => cat.categoryName.toLowerCase() === this.mapCategoryName(category).toLowerCase());

                if (!categoryObj) {
                    throw new Error(`Category ${category} not found in progress data`);
                }

                // Determine language to use (you might need to adjust this based on your app's language handling)
                const language = 'en'; // Default language

                if (!categoryObj.languageProgress[language]) {
                    throw new Error(`Language ${language} not found in category progress`);
                }

                const lessonProgress = categoryObj.languageProgress[language].lessons.find((lesson) => lesson.id === lessonId);

                if (!lessonProgress) {
                    throw new Error(`Lesson ${lessonId} not found in progress data`);
                }

                // Store data in the service for later use
                this.dataService.setLessonData(progress, lessonProgress, userEmail);

                // Get the full lesson data
                return this.lessonsService.getLessonById(lessonId, category).pipe(
                    switchMap((lesson) => {
                        if (!lesson) {
                            throw new Error(`Lesson ${lessonId} not found in database`);
                        }

                        // Get video URL
                        return this.getVideoUrl(lesson, category).pipe(
                            map((videoUrl) => ({
                                lesson,
                                progress,
                                videoUrl,
                            })),
                        );
                    }),
                );
            }),
            catchError((error) => {
                console.error('Error resolving lesson data:', error);
                this.router.navigate(['/home']);
                return of({ lesson: null, progress: null, videoUrl: null });
            }),
        );
    }

    private getVideoUrl(lesson: ILesson, category: string): Observable<string | null> {
        // Determine language to use
        const language = 'en'; // Default language

        return new Observable<string | null>((observer) => {
            this.dataService
                .getVideo(category, language, lesson.path)
                .then((url) => {
                    observer.next(url);
                    observer.complete();
                })
                .catch((error) => {
                    console.error('Error getting video URL:', error);
                    observer.next(null);
                    observer.complete();
                });
        });
    }

    private mapCategoryName(category: string): string {
        const categoryMap: { [key: string]: string } = {
            bb: 'BB',
            intro: 'Introductory',
            intermediate: 'Intermediate',
            advanced: 'Advanced',
        };

        return categoryMap[category.toLowerCase()] || category;
    }
}
