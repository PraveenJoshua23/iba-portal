import { Injectable, inject } from '@angular/core';
import { CollectionReference, Firestore, collection, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
  usersRef!: CollectionReference;

  firestore = inject(Firestore);
  constructor() { 
    this.usersRef = collection(this.firestore, 'users');
  }

  async addUser(newUser: any) {
    console.log(newUser)
    const userRef = doc(this.firestore, 'users', newUser.uid);
    try {
      const userSnapshot = await getDoc(userRef); // Use getDoc method to get the document snapshot
  
      if (!userSnapshot.exists()) {
        await setDoc(userRef, newUser);
        console.log('New user added!');
      } else {
        console.log('User already exists!');
      }
    } catch (error) {
      console.error('Error checking/adding user:', error);
    }
  }

}
