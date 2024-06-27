import { Injectable, inject } from '@angular/core';
import { CollectionReference, DocumentData, Firestore, addDoc, collection, collectionData, doc, docSnapshots, limit, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable, first, firstValueFrom, from, map, switchMap, tap } from 'rxjs';
import { IProgress } from '../../models/progress.interface';
import {  progressData } from '../../utils/init-data';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {

  fs = inject(Firestore);

  progressRef!: CollectionReference;

  constructor() { 
    this.progressRef = collection(this.fs, 'progress');
  }

  initializeProgressOnLoad(userEmail: string): Observable<IProgress> {
    const progressQuery = query(this.progressRef,where('email', '==', userEmail))
    return collectionData(progressQuery, { idField: 'id' }).pipe(
      switchMap(progressDocs => {
        if (progressDocs.length > 0) {
          const progressDoc = progressDocs[0];
          return docSnapshots(doc(this.progressRef, `${progressDoc.id}`)).pipe(
            map(docSnap => ({id: docSnap.id, ...docSnap.data()}) as IProgress) 
          );
        } else {
          const initialProgress: IProgress = {...progressData , email: userEmail};
          return from(addDoc(this.progressRef, initialProgress)).pipe(
            tap(docRef => console.log('Progress seeded successfully with ID:', docRef.id)),
            switchMap(docRef => 
              docSnapshots(docRef).pipe(
                map(docSnap => ({id: docSnap.id, ...docSnap.data()}) as IProgress)
              )
            )
          );
        }
      })
    );
  }

  updateProgress(userEmail: string, updatedLessonData: Partial<IProgress>): Observable<IProgress> {
    const progressQuery = query(this.progressRef,where('email', '==', userEmail))
    return collectionData(progressQuery, { idField: 'id' }).pipe(
      first(),
      map((progressDocs: any[]) => progressDocs.map(doc => ({id: doc.id, ...doc}) as IProgress)),
      switchMap((progressDocs: IProgress[]) => {
        if (progressDocs.length > 0) {
          const progressDoc = progressDocs[0];
          const progressRef = doc(this.fs,'progress', progressDoc.id);
          return updateDoc(progressRef, updatedLessonData).then(() => progressDoc); // updateDoc is promise
        } else {
          throw new Error('No progress document found for the given email');
        }
      })
    );
  }

  getProgressData(email:string){
    const progressQuery = query(this.progressRef,where('email', '==', email));
    return collectionData(progressQuery, { idField: 'id'}).pipe(
      map(progressDocs => {
        if (progressDocs.length > 0) {
          const progressDoc = progressDocs[0];
          return docSnapshots(doc(this.progressRef, `${progressDoc.id}`)).pipe(
            map(docSnap => ({id: docSnap.id, ...docSnap.data()}) as IProgress) 
          );
        } else {
           throw Error ('Progress not found');
        }
      }) 
    )
  }

  async getProgressByEmail(email: string): Promise<any> { // Change 'any' to your progress data type
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
}
