import { Injectable, inject } from '@angular/core';
import { Observable, from, lastValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Lesson } from '../models/lesson.model';
import { CollectionReference, Firestore, addDoc, collection, collectionData, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { IProgress } from '../models/progress.interface';
import { Storage, getDownloadURL, ref } from '@angular/fire/storage';
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

    async checkUserProgress() {
        try {
            const user = await this.auth.currentUser;
            if (user) {
                const progressRef = collection(this.fs, 'progress');
                const q = query(progressRef, where('email', '==', user.email));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    // No existing progress for this user, create a new entry
                    await addDoc(progressRef, { email: user.email, test: true });
                    console.log('New progress entry added successfully!');
                } else {
                    // Update the existing progress (you'll need to decide how)
                    const docId = querySnapshot.docs[0].id;
                    const docRef = doc(this.fs, 'progress', docId);
                    await setDoc(docRef, { test: true }, { merge: true });
                    console.log('Existing progress updated successfully!');
                }
            } else {
                console.error('User not authenticated.');
            }
        } catch (error) {
            console.error('Error managing progress entry:', error);
        }
    }

    // async getVideo(category: string, lang: string, path: string) {
    //     try {
    //         const storagePath = `lessons/${category}/${lang}/${path}.mp4`;
    //         const storageRef = ref(this.s, storagePath);

    //         // Directly await the Promise from getDownloadURL
    //         const url = await getDownloadURL(storageRef);
    //         return url;
    //     } catch (error) {
    //         console.error('Error getting video URL:', error);
    //         return null;
    //     }
    // }

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

    // New method to get video from Vimeo instead of Firebase Storage
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

    // Keep the original method for backward compatibility during migration
    async getVideo(category: string, lang: string, path: string, quality: 'sd' | 'hd' | 'highest' = 'highest'): Promise<string | null> {
        try {
            // First attempt to get video from Vimeo
            const vimeoUrl = await this.getVideoFromVimeo(category, lang, path);
            if (vimeoUrl) {
                return vimeoUrl;
            }

            // Fallback to Firebase Storage if Vimeo fails
            console.log('Falling back to Firebase Storage for video');
            const storagePath = `lessons/${category}/${lang}/${path}.mp4`;
            const storageRef = ref(this.s, storagePath);
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error('Error getting video URL:', error);

            // As a last resort, try Firebase directly if Vimeo fails
            try {
                console.log('Attempting direct Firebase Storage access as final fallback');
                const storagePath = `lessons/${category}/${lang}/${path}.mp4`;
                const storageRef = ref(this.s, storagePath);
                return await getDownloadURL(storageRef);
            } catch (fbError) {
                console.error('All video retrieval methods failed:', fbError);
                return null;
            }
        }
    }
}
