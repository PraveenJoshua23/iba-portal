import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore  } from '@angular/fire/compat/firestore';
import * as fire from 'firebase/app';
import { Observable, from, lastValueFrom } from 'rxjs';
import { ref, onValue, getDatabase, update, Database } from 'firebase/database';
import { HttpHeaders } from '@angular/common/http';

<<<<<<< HEAD
import { updateDoc } from 'firebase/firestore';


=======
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
>>>>>>> 128c9acfcbc48ced0779e9a0356c6929829cbb10
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

  seedUsers() {
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

  seedLessons() {
    const lessons = [
      // Lesson data objects
      {
        id: "bb/lesson1",
        category: 'bb',
        name: "Lesson 1 sealed book and revelation",
        locked: true,
        progress: 0,
        path: "BB Lesson 1",
        language:"en",
        instructor:"joshua"
      },
      {
        id: "bb/lesson2",
        category: 'bb',
        name: "Lesson 2 seed and harvest (sign of Second coming) ",
        locked: true,
        progress: 0,
        path: "BB Lesson 2",
        language:"en",
        instructor:"thomas"
      },
      {
        id: "bb/lesson3",
        category: 'bb',
        name: "Lesson 3 how to read prophecy (prophecy and secrets of the kingdom of heaven in parable) ",
        locked: true,
        progress: 0,
        path: "BB Lesson 3",
        language:"en",
        instructor:"joshua"
      },


      {
        id: "bb/lesson4",
        category: 'bb',
        name: "Lesson 4 introduction to Revelation",
        locked: true,
        progress: 0,
        path: "BB Lesson 4",
        language:"en",
        instructor:"joshua"
      },
      {
        id: "bb/lesson5",
        category: 'bb',
        name: "Lesson 5 Moses’s tabernacle and copy and shadow/ reality",
        locked: true,
        progress: 0,
        path: "BB Lesson 5",
        language:"en",
        instructor:"joshua"
      },
      {
        id: "bb/lesson6",
        category: 'bb',
        name: "Lesson 6 elementary teaching and teaching of righteousness for the mature ",
        locked: true,
        progress: 0,
        path: "BB Lesson 6",
        language:"en",
        instructor:"joshua"
      },
      {
        id: "bb/lesson7",
        category: 'bb',
        name: "Lesson 7 God’s covenants (OT and NT)",
        locked: true,
        progress: 0,
        path: "BB Lesson 7",
        language:"en",
        instructor:"joshua"
      },
      {
        id: "bb/lesson8",
        category: 'bb',
        name: "Lesson 8 God’s will and purpose (6,000 years of God’s work and history)",
        locked: true,
        progress: 0,
        path: "BB Lesson 8",
        language:"en",
        instructor:"joshua"
      },

      {
        id: "intro/lesson1",
        category: 'intro',
        name: "Intro Lesson 1 The Two Kinds of Spirits (God and Satan) ",
        locked: true,
        progress: 0,
        path: "Intro Lesson 1",
        language:"en",
        instructor:"thomas"
      },
      {
        id: "intro/lesson2",
        category: 'intro',
        name: "Intro Lesson 2 The Basics of the Bible",
        locked: true,
        progress: 0,
        path: "Intro Lesson 2",
        language:"en",
        instructor:"joshua"
      },
      {
        id: "intro/lesson1",
        category: 'intro',
        name: "Intro Lesson 3 The Figurative Language of the Secrets of the Kingdom of Heaven",
        locked: true,
        progress: 0,
        path: "Intro Lesson 3",
        language:"en",
        instructor:"thomas"
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
  
<<<<<<< HEAD

//   // save lessons
//   saveLessons(lesson: any[]){

//     const email = localStorage.getItem('email');
    
//     return docRef.update({
//       items: this.firestore.FieldValue.arrayUnion(item)
//     })
    
    
    
    
//     if (!email) {
//       console.error('Email not found in localStorage');
//       return;
//     }

//     // Reference to the 'users' collection
//     const usersCollection = this.firestore.collection('users');

//     // Reference to the specific document in the 'users' collection
//     // this.firestore.collection('users').doc(lesson).collection('lesson', ref => ref.where('email', '==', email)

//     const userDocumentRef = this.firestore.collection('users').doc(lesson).collection('lesson', ref => ref.where('email', '==', email)
// //const userDocumentRef = doc(this.firestore.collection, 'users', email);
//     // Update the document by adding a new object to the 'data' array
//     try {
//       const kjbjk = updateDoc(userDocumentRef, {
//         data: arrayUnion(lesson)
//       });

//       console.log('Document successfully updated!');
//     } catch (error) {
//       console.error('Error updating document: ', error);
//     }
//   }


// Update the document by adding a new object to the 'data' array
// userDocument.update({
//   data: this.firestore.FieldValue.arrayUnion(lesson)
// })
//   .then(() => {
//     console.log('Document successfully updated!');
//   })
//   .catch((error) => {
//     console.error('Error updating document: ', error);
//   });
// }




    // const email = localStorage.getItem('email');
    // //return this.firestore.collection('users').doc(lesson).collection('lesson', ref => ref.where('email', '==', email)).valueChanges();
  
    // // Get ref to document that contains array
    // const docRef = this.firestore.collection('users'); // , ref => ref.where('email', '==', email)
    // docRef.add({'email': email})
    // .then((docRef) => {
    //   console.log('Document written with ID: ', docRef.id);
    // })
    // .catch((error) => {
    //   console.error('Error adding document: ', error);
    // });

    // // Update document, append new item to array field
    // return docRef.update({
    //   items: this.firestore.FieldValue.arrayUnion(item)
    // })
  
  //}


=======
  // getAllLessons(){
  //   return this.firestore.collectionGroup('lesson').valueChanges()
  // }

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
>>>>>>> 128c9acfcbc48ced0779e9a0356c6929829cbb10
}
function doc(arg0: any, arg1: string, email: string) {
  throw new Error('Function not implemented.');
}

function getFirestore(): any {
  throw new Error('Function not implemented.');
}

function arrayUnion(newData: any) {
  throw new Error('Function not implemented.');
}

