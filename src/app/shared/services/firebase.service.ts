import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, from, lastValueFrom } from 'rxjs';
import { ref, onValue, getDatabase, update, Database } from 'firebase/database';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(public db: AngularFireDatabase, private storage: AngularFireStorage) { }
  src!: any;

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


  async getVideo(){
    const ref = this.storage.ref('lessons/bb/en/[Basic Lesson 1] The Word Since the Beginning l Shincheonji Church of Jesus.mp4');
    const vid = ref.getDownloadURL()
    return lastValueFrom(vid)
      .then(url => {
        this.src = url;
        console.log("src", this.src);
        return this.src;
      })
      .catch(error => {
        console.error("Error getting video URL:", error);
        // Handle the error or throw it if you want to handle it outside of this function.
        throw error;
      });
  }
  
}
