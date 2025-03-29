import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Lesson } from '../models/lesson.model';
import { CollectionReference, Firestore, addDoc, collection, collectionData, doc, getDocs, orderBy, query, setDoc, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { IProgress } from '../models/progress.interface';
import { Storage, getDownloadURL, ref } from '@angular/fire/storage';
import { IUser, IUserDetails } from '../models/user.interface';


@Injectable({
  providedIn: 'root'
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
  s = inject(Storage)

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

  getProgressData(): IProgress | null { return this.progressData; }
  getSelectedLesson(): any { return this.selectedLesson; }
  getUserEmail(): string | null { return this.userEmail; }

  /* --------------------- Re: Functions (Need to rearrange) --------------------------- */

  getAllUsersData(): Observable<IUserDetails[]>{
    return collectionData(this.usersRef,  { idField: 'id' }) as Observable<IUserDetails[]>
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

  async getVideo(category: string, lang: string, path: string) {
    try {
      const storagePath = `lessons/${category}/${lang}/${path}.mp4`;
      const storageRef = ref(this.s, storagePath);
  
      // Directly await the Promise from getDownloadURL
      const url = await getDownloadURL(storageRef); 
      return url;  
    } catch (error) {
      console.error('Error getting video URL:', error);  
      return null; 
    }
  }

  async getUserByEmail(email: string): Promise<IUser|null> {
    const q = query(this.usersRef, where('email', '==', email));

    try {
      const querySnapshot = await getDocs(q);
      console.log('querysnapshot:', querySnapshot)
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as IUser;
      } else {
        return null; // User not found
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    // return from(getDocs(q)).pipe(
    //   map(querySnapshot => {
    //     console.log('querysnapshot:', querySnapshot)
    //     console.log(querySnapshot.empty)
    //     if (!querySnapshot.empty) {
    //       const userDoc = querySnapshot.docs[0];
    //       return userDoc.data();
    //     } else {
    //       return null; 
    //     }
    //   }),
    //   catchError(error => {
    //     console.error('Error getting user details:', error);
    //     return of(null); // Return null if there's an error
    //   })
    // );
  }
}
