import { Injectable, inject } from '@angular/core';
import { CollectionReference, Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Observable, first, from, map } from 'rxjs';
import { ILesson } from '../../models/lessons.interface';

@Injectable({
    providedIn: 'root',
})
export class LessonsService {
    lessonsRef!: CollectionReference;
    firestore = inject(Firestore);

    constructor() {}

    getLessonById(id: string, category: string, language: string = 'en'): Observable<ILesson | null> {
        const lessonsCollectionRef = collection(this.firestore, `lessons/${category}/lesson`);
        const q = query(lessonsCollectionRef, where('id', '==', id));
        return from(getDocs(q)).pipe(
            map((querySnapshot) => {
                if (!querySnapshot.empty) {
                    const docSnapshot = querySnapshot.docs[0];
                    const lessonData = docSnapshot.data() as ILesson;

                    // Ensure the lesson has the required language-specific properties
                    this.ensureLanguageProperties(lessonData, language);

                    return lessonData;
                } else {
                    return null;
                }
            }),
            first(), // Ensure you get only the first matching lesson (or null)
        );
    }

    // Add a method to get all lessons for a category with language-specific titles
    getAllLessonsForCategory(category: string, language: string = 'en'): Observable<ILesson[]> {
        const lessonsCollectionRef = collection(this.firestore, `lessons/${category}/lesson`);
        return from(getDocs(lessonsCollectionRef)).pipe(
            map((querySnapshot) => {
                const lessons: ILesson[] = [];
                querySnapshot.forEach((doc) => {
                    const lessonData = doc.data() as ILesson;

                    // Ensure the lesson has the required language-specific properties
                    this.ensureLanguageProperties(lessonData, language);

                    lessons.push(lessonData);
                });
                return lessons;
            }),
            first(),
        );
    }

    /**
     * Helper method to ensure language-specific properties are properly initialized
     * @param lessonData The lesson data to process
     * @param language The target language
     */
    private ensureLanguageProperties(lessonData: ILesson, language: string): void {
        // Initialize names map if it doesn't exist
        if (!lessonData.names) {
            lessonData.names = {};
        }

        // Initialize descriptions map if it doesn't exist
        if (!lessonData.descriptions) {
            lessonData.descriptions = {};
        }

        // Initialize vimeoIds map if it doesn't exist
        if (!lessonData.vimeoIds) {
            lessonData.vimeoIds = {};
        }

        // Migrate legacy data if needed (for backward compatibility)
        if ('name' in lessonData && typeof lessonData['name'] === 'string') {
            // If old format data has a name property, move it to the names map
            lessonData.names['en'] = lessonData['name'] as string;
            delete lessonData['name'];
        }

        if ('description' in lessonData && typeof lessonData['description'] === 'string') {
            // If old format data has a description property, move it to the descriptions map
            lessonData.descriptions['en'] = lessonData['description'] as string;
            delete lessonData['description'];
        }

        if ('vimeoId' in lessonData && typeof lessonData['vimeoId'] === 'string') {
            // If old format data has a vimeoId property, move it to the vimeoIds map
            lessonData.vimeoIds['en'] = lessonData['vimeoId'] as string;
            delete lessonData['vimeoId'];
        }
    }
}
