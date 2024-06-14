import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { UserDetails } from '../models/user.model';
import { Lesson } from '../models/lesson.model';
import { CollectionReference, Firestore, addDoc, collection, collectionData, doc, getDocs, orderBy, query, setDoc, where } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';

interface Progress {
  email: string;
  displayName?: string;
  // ...other profile details
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  
  progressRef!: CollectionReference;
  usersRef!: CollectionReference;
  lessonsRef!: CollectionReference;

  users$!: Observable<UserDetails[]>;

  fs = inject(Firestore);
  auth = inject(Auth);

  constructor() {
    this.usersRef = collection(this.fs, 'users');
    this.progressRef = collection(this.fs, 'progress');
    this.lessonsRef = collection(this.fs, 'lessons');
    // this.users$ = collectionData(this.usersRef) as Observable<UserDetails[]>; 

  }

  getAllUsersData(): Observable<UserDetails[]>{
    return collectionData(this.usersRef) as Observable<UserDetails[]>
  }

  getAllLessons():Observable<Lesson[]>{
    return collectionData(this.lessonsRef) as Observable<Lesson[]>;
  }

  getAllLessonSubCollection(category:string):Observable<any[]>{
    const lessonRef = doc(this.fs, 'lessons', category); 
    const subcollectionRef = collection(lessonRef, 'lesson');

    const q = query(subcollectionRef, orderBy('name'));

    return collectionData(q, { idField: 'id' }) ;
  }

  async checkUserProgress(){
    try {
      const user = await this.auth.currentUser;
      if (user) {
        const progressRef = collection(this.fs, 'progress');
        const q = query(progressRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // No existing progress for this user, create a new entry
          await addDoc(progressRef, { email: user.email, test:true });
          console.log('New progress entry added successfully!');
        } else {
          // Update the existing progress (you'll need to decide how)
          const docId = querySnapshot.docs[0].id;
          const docRef = doc(this.fs, 'progress', docId);
          await setDoc(docRef, { test:  true }, { merge: true });
          console.log('Existing progress updated successfully!');
        }
      } else {
        console.error('User not authenticated.');
      }
    } catch (error) {
      console.error('Error managing progress entry:', error);
    }
  }

  getProgress(email: string): Observable<Progress | null>{
    
      const q = query(this.progressRef, where('email', '==', email));

      return from(getDocs(q)).pipe( // Convert Promise to Observable
        switchMap(snapshot => {
          if (snapshot.empty) {
            return of(null);
          } else {
            // Assuming you only expect one document with the given email
            console.log(snapshot.docs[0].data())
            return of(snapshot.docs[0].data() as Progress);
          }
        })
      );
   
  }

  getCurrentUser$(): Observable<Progress | null> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (user) {
          return this.getProgress(user.email as string);
        } else {
          return of(null);
        }
      })
    );
  }

  getUserByEmail(email: string): Observable<any> {
    const q = query(this.usersRef, where('email', '==', email));

    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          return userDoc.data();
        } else {
          return null; 
        }
      }),
      catchError(error => {
        console.error('Error getting user details:', error);
        return of(null); // Return null if there's an error
      })
    );
  }



  // get(id: string): Observable<YourDataModel> {
  //   return this.collection.doc<YourDataModel>(id).valueChanges();
  // }

  // create(data: YourDataModel): Promise<void> {
  //   return this.collection.add(data);
  // }

  // update(id: string, data: YourDataModel): Promise<void> {
  //   return this.collection.doc(id).update(data);
  // }

  // delete(id: string): Promise<void> {
  //   return this.collection.doc(id).delete();
  // }
}
