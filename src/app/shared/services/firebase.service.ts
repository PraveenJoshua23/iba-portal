import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore  } from '@angular/fire/compat/firestore';
import { Observable, from, lastValueFrom, take, tap } from 'rxjs';
import { ref, onValue, getDatabase, update, Database } from 'firebase/database';
import { Lesson } from '../models/lesson.model';

interface Ilessons {
  name: string;
  id: string;
  progress: number;
  category: string;
  instructor: string;
  language: string;
  path:  string;
  locked: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(public db: AngularFireDatabase, private storage: AngularFireStorage, private firestore: AngularFirestore) { }
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
      
      if (!userExists){
        console.log("User doesnt exist")
        // this.db.list('users/').set(currentUser.userId, { ...currentUser });
      }  else return;
     
    });
  }


  async getVideo(category:string, lang: string, path: string){
    const ref = this.storage.ref(`lessons/${category}/${lang}/${path}.mp4`);
    const vid = ref.getDownloadURL().pipe(take(1))
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

  addUser() {
    const users = [
      // User data objects
      {
        name: "John Doe",
        email: "johndoe@gmail.com",
        language: "English",
        currentLesson: "",
        userDetails: {
          name: "John Doe",
          age: 29,
          dob: "23-06-1995",
          phone: 7826528743,
          email: "johndoe@gmail.com",
          religion: "Christian",
          faith: "21",
          occupation: "IT",
          gender: "Male",
          marital: "No",
          language: "English",
          whyApply: "adfsdf",
          linkFrom: "dsfsdf",
          studying: "sdfsdffds",
          networker: "Jane"
        },
        lessonsWatched: [],
        overallProgress: 0
      }
    ];
  
    users.forEach(user => {
      this.firestore.collection('users').add(user);
    });
  }

  addQuiz(lessons: Lesson[]){
    const questions = [
      {
        question: "What is the spiritual meaning of the Light and the Darkness? ( Jn1:1-5, Ps119:105, 130)",
        choices: ["Light = Christians / Darkness = Non-Christians", "Light = Revealed word of God / Darkness = Ignorance of God’s word(Sealed word)"],
        correctAnswer: 1
      },
      {
        question: "Jesus prophesied the night is coming (Jn9:4). And he is coming back in the night time(Mt24:29-31, 1Th5:1-3). When he comes back, he will send us the true light(=open word) to lead us to Kingdom of heaven.",
        choices: ["Darkness of not knowing the secret of N.T prophecy", "Darkness of not believing in Jesus as savior", "Darkness of absense of peace on this earth"],
        correctAnswer: 0
      },
      {
        question: "what time do we live in today according to the signs?",
        choices: ["time of the O.T. prophecy (sealed book)", "time of the open word of the O.T prophecy at the first coming", "time of the N.T. prophecy (seal book)"],
        correctAnswer: 0
      },
      {
        question: "What is the spiritual meaning of the lampstands? ",
        choices: ["Spirit", " Person (worker)", "Both A and B"],
        correctAnswer: 0
      },
      {
        question: "Moses' Tabernacle was copy and Shadow (Heb8:5) And the true reality appeared at the 1st coming! Who was the true reality of Lampstand of Holy Place?",
        choices: ["time of the O.T. prophecy (sealed book)", "time of the open word of the O.T prophecy at the first coming", "time of the N.T. prophecy (seal book)"],
        correctAnswer: 0
      },
    ]
    
    // lessons.forEach(lesson => {
    //   this.firestore.collection('lesson').where()
    // })
  

  }

  seedLessons() {
    const lessons = [
      // Lesson data objects
      {
        id: "bb/lesson1",
        category: 'bb',
        name: "BB Lesson 1",
        locked: true,
        progress: 0,
        path: "BB Lesson 1"
      },
      {
        id: "bb/lesson2",
        category: 'bb',
        name: "BB Lesson 2",
        locked: true,
        progress: 0,
        path: "BB Lesson 2"
      },
      {
        id: "bb/lesson3",
        category: 'bb',
        name: "BB Lesson 3",
        locked: true,
        progress: 0,
        path: "BB Lesson 3"
      },
      {
        id: "intro/lesson1",
        category: 'intro',
        name: "BB Lesson 1",
        locked: true,
        progress: 0,
        path: "BB Lesson 1"
      },
      {
        id: "intro/lesson2",
        category: 'intro',
        name: "BB Lesson 2",
        locked: true,
        progress: 0,
        path: "BB Lesson 2"
      },
      {
        id: "intro/lesson1",
        category: 'intro',
        name: "BB Lesson 3",
        locked: true,
        progress: 0,
        path: "BB Lesson 3"
      }
    ];
  
    lessons.forEach(lesson => {
      // Assume lessons are organized by category
      this.firestore.collection('lessons').doc(lesson.category).collection('lesson').add(lesson);
    });
  }


  getUserByEmail(email: string): Observable<any[]> {
    // Use 'ref' to create a query based on the 'email' field
    return this.firestore.collection('users', ref => ref.where('email', '==', email)).valueChanges();
  }

  getUserCollection(email: string){
    // Reference to the collection in Firestore
    const usersCollection = this.firestore.collection('users', ref =>
    ref.where('email', '==', email)
  );

   return usersCollection
  }

  getLessonbyCategory(category: string, lessonId: string){
    return this.firestore.collection('lessons').doc(category).collection('lesson', ref => ref.where('id', '==', lessonId)).valueChanges();
  }
  

  getAllLessonByCategory(category: string){
    return this.firestore
      .collection('lessons')
      .doc(category)  
      .collection('lesson')
      .valueChanges();
  }


  updateLesson(lessonObj: Ilessons[]){
    const newLessonObject = lessonObj;
    newLessonObject.map(lesson => lesson.locked = false) 
    
    const docId = localStorage.getItem('userId') || ''
    const userRef = this.firestore.collection('users').doc(docId);

    // Update the lessonsWatched array
    userRef.update({
      lessonsWatched: newLessonObject,
      })
      .then(() => {
        console.log("Lessons watched array updated successfully");
      })
      .catch((error) => {
        console.error("Error updating lessonsWatched array:", error);
    });
  }
}
