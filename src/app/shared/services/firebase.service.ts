import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore, QueryDocumentSnapshot, QuerySnapshot } from '@angular/fire/compat/firestore';
import { addDoc, arrayUnion, Timestamp, collection, CollectionReference, doc, DocumentData, getDoc, getDocs, getFirestore, query, where} from '@angular/fire/firestore';
import { Observable, from, lastValueFrom, take } from 'rxjs';
import { ref, onValue, getDatabase } from 'firebase/database';
import { Lesson } from '../models/lesson.model';
import { map, switchMap } from 'rxjs/operators';
import { Firestore } from 'firebase/firestore';

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
  firestoreDb!:any;
  studentCol!: CollectionReference<DocumentData>;
  src!: any;

  constructor(public db: AngularFireDatabase, private storage: AngularFireStorage, private firestore: AngularFirestore) {
     this.firestoreDb = getFirestore(); 
     this.studentCol = collection(this.firestoreDb, 'users');
  }
  
  async getUsers() {
    const querySnapshot = await getDocs(this.studentCol);

    // Extract user data from the QuerySnapshot
    const users = querySnapshot.docs.map((doc) => doc.data() as DocumentData);

    return users;
  }

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
        // console.log("src", this.src);
        return this.src;
      })
      .catch(error => {
        console.error("Error getting video URL:", error);
        // Handle the error or throw it if you want to handle it outside of this function.
        throw error;
      });
  }

  async addUser(data: unknown){
    await addDoc(this.studentCol, data).then(() => console.log("Added user: ", data)).catch(err => {
      console.error("Error adding user:", err)
    })
  }


  saveQuiz(){
    const quiz= {
      quizId: 1234,
      lessonId: 12312,
      answerChoices: [1,2,4,1,2],
      timestamp: this.firestoreDb.firestore.FieldValue.timestamp(),
      score: 90
    }

    const quizMaster = {
      lessonId: "lessons/bb/lesson/2143142",
      lessonQuiz: [
        {
          question: "What is 2+2",
          choices: ["2","4","6","5"],
          correctAnswer: 1 
        },
        {
          question: "What is 4+5",
          choices: ["10","14","9","8"],
          correctAnswer: 2 
        },
      ]
    }
  }

  async storeUserQuizAnswers(lessonCategory:string, lessonId:string, answerChoices:number[], score?:number) {
    console.log("Initiated store user quiz")
    console.log(lessonCategory, lessonId);
    
    const userId = localStorage.getItem('userId'); // Replace with the actual user ID
    const timestamp = Timestamp.now();
    // const dateObject = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    !score ? score = 0 : score;

    // this.getLessonIdByIdentifier(lessonId, lessonCategory).then((lesson)=>{
    //   console.log()
    //   const lessId = lesson;
    //   console.log(lesson, lessId)
    //   console.log({
    //     userId,
    //     lessId,
    //     answerChoices,
    //     timestamp,
    //     score
    //   });
      // this.firestore.collection('userAnswers').doc(lessonCategory).collection('lesson').add({
      //   userId,
      //   lessId,
      //   answerChoices,
      //   timestamp,
      //   score,
      // }).then(()=> console.log("User answers added successfully"))
    // });  

    this.firestore.collection('userAnswers').doc(lessonCategory).collection('lesson', ref => ref.where('id','==',lessonId)).add({
      userId,
      lessonId,
      answerChoices,
      timestamp,
      score,
    }).then(()=> console.log("User answers added successfully"))
  }

  async getLessonIdByIdentifier(identifier: string, lessonCategory:string): Promise<any> {
    const lessonsCollectionRef = collection(this.firestoreDb, `lessons/${lessonCategory}/lesson`);
    console.log(lessonsCollectionRef,"getLesson ",`lessons/${lessonCategory}/lesson`)
    const lessonsQuery = query(lessonsCollectionRef, where('id', '==', identifier));

    const querySnapshot = await getDocs(lessonsQuery);
    return querySnapshot.docs;

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

  async getStudentByEmail(email: string) {
    const querySnapshot = await getDocs(query(this.studentCol, where('email', '==', email)));
  
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => doc.data());
    } else {
      // No matching documents
      return [];
    }
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

  // Add a new lesson to a specific category
  addLessonToCategory(category: string, newLesson: Lesson): Promise<void> {
    // Get the collection reference for the specific category
    const categoryCollection = this.firestore.collection('lessons').doc(category).collection('lesson');

    // Generate a new ID for the lesson
    const lessonId = this.firestore.createId();

    // Set the new lesson with the generated ID
    return categoryCollection.doc(lessonId).set({
      ...newLesson,
    });
  }

  // Delete a lesson by ID within a specific category
  async deleteLessonByCategory(category: string, lessonId: string): Promise<void> {
    // Get the collection reference for the specific category
    const categoryCollection = this.firestore.collection('lessons').doc(category).collection('lesson');

    // Find the lesson by the unique identifier and delete it
    const snapshot = await categoryCollection.ref.where('id', '==', lessonId).get();
    snapshot.forEach(doc => {
      doc.ref.delete();
    });
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




// seedUser() {
//   const users = [
//     // User data objects
//     {
//       name: "John Doe",
//       email: "johndoe@gmail.com",
//       language: "English",
//       currentLesson: "",
//       userDetails: {
//         name: "John Doe",
//         age: 29,
//         dob: "23-06-1995",
//         phone: 7826528743,
//         email: "johndoe@gmail.com",
//         religion: "Christian",
//         faith: "21",
//         occupation: "IT",
//         gender: "Male",
//         marital: "No",
//         language: "English",
//         whyApply: "adfsdf",
//         linkFrom: "dsfsdf",
//         studying: "sdfsdffds",
//         networker: "Jane"
//       },
//       lessonsWatched: [],
//       overallProgress: 0
//     }
//   ];

//   users.forEach(user => {
//     this.firestore.collection('users').add(user);
//   });
// }
