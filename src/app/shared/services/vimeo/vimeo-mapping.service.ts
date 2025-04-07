import { Injectable, inject } from '@angular/core';
import { CollectionReference, Firestore, addDoc, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Observable, catchError, from, map, of } from 'rxjs';

export interface IVimeoMapping {
    id?: string;
    firebasePath: string; // Format: category/language/path
    vimeoId: string; // Vimeo video ID
    title?: string; // Optional video title
    description?: string; // Optional video description
}

@Injectable({
    providedIn: 'root',
})
export class VimeoMappingService {
    private firestore = inject(Firestore);
    private mappingsCollection: CollectionReference;

    constructor() {
        this.mappingsCollection = collection(this.firestore, 'vimeoMappings');
    }

    /**
     * Get Vimeo ID for a specific Firebase path
     */
    getVimeoIdForPath(category: string, language: string, path: string): Observable<string | null> {
        const firebasePath = `${category}/${language}/${path}`;
        const q = query(this.mappingsCollection, where('firebasePath', '==', firebasePath));

        return from(getDocs(q)).pipe(
            map((snapshot) => {
                if (snapshot.empty) {
                    console.warn(`No Vimeo mapping found for path: ${firebasePath}`);
                    return null;
                }
                const mapping = snapshot.docs[0].data() as IVimeoMapping;
                return mapping.vimeoId;
            }),
            catchError((error) => {
                console.error('Error fetching Vimeo mapping:', error);
                return of(null);
            }),
        );
    }

    /**
     * Add a new mapping between Firebase path and Vimeo ID
     */
    addMapping(mapping: IVimeoMapping): Observable<string> {
        return from(addDoc(this.mappingsCollection, mapping)).pipe(
            map((docRef) => docRef.id),
            catchError((error) => {
                console.error('Error adding Vimeo mapping:', error);
                throw error;
            }),
        );
    }

    /**
     * Get all mappings
     */
    getAllMappings(): Observable<IVimeoMapping[]> {
        return from(getDocs(this.mappingsCollection)).pipe(
            map((snapshot) => {
                return snapshot.docs.map((doc) => {
                    const data = doc.data() as IVimeoMapping;
                    return { ...data, id: doc.id };
                });
            }),
            catchError((error) => {
                console.error('Error fetching all Vimeo mappings:', error);
                return of([]);
            }),
        );
    }

    /**
     * Seed initial mappings (useful for initial setup)
     */
    seedMappings(mappings: IVimeoMapping[]): Observable<boolean> {
        return from(getDocs(this.mappingsCollection)).pipe(
            map((snapshot) => {
                // Only seed if collection is empty
                if (!snapshot.empty) {
                    console.log('Mappings already exist, skipping seed operation');
                    return false;
                }

                // Add all mappings
                const addPromises = mappings.map((mapping) => addDoc(this.mappingsCollection, mapping));

                Promise.all(addPromises)
                    .then(() => console.log('Successfully seeded Vimeo mappings'))
                    .catch((error) => console.error('Error seeding Vimeo mappings:', error));

                return true;
            }),
            catchError((error) => {
                console.error('Error in seed operation:', error);
                return of(false);
            }),
        );
    }
}
