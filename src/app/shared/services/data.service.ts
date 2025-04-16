import { Injectable, inject } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { Lesson } from '../models/lesson.model';
import { CollectionReference, Firestore, addDoc, collection, collectionData, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { IProgress } from '../models/progress.interface';
import { Storage } from '@angular/fire/storage';
import { IUser, IUserDetails } from '../models/user.interface';
import { VimeoService } from './vimeo/vimeo.service';

@Injectable({
    providedIn: 'root',
})
export class DataService {
    progressRef!: CollectionReference;
    usersRef!: CollectionReference;
    lessonsRef!: CollectionReference;

    users$!: Observable<IUserDetails[]>;

    private progressData: IProgress | null = null;
    private selectedLesson: any = null;
    private userEmail: string | null = null;

    fs = inject(Firestore);
    auth = inject(Auth);
    s = inject(Storage);
    vimeoService = inject(VimeoService);

    constructor() {
        this.usersRef = collection(this.fs, 'users');
        this.progressRef = collection(this.fs, 'progress');
        this.lessonsRef = collection(this.fs, 'lessons');
        // this.users$ = collectionData(this.usersRef) as Observable<UserDetails[]>;
    }

    setLessonData(progress: IProgress, lesson: any, email: string) {
        this.progressData = progress;
        this.selectedLesson = lesson;
        this.userEmail = email;
    }

    getProgressData(): IProgress | null {
        return this.progressData;
    }
    getSelectedLesson(): any {
        return this.selectedLesson;
    }
    getUserEmail(): string | null {
        return this.userEmail;
    }

    /* --------------------- Re: Functions (Need to rearrange) --------------------------- */

    getAllUsersData(): Observable<IUserDetails[]> {
        return collectionData(this.usersRef, { idField: 'id' }) as Observable<IUserDetails[]>;
    }

    getAllLessons(): Observable<Lesson[]> {
        return collectionData(this.lessonsRef) as Observable<Lesson[]>;
    }

    getAllLessonSubCollection(category: string): Observable<any[]> {
        const lessonRef = doc(this.fs, 'lessons', category);
        const subcollectionRef = collection(lessonRef, 'lesson');

        const q = query(subcollectionRef, orderBy('name'));

        return collectionData(q, { idField: 'id' });
    }



    async getUserByEmail(email: string): Promise<IUser | null> {
        const q = query(this.usersRef, where('email', '==', email));

        try {
            const querySnapshot = await getDocs(q);
            console.log('querysnapshot:', querySnapshot);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                return { id: userDoc.id, ...userDoc.data() } as IUser;
            } else {
                return null; // User not found
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    // Add this method to your DataService class to reset progress
    async resetProgressStructure(userEmail: string): Promise<void> {
        if (!userEmail) {
            console.error('Cannot reset progress: No user email provided');
            return;
        }

        try {
            // Get user information to populate the reset structure
            const user = await this.getUserByEmail(userEmail);
            if (!user) {
                console.error('User not found:', userEmail);
                return;
            }

            // Get the progress document reference
            const progressRef = collection(this.fs, 'progress');
            const q = query(progressRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            // Initialize the default progress structure
            // Inside resetProgressStructure method in data.service.ts
            const defaultProgress: IProgress = {
                id: querySnapshot.empty ? '' : querySnapshot.docs[0].id,
                email: userEmail,
                classId: user.classId || '',
                userId: user.id || '',
                categoryProgress: [
                    {
                        categoryName: 'BB',
                        locked: false,
                        progress: '0',
                        lessons: [
                            {
                                id: 'bblesson01',
                                name: 'Sealed Book and Revelation',
                                lessonNo: '1',
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: false,
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null, // Added the new field with default value
                            },
                            {
                                id: 'bblesson02',
                                name: 'Seed and Harvest (Sign of Second Coming)',
                                lessonNo: '2',
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: true,
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null, // Added the new field with default value
                            },
                            {
                                id: 'bblesson03',
                                name: 'How to read Prophecy (Prophecy and Secrets of the Kingdom of Heaven in Parable)',
                                lessonNo: '3',
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: true,
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null, // Added the new field with default value
                            },
                            {
                                id: 'bblesson04',
                                name: 'Introduction to Revelation',
                                lessonNo: '4',
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: true,
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null, // Added the new field with default value
                            },
                            {
                                id: 'bblesson05',
                                name: "Moses's Tabernacle & Copy and Shadow/Reality",
                                lessonNo: '5',
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: true,
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null, // Added the new field with default value
                            },
                            {
                                id: 'bblesson06',
                                name: 'Elementary teaching and teaching of righteousness for the mature',
                                lessonNo: '6',
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: true,
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null, // Added the new field with default value
                            },
                            {
                                id: 'bblesson07',
                                name: "God's covenants (OT and NT)",
                                lessonNo: '7',
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: true,
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null, // Added the new field with default value
                            },
                            {
                                id: 'bblesson08',
                                name: "God's will and purpose (6,000 years of God's work and history)",
                                lessonNo: '8',
                                watchDuration: 0,
                                progress: '0',
                                completed: false,
                                locked: true,
                                startDate: null,
                                completedDate: null,
                                postQuizId: null,
                                quizAnswers: null, // Added the new field with default value
                            },
                        ],
                    },
                    {
                        categoryName: 'Introductory',
                        progress: '0',
                        locked: true,
                        lessons: [],
                    },
                    {
                        categoryName: 'Intermediate',
                        progress: '0',
                        locked: true,
                        lessons: [],
                    },
                    {
                        categoryName: 'Advanced',
                        progress: '0',
                        locked: true,
                        lessons: [],
                    },
                ],
            };

            // If a progress document exists, update it; otherwise, create a new one
            if (!querySnapshot.empty) {
                const progressDocRef = doc(this.fs, 'progress', querySnapshot.docs[0].id);
                await setDoc(progressDocRef, defaultProgress);
                console.log('Progress structure reset for user:', userEmail);
            } else {
                const newDoc = await addDoc(progressRef, defaultProgress);
                console.log('New progress structure created for user:', userEmail, 'with ID:', newDoc.id);
            }
        } catch (error) {
            console.error('Error resetting progress structure:', error);
        }
    }

    // Updated method to safely update lesson progress without losing data
    async updateLessonProgress(userEmail: string, category: string, lessonId: string, progressRate: number): Promise<void> {
        if (!userEmail) {
            console.error('Cannot update progress: No user email provided');
            return;
        }

        try {
            // Get the user's progress document
            const progressRef = collection(this.fs, 'progress');
            const q = query(progressRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error('No progress document found for user:', userEmail);
                // Consider creating a default progress structure if none exists
                await this.resetProgressStructure(userEmail);
                return;
            }

            // Get the first matching progress document
            const progressDoc = querySnapshot.docs[0];
            const progressData = progressDoc.data() as IProgress;

            // Find the category in the user's progress
            const categoryIndex = progressData.categoryProgress.findIndex((cp) => cp.categoryName.toLowerCase() === this.getCategoryName(category).toLowerCase());

            if (categoryIndex === -1) {
                console.error('Category not found in user progress:', category);
                return;
            }

            // Find the lesson within the category
            const lessonIndex = progressData.categoryProgress[categoryIndex].lessons.findIndex((lesson) => lesson.id === lessonId);

            if (lessonIndex === -1) {
                console.error('Lesson not found in category progress:', lessonId);
                return;
            }

            // Get the current lesson to preserve its fields
            const currentLesson = progressData.categoryProgress[categoryIndex].lessons[lessonIndex];

            // Create an updated lesson with all original fields preserved
            const updatedLesson = {
                ...currentLesson,
                watchDuration: progressRate,
                progress: progressRate.toString(),
            };

            // Set startDate if it's null and progress is being updated
            if (currentLesson.startDate === null && progressRate > 0) {
                updatedLesson.startDate = {
                    seconds: Math.floor(Date.now() / 1000),
                    nanoseconds: 0,
                };
            }

            // Set completedDate and completed flag if progress is 100%
            if (progressRate >= 100) {
                updatedLesson.completed = true;
                updatedLesson.completedDate = {
                    seconds: Math.floor(Date.now() / 1000),
                    nanoseconds: 0,
                };
            }

            // Get the updated category progress
            const updatedLessons = [...progressData.categoryProgress[categoryIndex].lessons];
            updatedLessons[lessonIndex] = updatedLesson;

            // Calculate the new average progress for the category
            let totalProgress = 0;
            updatedLessons.forEach((lesson) => {
                totalProgress += parseFloat(lesson.progress || '0');
            });

            const categoryProgress = Math.round(totalProgress / updatedLessons.length);

            // Unlock the next lesson if this one is completed
            if (progressRate >= 100 && lessonIndex < updatedLessons.length - 1) {
                updatedLessons[lessonIndex + 1].locked = false;
            }

            // Create an updated category with all fields preserved
            const updatedCategory = {
                ...progressData.categoryProgress[categoryIndex],
                progress: categoryProgress.toString(),
                lessons: updatedLessons,
            };

            // Create updated categoryProgress array
            const updatedCategoryProgress = [...progressData.categoryProgress];
            updatedCategoryProgress[categoryIndex] = updatedCategory;

            // Update the entire document with the spread operator approach
            const progressDocRef = doc(this.fs, 'progress', progressDoc.id);
            await updateDoc(progressDocRef, {
                categoryProgress: updatedCategoryProgress,
            });

            console.log(`Progress updated for lesson ${lessonId}: ${progressRate}%`);
        } catch (error) {
            console.error('Error updating lesson progress:', error);
        }
    }

    // Helper method to convert category path to proper category name
    private getCategoryName(category: string): string {
        // Map category paths to category names used in the IProgress interface
        const categoryMap: { [key: string]: string } = {
            bb: 'BB',
            intro: 'Introductory',
            intermediate: 'Intermediate',
            advanced: 'Advanced',
        };

        return categoryMap[category.toLowerCase()] || category;
    }

    // Helper method to convert language name to code
    private getLanguageCode(language: string): string {
        const langMap: { [key: string]: string } = {
            English: 'en',
            Tamil: 'ta',
            Telugu: 'te',
            Hindi: 'hi',
            Odia: 'or',
        };

        return langMap[language] || 'en';
    }

    // New method to get video directly from Vimeo using the vimeoId field for a specific language
    async getVideoDirectlyFromVimeo(vimeoId: string): Promise<string | null> {
        try {
            // Get the actual video URL with the requested quality
            const videoUrl = await lastValueFrom(this.vimeoService.getVideoUrl(vimeoId));
            return videoUrl;
        } catch (error) {
            console.error('Error getting video URL directly from Vimeo:', error);
            return null;
        }
    }

    // Updated method that gets video from Vimeo using the mapping service
    async getVideoFromVimeo(category: string, lang: string, path: string): Promise<string | null> {
        try {
            // First, map the path to a Vimeo ID
            const vimeoId = await lastValueFrom(this.vimeoService.mapPathToVimeoId(category, lang, path));

            // Then get the actual video URL with the requested quality
            const videoUrl = await lastValueFrom(this.vimeoService.getVideoUrl(vimeoId));

            return videoUrl;
        } catch (error) {
            console.error('Error getting video URL from Vimeo:', error);
            return null;
        }
    }

    // Updated to use only Vimeo for video retrieval without Firebase fallback
    async getVideo(category: string, lang: string, path: string, quality: 'sd' | 'hd' | 'highest' = 'highest'): Promise<string | null> {
        try {
            // First try to get the lesson document
            const lessonRef = doc(this.fs, 'lessons', category);
            const lessonSubcollection = collection(lessonRef, 'lesson');
            const q = query(lessonSubcollection, where('path', '==', path));

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const lessonData = querySnapshot.docs[0].data();

                // If the lesson has vimeoIds and there's an entry for this language
                if (lessonData['vimeoIds'] && lessonData['vimeoIds'][lang]) {
                    console.log(`Using language-specific vimeoId ${lessonData['vimeoIds'][lang]} for ${lang}`);
                    return await this.getVideoDirectlyFromVimeo(lessonData['vimeoIds'][lang]);
                }

                // If no language-specific ID but the lesson has any vimeoIds, try to find a fallback
                if (lessonData['vimeoIds']) {
                    // Try to use English as fallback
                    if (lessonData['vimeoIds']['en']) {
                        console.log(`Using English vimeoId as fallback: ${lessonData['vimeoIds']['en']}`);
                        return await this.getVideoDirectlyFromVimeo(lessonData['vimeoIds']['en']);
                    }

                    // Or use the first available language
                    const firstLang = Object.keys(lessonData['vimeoIds'])[0];
                    if (firstLang) {
                        console.log(`Using ${firstLang} vimeoId as fallback: ${lessonData['vimeoIds'][firstLang]}`);
                        return await this.getVideoDirectlyFromVimeo(lessonData['vimeoIds'][firstLang]);
                    }
                }
            }

            // If no direct vimeoId, try to get video from Vimeo using mapping
            const vimeoUrl = await this.getVideoFromVimeo(category, lang, path);
            if (vimeoUrl) {
                return vimeoUrl;
            }

            // No fallback to Firebase Storage anymore
            console.log('No video found on Vimeo');
            return null;
        } catch (error) {
            console.error('Error getting video URL from Vimeo:', error);
            return null;
        }
    }
}
