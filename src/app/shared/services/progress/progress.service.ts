import { Injectable, inject } from '@angular/core';
import { CollectionReference, Firestore, addDoc, getDocs, collection, collectionData, doc, docSnapshots, limit, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable, first, firstValueFrom, from, map, switchMap, tap } from 'rxjs';
import { IProgress } from '../../models/progress.interface';
import { progressData } from '../../utils/init-data';

@Injectable({
    providedIn: 'root',
})
export class ProgressService {
    fs = inject(Firestore);

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
                    const initialProgress: IProgress = { ...progressData, email: userEmail };
                    return from(addDoc(this.progressRef, initialProgress)).pipe(
                        tap((docRef) => console.log('Progress seeded successfully with ID:', docRef.id)),
                        switchMap((docRef) => docSnapshots(docRef).pipe(map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as IProgress))),
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
        // Change 'any' to your progress data type
        const progressCollection = collection(this.fs, 'progress'); // Assuming 'progress' is your collection name
        const q = query(progressCollection, where('email', '==', email), orderBy('timestamp', 'desc'), limit(1)); // Get latest by timestamp

        try {
            const snapshot = await firstValueFrom(collectionData(q)); // Convert Observable to Promise
            return snapshot.length > 0 ? snapshot[0] : null; // Extract data or return null if not found
        } catch (error) {
            console.error('Error fetching progress:', error);
            throw error; // Rethrow error to be handled by caller
        }
    }

    // Add this method to the ProgressService class
    async updateLessonCompletion(userEmail: string, category: string, lessonId: string): Promise<void> {
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

            // Find the lesson within that category
            const lessonIndex = progressData.categoryProgress[categoryIndex].lessons.findIndex((lesson) => lesson.id === lessonId);

            if (lessonIndex === -1) {
                throw new Error(`Lesson ${lessonId} not found in category ${category}`);
            }

            // Create a deep copy of the progress data to modify
            const updatedProgress = JSON.parse(JSON.stringify(progressData));

            // Update the completion status
            updatedProgress.categoryProgress[categoryIndex].lessons[lessonIndex].completed = true;
            updatedProgress.categoryProgress[categoryIndex].lessons[lessonIndex].progress = '100';
            updatedProgress.categoryProgress[categoryIndex].lessons[lessonIndex].completedDate = {
                seconds: Math.floor(Date.now() / 1000),
                nanoseconds: 0,
            };

            // Unlock the next lesson if it exists
            const currentLessonNo = parseInt(updatedProgress.categoryProgress[categoryIndex].lessons[lessonIndex].lessonNo);
            const nextLesson = updatedProgress.categoryProgress[categoryIndex].lessons.find((lesson: { lessonNo: string }) => parseInt(lesson.lessonNo) === currentLessonNo + 1);

            if (nextLesson) {
                nextLesson.locked = false;
            }

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

    // Add this method to the ProgressService class
    async updateQuizAnswers(userEmail: string, category: string, lessonId: string, quizAnswers: number[]): Promise<void> {
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

            // Find the lesson within that category
            const lessonIndex = progressData.categoryProgress[categoryIndex].lessons.findIndex((lesson) => lesson.id === lessonId);

            if (lessonIndex === -1) {
                throw new Error(`Lesson ${lessonId} not found in category ${category}`);
            }

            // Create a deep copy of the progress data to modify
            const updatedProgress = JSON.parse(JSON.stringify(progressData));

            // Update the quiz answers
            updatedProgress.categoryProgress[categoryIndex].lessons[lessonIndex].quizAnswers = quizAnswers;

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
    async saveVideoPosition(userEmail: string, category: string, lessonId: string, position: number): Promise<void> {
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
            const categoryIndex = progressData.categoryProgress.findIndex(
                cp => cp.categoryName.toLowerCase() === this.mapCategoryName(category).toLowerCase()
            );
    
            if (categoryIndex === -1) {
                throw new Error(`Category ${category} not found in progress data`);
            }
    
            // Find the lesson within the category
            const lessonIndex = progressData.categoryProgress[categoryIndex].lessons.findIndex(
                lesson => lesson.id === lessonId
            );
    
            if (lessonIndex === -1) {
                throw new Error(`Lesson ${lessonId} not found in category ${category}`);
            }
    
            // Create a copy of the progress data to modify
            const updatedProgress = JSON.parse(JSON.stringify(progressData));
            
            // Update the watchDuration with the current position
            updatedProgress.categoryProgress[categoryIndex].lessons[lessonIndex].watchDuration = position;
            
            // Update the document in Firestore
            const progressDocRef = doc(this.fs, 'progress', progressDoc.id);
            await updateDoc(progressDocRef, {
                categoryProgress: updatedProgress.categoryProgress
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
async getVideoPosition(userEmail: string, category: string, lessonId: string): Promise<number | undefined> {
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
        const categoryIndex = progressData.categoryProgress.findIndex(
            cp => cp.categoryName.toLowerCase() === this.mapCategoryName(category).toLowerCase()
        );

        if (categoryIndex === -1) {
            return undefined; // Category not found
        }

        // Find the lesson within the category
        const lessonIndex = progressData.categoryProgress[categoryIndex].lessons.findIndex(
            lesson => lesson.id === lessonId
        );

        if (lessonIndex === -1) {
            return undefined; // Lesson not found
        }

        // Get the watchDuration value
        const watchDuration = progressData.categoryProgress[categoryIndex].lessons[lessonIndex].watchDuration;
        
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
}