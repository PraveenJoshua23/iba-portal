import { Injectable, inject } from '@angular/core';
import { CollectionReference, DocumentReference, Firestore, addDoc, collection, collectionData, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { IClass } from '../../models/class.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClassServiceService {
  classRef!: CollectionReference;

  firestore = inject(Firestore);

  constructor() {
    this.classRef = collection(this.firestore, 'class');
   }

   async addClass(newClass:any){
    // Construct the document reference using the classId as the ID
    const classDocRef: DocumentReference = doc(this.classRef, newClass.classId);

    // Check if the class with the same classId already exists
    const classDocSnap = await getDoc(classDocRef);
    
    if (classDocSnap.exists()) {
        console.error('Class with this classId already exists.');
        return; 
    }

    try {
        // Set the document with the new class data using the classId as ID
        await setDoc(classDocRef, newClass);
        console.log(`Class ${newClass.classId} added successfully.`);
    } catch (error) {
        console.error(`Error adding class ${newClass.classId}:`, error);
    }
   }

   async seedClassesToFirestore(classes: IClass[]): Promise<void> {
    const classCollection = collection(this.firestore, 'class');

    for (const cls of classes) {
      try {
        await addDoc(classCollection, cls);
        console.log(`User ${cls.classId} added successfully.`);
      } catch (error) {
        console.error(`Error adding user ${cls.classId}:`, error);
      }
    }
  }

  getAllClassData(): Observable<IClass[]>{
    return collectionData(this.classRef) as Observable<IClass[]>
  }
}
