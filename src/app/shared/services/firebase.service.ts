import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { ref, onValue, getDatabase, update, Database } from 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(public db: AngularFireDatabase, private auth: AngularFireAuth) { }


  getLesson(category: string): Observable<any>{
    return this.db.list(`lessons/${category}`).valueChanges();
  }

  addUserToDb(userInfo: any) {
    const db = getDatabase();
    const id = 'user_' + Math.random().toString(16).slice(8);
    const currentUser = { ...userInfo, userId: id };

    const userRef = ref(db, 'users/');
    onValue(userRef, (snapshot) => {
      const users = snapshot?.val();
      let usersList = Object.values(users);
      const userExists = usersList.find(
        (v: any) => v.email === currentUser.email
      );
      console.log(userExists, currentUser.email)
      if (!userExists){
        console.log("User doesnt exist")
        // this.db.list('users/').set(currentUser.userId, { ...currentUser });
      }  else return;
     
    });
  }

  
}
