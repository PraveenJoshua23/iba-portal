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
