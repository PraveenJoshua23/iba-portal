import { Injectable, inject } from '@angular/core';
import { CollectionReference, Firestore, addDoc, getDocs, collection, collectionData, doc, docSnapshots, limit, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable, combineLatest, first, firstValueFrom, from, map, switchMap, tap } from 'rxjs';
import { CategoryProgress, IProgress, LanguageProgress, LessonsProgress } from '../../models/progress.interface';
import { LessonsService } from '../lessons/lessons.service';
import { DataService } from '../data.service';

@Injectable({
    providedIn: 'root',
})
export class ProgressService {
    fs = inject(Firestore);
    lessonsService = inject(LessonsService);
    dataService = inject(DataService);

    progressRef!: CollectionReference;

    constructor() {
        this.progressRef = collection(this.fs, 'progress');
    }

    initializeProgressOnLoad(userEmail: string): Observable<IProgress> {
        const progressQuery = query(this.progressRef, where('email', '==', userEmail));
        return collectionData(progressQuery, { idField: 'id' }).pipe(
            switchMap((progressDocs) => {
                if (progressDocs.length > 0) {
                    const progressDoc = progressDocs[0];
                    return docSnapshots(doc(this.progressRef, `${progressDoc.id}`)).pipe(map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as IProgress));
                } else {
                    // Generate progress data dynamically based on lessons
                    return this.generateInitialProgressData(userEmail).pipe(
                        switchMap((initialProgress) => {
                            return from(addDoc(this.progressRef, initialProgress)).pipe(
                                tap((docRef) => console.log('Progress seeded successfully with ID:', docRef.id)),
                                switchMap((docRef) => docSnapshots(docRef).pipe(map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as IProgress))),
                            );
                        }),
                    );
                }
            }),
        );
    }

    updateProgress(userEmail: string, updatedLessonData: Partial<IProgress>): Observable<IProgress> {
        const progressQuery = query(this.progressRef, where('email', '==', userEmail));
        return collectionData(progressQuery, { idField: 'id' }).pipe(
            first(),
            map((progressDocs: any[]) => progressDocs.map((doc) => ({ id: doc.id, ...doc }) as IProgress)),
            switchMap((progressDocs: IProgress[]) => {
                if (progressDocs.length > 0) {
                    const progressDoc = progressDocs[0];
                    const progressRef = doc(this.fs, 'progress', progressDoc.id);
                    return updateDoc(progressRef, updatedLessonData).then(() => progressDoc); // updateDoc is promise
                } else {
                    throw new Error('No progress document found for the given email');
                }
            }),
        );
    }

    getProgressData(email: string) {
        const progressQuery = query(this.progressRef, where('email', '==', email));
        return collectionData(progressQuery, { idField: 'id' }).pipe(
            map((progressDocs) => {
                if (progressDocs.length > 0) {
                    const progressDoc = progressDocs[0];
                    return docSnapshots(doc(this.progressRef, `${progressDoc.id}`)).pipe(map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as IProgress));
                } else {
                    throw Error('Progress not found');
                }
            }),
        );
    }

    async getProgressByEmail(email: string): Promise<any> {
        const progressCollection = collection(this.fs, 'progress');

        // Modified query: Using only the where clause without orderBy to avoid the need for a composite index
        const q = query(progressCollection, where('email', '==', email));

        try {
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return null;
            }

            // If there are multiple documents for the same email, we'll just take the first one
            // Ideally, there should only be one progress document per email
            const progressDoc = snapshot.docs[0];
            return { id: progressDoc.id, ...progressDoc.data() };
        } catch (error) {
            console.error('Error fetching progress:', error);
            throw error;
        }
    }

    // Add this method to the ProgressService class
    async updateLessonCompletion(userEmail: string, category: string, lessonId: string, language: string = 'en'): Promise<void> {
        try {
            // First, get the progress document for this user
            const q = query(this.progressRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error(`No progress found for user ${userEmail}`);
            }

            const progressDoc = querySnapshot.docs[0];
            const progressData = progressDoc.data() as IProgress;

            // Find the correct category
            const categoryIndex = progressData.categoryProgress.findIndex((catProgress) => catProgress.categoryName.toLowerCase() === this.mapCategoryName(category).toLowerCase());

            if (categoryIndex === -1) {
                throw new Error(`Category ${category} not found in progress data`);
            }

            // Check if the language exists in the languageProgress map
            if (!progressData.categoryProgress[categoryIndex].languageProgress[language]) {
                console.warn(`Language ${language} not found in category progress. Using default language 'en'`);
                language = 'en';

                // If 'en' doesn't exist either, throw an error
                if (!progressData.categoryProgress[categoryIndex].languageProgress[language]) {
                    throw new Error(`Default language not found in category progress`);
                }
            }

            // Find the lesson within the language-specific category
            const lessonIndex = progressData.categoryProgress[categoryIndex].languageProgress[language].lessons.findIndex((lesson) => lesson.id === lessonId);

            if (lessonIndex === -1) {
                throw new Error(`Lesson ${lessonId} not found in ${language} language for category ${category}`);
            }

            // Create a deep copy of the progress data to modify
            const updatedProgress = JSON.parse(JSON.stringify(progressData));

            // Update the completion status
            updatedProgress.categoryProgress[categoryIndex].languageProgress[language].lessons[lessonIndex].completed = true;
            updatedProgress.categoryProgress[categoryIndex].languageProgress[language].lessons[lessonIndex].progress = '100';
            updatedProgress.categoryProgress[categoryIndex].languageProgress[language].lessons[lessonIndex].completedDate = {
                seconds: Math.floor(Date.now() / 1000),
                nanoseconds: 0,
            };

            // Unlock the next lesson if it exists
            const currentLessonNo = parseInt(updatedProgress.categoryProgress[categoryIndex].languageProgress[language].lessons[lessonIndex].lessonNo);
            const nextLesson = updatedProgress.categoryProgress[categoryIndex].languageProgress[language].lessons.find((lesson: { lessonNo: string }) => parseInt(lesson.lessonNo) === currentLessonNo + 1);

            if (nextLesson) {
                nextLesson.locked = false;
            }

            // Update the language progress percentage
            let totalProgress = 0;
            const lessons = updatedProgress.categoryProgress[categoryIndex].languageProgress[language].lessons;
            lessons.forEach((lesson: { progress: any }) => {
                totalProgress += parseFloat(lesson.progress || '0');
            });

            const languageProgress = Math.round(totalProgress / lessons.length);
            updatedProgress.categoryProgress[categoryIndex].languageProgress[language].progress = languageProgress.toString();

            // Update the overall category progress based on all languages
            let totalCategoryProgress = 0;
            let languageCount = 0;

            Object.values(updatedProgress.categoryProgress[categoryIndex].languageProgress).forEach((langProgress: any) => {
                totalCategoryProgress += parseFloat(langProgress.progress || '0');
                languageCount++;
            });

            const categoryProgress = languageCount > 0 ? Math.round(totalCategoryProgress / languageCount) : 0;
            updatedProgress.categoryProgress[categoryIndex].progress = categoryProgress.toString();

            // Update the document in Firestore - using a workaround for type compatibility
            const docRef = doc(this.fs, 'progress', progressDoc.id);

            // Convert to a plain object for Firestore update
            const updateObject: any = {};

            // Only update the specific categoryProgress array
            updateObject['categoryProgress'] = updatedProgress.categoryProgress;

            await updateDoc(docRef, updateObject);

            return Promise.resolve();
        } catch (error) {
            console.error('Error updating lesson completion:', error);
            return Promise.reject(error);
        }
    }

    // Add this method to the ProgressService class
    async updateQuizAnswers(userEmail: string, category: string, lessonId: string, quizAnswers: number[], language: string = 'en'): Promise<void> {
        try {
            // First, get the progress document for this user
            const q = query(this.progressRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error(`No progress found for user ${userEmail}`);
            }

            const progressDoc = querySnapshot.docs[0];
            const progressData = progressDoc.data() as IProgress;

            // Find the correct category
            const categoryIndex = progressData.categoryProgress.findIndex((catProgress) => catProgress.categoryName.toLowerCase() === this.mapCategoryName(category).toLowerCase());

            if (categoryIndex === -1) {
                throw new Error(`Category ${category} not found in progress data`);
            }

            // Check if the language exists in the languageProgress map
            if (!progressData.categoryProgress[categoryIndex].languageProgress[language]) {
                console.warn(`Language ${language} not found in category progress. Using default language 'en'`);
                language = 'en';

                // If 'en' doesn't exist either, throw an error
                if (!progressData.categoryProgress[categoryIndex].languageProgress[language]) {
                    throw new Error(`Default language not found in category progress`);
                }
            }

            // Find the lesson within the language-specific category
            const lessonIndex = progressData.categoryProgress[categoryIndex].languageProgress[language].lessons.findIndex((lesson) => lesson.id === lessonId);

            if (lessonIndex === -1) {
                throw new Error(`Lesson ${lessonId} not found in ${language} language for category ${category}`);
            }

            // Create a deep copy of the progress data to modify
            const updatedProgress = JSON.parse(JSON.stringify(progressData));

            // Update the quiz answers
            updatedProgress.categoryProgress[categoryIndex].languageProgress[language].lessons[lessonIndex].quizAnswers = quizAnswers;

            // Update the document in Firestore
            const docRef = doc(this.fs, 'progress', progressDoc.id);

            // Convert to a plain object for Firestore update
            const updateObject: any = {};

            // Only update the specific categoryProgress array
            updateObject['categoryProgress'] = updatedProgress.categoryProgress;

            await updateDoc(docRef, updateObject);

            return Promise.resolve();
        } catch (error) {
            console.error('Error updating quiz answers:', error);
            return Promise.reject(error);
        }
    }
    async saveVideoPosition(userEmail: string, category: string, lessonId: string, position: number, language: string = 'en'): Promise<void> {
        if (!userEmail) {
            throw new Error('Cannot save position: No user email provided');
        }

        try {
            // Get the progress document for this user
            const progressRef = collection(this.fs, 'progress');
            const q = query(progressRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('No progress document found for user');
            }

            // Get the progress document
            const progressDoc = querySnapshot.docs[0];
            const progressData = progressDoc.data() as IProgress;

            // Find the category in the progress data
            const categoryIndex = progressData.categoryProgress.findIndex((cp) => cp.categoryName.toLowerCase() === this.mapCategoryName(category).toLowerCase());

            if (categoryIndex === -1) {
                throw new Error(`Category ${category} not found in progress data`);
            }

            // Check if the language exists in the languageProgress map
            if (!progressData.categoryProgress[categoryIndex].languageProgress[language]) {
                console.warn(`Language ${language} not found in category progress. Using default language 'en'`);
                language = 'en';

                // If 'en' doesn't exist either, throw an error
                if (!progressData.categoryProgress[categoryIndex].languageProgress[language]) {
                    throw new Error(`Default language not found in category progress`);
                }
            }

            // Find the lesson within the language-specific category
            const lessonIndex = progressData.categoryProgress[categoryIndex].languageProgress[language].lessons.findIndex((lesson) => lesson.id === lessonId);

            if (lessonIndex === -1) {
                throw new Error(`Lesson ${lessonId} not found in ${language} language for category ${category}`);
            }

            // Create a copy of the progress data to modify
            const updatedProgress = JSON.parse(JSON.stringify(progressData));

            // Update the watchDuration with the current position
            updatedProgress.categoryProgress[categoryIndex].languageProgress[language].lessons[lessonIndex].watchDuration = position;

            // Update the document in Firestore
            const progressDocRef = doc(this.fs, 'progress', progressDoc.id);
            await updateDoc(progressDocRef, {
                categoryProgress: updatedProgress.categoryProgress,
            });

            return Promise.resolve();
        } catch (error) {
            console.error('Error saving video position:', error);
            return Promise.reject(error);
        }
    }

    /**
     * Get saved video position for a specific lesson
     */
    /**
     * Get saved video position for a specific lesson
     */
    async getVideoPosition(userEmail: string, category: string, lessonId: string, language: string = 'en'): Promise<number | undefined> {
        if (!userEmail) {
            throw new Error('Cannot get position: No user email provided');
        }

        try {
            // Get the progress document for this user
            const progressRef = collection(this.fs, 'progress');
            const q = query(progressRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return undefined; // No progress document found
            }

            // Get the progress document
            const progressDoc = querySnapshot.docs[0];
            const progressData = progressDoc.data() as IProgress;

            // Find the category in the progress data
            const categoryIndex = progressData.categoryProgress.findIndex((cp) => cp.categoryName.toLowerCase() === this.mapCategoryName(category).toLowerCase());

            if (categoryIndex === -1) {
                return undefined; // Category not found
            }

            // Check if the language exists in the languageProgress map
            if (!progressData.categoryProgress[categoryIndex].languageProgress[language]) {
                console.warn(`Language ${language} not found in category progress. Using default language 'en'`);
                language = 'en';

                // If 'en' doesn't exist either, return undefined
                if (!progressData.categoryProgress[categoryIndex].languageProgress[language]) {
                    return undefined; // Default language not found
                }
            }

            // Find the lesson within the language-specific category
            const lessonIndex = progressData.categoryProgress[categoryIndex].languageProgress[language].lessons.findIndex((lesson) => lesson.id === lessonId);

            if (lessonIndex === -1) {
                return undefined; // Lesson not found
            }

            // Get the watchDuration value
            const watchDuration = progressData.categoryProgress[categoryIndex].languageProgress[language].lessons[lessonIndex].watchDuration;

            // If it's a number and greater than 0, return it
            if (typeof watchDuration === 'number' && watchDuration > 0) {
                return watchDuration;
            }

            return undefined;
        } catch (error) {
            console.error('Error getting video position:', error);
            return undefined;
        }
    }

    /**
     * Resets a user's progress to the initial state using the resetProgressStructure from DataService
     * @param userEmail Email of the user whose progress should be reset
     * @returns Promise that resolves when the progress has been reset
     */
    async resetProgress(userEmail: string): Promise<void> {
        try {
            // Use the comprehensive resetProgressStructure method from DataService
            // which properly initializes all lessons and language-specific progress
            await this.dataService.resetProgressStructure(userEmail);
            console.log(`Progress reset successfully for user: ${userEmail}`);
            return Promise.resolve();
        } catch (error) {
            console.error('Error resetting progress:', error);
            return Promise.reject(error);
        }
    }

    /**
     * Generates initial progress data structure based on lessons from LessonsService
     * @param userEmail User's email address
     * @returns Observable with the generated progress data
     */
    private generateInitialProgressData(userEmail: string): Observable<IProgress> {
        // Define the categories we want to fetch lessons for
        const categories = ['bb', 'intro', 'intermediate', 'advanced'];
        const languages = ['en', 'ta', 'te', 'hi', 'or', 'ka'];

        // Map category values to display names
        const categoryDisplayNames: Record<string, 'BB' | 'Introductory' | 'Intermediate' | 'Advanced'> = {
            bb: 'BB',
            intro: 'Introductory',
            intermediate: 'Intermediate',
            advanced: 'Advanced',
        };

        // Create an array of observables for each category
        const categoryObservables = categories.map((category) =>
            this.lessonsService.getAllLessonsForCategory(category).pipe(
                map((lessons) => {
                    // Create language progress structure for this category
                    const languageProgress: Record<string, LanguageProgress> = {};

                    // Initialize language progress for each supported language
                    languages.forEach((lang) => {
                        // Map lessons to progress structure
                        const lessonsProgress: LessonsProgress[] = lessons.map((lesson, index) => {
                            return {
                                id: lesson.id,
                                name: lesson.names?.[lang] || lesson.names?.['en'] || `Lesson ${lesson.lessonNo}`,
                                lessonNo: lesson.lessonNo,
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: index === 0 ? false : true, // First lesson is unlocked
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null,
                            };
                        });

                        // Add language progress
                        languageProgress[lang] = {
                            progress: '0',
                            lessons: lessonsProgress,
                        };
                    });

                    // Create category progress
                    return {
                        categoryName: categoryDisplayNames[category],
                        locked: category === 'bb' ? false : true, // Only BB is unlocked initially
                        progress: '0',
                        languageProgress,
                    } as CategoryProgress;
                }),
            ),
        );

        // Combine all category observables
        return combineLatest(categoryObservables).pipe(
            map((categoryProgressArray) => {
                // Create the initial progress structure
                return {
                    id: '',
                    email: userEmail,
                    classId: '',
                    userId: '',
                    categoryProgress: categoryProgressArray,
                } as IProgress;
            }),
        );
    }

    /**
     * Debug method to test the generation of initial progress data
     * @param userEmail User's email address
     * @returns Observable with the generated progress data
     */
    debugGenerateProgressData(userEmail: string = 'test@example.com'): Observable<IProgress> {
        console.log('Starting debug generation of progress data...');
        return this.generateInitialProgressData(userEmail).pipe(
            tap((progressData) => {
                console.log('Generated Progress Data:', JSON.stringify(progressData, null, 2));

                // Log some statistics
                const totalCategories = progressData.categoryProgress.length;
                const totalLessons = progressData.categoryProgress.reduce((sum, category) => {
                    const firstLanguage = Object.keys(category.languageProgress)[0] || 'en';
                    return sum + (category.languageProgress[firstLanguage]?.lessons.length || 0);
                }, 0);

                console.log(`Statistics: ${totalCategories} categories, ${totalLessons} total lessons`);

                // Log language support
                const languages = Object.keys(progressData.categoryProgress[0]?.languageProgress || {});
                console.log(`Supported languages: ${languages.join(', ')}`);
            }),
        );
    }

    // Helper method to map category abbreviations to full category names
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
