import { Injectable, inject } from '@angular/core';
import { CollectionReference, Firestore, addDoc, collection, doc, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Observable, catchError, first, from, map, of, switchMap, tap } from 'rxjs';
import { ILesson } from '../../models/lessons.interface';

@Injectable({
    providedIn: 'root',
})
export class LessonsService {
    lessonsRef!: CollectionReference;
    firestore = inject(Firestore);

    constructor() {}

    seedLessonsByCategory(category: string, lessons: ILesson[]): Observable<boolean> {
        const categoryCollectionRef = collection(this.firestore, `lessons/${category}/lesson`);

        return from(getDocs(categoryCollectionRef)).pipe(
            switchMap((snapshot) => {
                if (snapshot.empty) {
                    // Seed only if the category is empty
                    const seedTasks = lessons.map((lesson) => addDoc(categoryCollectionRef, lesson));
                    return from(Promise.all(seedTasks)).pipe(
                        tap(() => console.log(`Seeded lessons for category '${category}' successfully!`)),
                        map(() => true), // Seeding successful
                    );
                } else {
                    console.log(`Category '${category}' already has lessons.`);
                    return of(false); // Seeding skipped
                }
            }),
            catchError((error) => {
                console.error(`Error seeding lessons for category '${category}':`, error);
                return of(false); // Seeding failed
            }),
        );
    }

    getLessonById(id: string, category: string): Observable<ILesson | null> {
        const lessonsCollectionRef = collection(this.firestore, `lessons/${category}/lesson`);
        const q = query(lessonsCollectionRef, where('id', '==', id));
        return from(getDocs(q)).pipe(
            map((querySnapshot) => {
                if (!querySnapshot.empty) {
                    const docSnapshot = querySnapshot.docs[0];
                    return docSnapshot.data() as ILesson;
                } else {
                    return null;
                }
            }),
            first(), // Ensure you get only the first matching lesson (or null)
        );
    }
}
