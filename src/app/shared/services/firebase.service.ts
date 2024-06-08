import { Injectable, Signal } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  Timestamp,
  collection,
  CollectionReference,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  updateDoc,
  arrayUnion,
} from '@angular/fire/firestore';
import { Observable, lastValueFrom, take } from 'rxjs';
import { ref, onValue, getDatabase } from 'firebase/database';
import { Lesson } from '../models/lesson.model';

interface Ilessons {
  lessonNo: number;
  name: string;
  id: string;
  progress: number;
  category: string;
  instructor: string;
  language: string;
  path: string;
  locked: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  firestoreDb!: any;
  studentCol!: CollectionReference<DocumentData>;
  src!: any;
  intNum: number = 0;

  constructor(
    public db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private firestore: AngularFirestore
  ) {
    this.firestoreDb = getFirestore();
    this.studentCol = collection(this.firestoreDb, 'users');
  }

  async getUsers() {
    const querySnapshot = await getDocs(this.studentCol);

    // Extract user data from the QuerySnapshot
    const users = querySnapshot.docs.map((doc) => doc.data() as DocumentData);

    return users;
  }

  getLesson(category: string): Observable<any> {
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

      if (!userExists) {
        console.log('User doesnt exist');
        // this.db.list('users/').set(currentUser.userId, { ...currentUser });
      } else return;
    });
  }

  async getProfile(email: string) {
    const ref = this.storage.ref(`profile/${email}/profile`);
    const pic = ref.getDownloadURL().pipe(take(1));
    return lastValueFrom(pic)
      .then((url) => {
        return url;
      })
      .catch((error) => {
        console.error('Error getting profile picture URL:', error);
        // Handle the error or throw it if you want to handle it outside of this function.
        throw error;
      });
  }

  async getVideo(category: string, lang: string, path: string) {
    const ref = this.storage.ref(`lessons/${category}/${lang}/${path}.mp4`);
    const vid = ref.getDownloadURL().pipe(take(1));
    return lastValueFrom(vid)
      .then((url) => {
        this.src = url;
        // console.log("src", this.src);
        return this.src;
      })
      .catch((error) => {
        console.error('Error getting video URL:', error);
        // Handle the error or throw it if you want to handle it outside of this function.
        throw error;
      });
  }

  async addUser(data: unknown): Promise<boolean> {
    // await addDoc(this.studentCol, data).then(() => console.log("Added user: ", data)).catch(err => {
    //   console.error("Error adding user:", err)
    // })

    const email = (data as any)?.email; // Replace 'email' with the actual field name

    if (!email) {
      console.error('Email not provided in data.');
      return false;
    }

    // Check if the email already exists
    const emailExists = await this.checkEmailExistence(email);

    if (emailExists) {
      console.log('Email already exists.');
      // Handle accordingly, e.g., display an error message or prevent adding the user
    } else {
      // Add the user if the email doesn't exist
      await this.firestore.collection('users').add(data);
      console.log('User added:', data);
    }
    return emailExists;
  }
  async checkEmailExistence(email: string): Promise<boolean> {
    try {
      const querySnapshot = await this.firestore
        .collection('users', (ref) => ref.where('email', '==', email))
        .get()
        .toPromise();

      // Check if querySnapshot is not undefined before accessing its properties
      if (querySnapshot !== undefined) {
        return !querySnapshot.empty;
      } else {
        // Handle the case where querySnapshot is undefined
        console.error('Query snapshot is undefined.');
        return false;
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  }

  saveQuiz() {
    const quiz = {
      quizId: 1234,
      lessonId: 12312,
      answerChoices: [1, 2, 4, 1, 2],
      timestamp: this.firestoreDb.firestore.FieldValue.timestamp(),
      score: 90,
    };

    const quizMaster = {
      lessonId: 'lessons/bb/lesson/2143142',
      lessonQuiz: [
        {
          question: 'What is 2+2',
          choices: ['2', '4', '6', '5'],
          correctAnswer: 1,
        },
        {
          question: 'What is 4+5',
          choices: ['10', '14', '9', '8'],
          correctAnswer: 2,
        },
      ],
    };
  }

  async storeUserQuizAnswers(
    lessonCategory: string,
    lessonId: string,
    answerChoices: number[],
    score?: number
  ) {
    console.log('Initiated store user quiz');
    console.log(lessonCategory, 'HHHHHHHHHHH ' + lessonId);
    console.log(localStorage.getItem('LessonId'));
    const userId = localStorage.getItem('userId'); // Replace with the actual user ID
    const timestamp = Timestamp.now();
    // const dateObject = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    !score ? (score = 0) : score;

    this.firestore
      .collection('userAnswers')
      .doc(lessonCategory)
      .collection('lesson', (ref) => ref.where('id', '==', lessonId))
      .add({
        userId,
        lessonId,
        answerChoices,
        timestamp,
        score,
      })
      .then(() => console.log('User answers added successfully'));
  }

  // async getLessonIdByIdentifier(identifier: string, lessonCategory:string): Promise<any> {
  //   const lessonsCollectionRef = collection(this.firestoreDb, `lessons/${lessonCategory}/lesson`);
  //   console.log(lessonsCollectionRef,"getLesson ",`lessons/${lessonCategory}/lesson`)
  //   const lessonsQuery = query(lessonsCollectionRef, where('id', '==', identifier));

  //   const querySnapshot = await getDocs(lessonsQuery);
  //   return querySnapshot.docs;

  // }

  // async getLessonIdByIdentifier(identifier: string, lessonCategory: string): Promise<string | null> {
  //   const lessonsCollectionRef = collection(this.firestoreDb, `lessons/${lessonCategory}/lesson`);
  //   console.log(lessonsCollectionRef, "getLesson ", `lessons/${lessonCategory}/lesson`);
  // console.log("Iden : "+identifier);

  //   const lessonsQuery = query(lessonsCollectionRef, where('id', '==', identifier));
  //   const querySnapshot = await getDocs(lessonsQuery);

  //   // Check if there is a matching document
  //   if (!querySnapshot.empty) {
  //     // Assuming you want to get the ID of the first matching document
  //     const lessonDoc = querySnapshot.docs[0];
  //     const lessonId = lessonDoc.id;
  // console.log(lessonId +"LLLLLLLLLLLLL");

  //     return lessonId;
  //   }

  //   // Return null if no matching document is found
  //   console.log("MMMMMMMMMLLLLLLLLLLLLL");
  //   return null;
  // }

  // Thomas
  //  async getLessonIdByIdentifier(identifier: string, lessonCategory:string): Promise<any> {
  //   const lessonsCollectionRef = collection(this.firestoreDb, `lessons/${lessonCategory}/lesson`);
  //   console.log(lessonsCollectionRef,"getLesson ",`lessons/${lessonCategory}/lesson`)
  //   const lessonsQuery = query(lessonsCollectionRef, where('id', '==', identifier));

  //   const querySnapshot = await getDocs(lessonsQuery);
  //   console.log("JJJJJJJJJJJ"+ querySnapshot.docs);

  //   return querySnapshot.docs;

  // }

  async getLessonIdByIdentifier(
    identifier: string,
    lessonCategory: string
  ): Promise<string | null> {
    const lessonsCollectionRef = collection(
      this.firestoreDb,
      `lessons/${lessonCategory}/lesson`
    );
    console.log('Collection Reference:', lessonsCollectionRef);
    console.log('Identifier:', identifier);

    try {
      // Get a reference to the document with the specified field value
      const lessonDocRef = doc(lessonsCollectionRef);

      // Retrieve the document
      const lessonDocSnapshot = await getDoc(lessonDocRef);

      // Check if the document exists
      if (lessonDocSnapshot.exists()) {
        // Return the ID
        return lessonDocSnapshot.id;
      } else {
        // Return null if no matching document is found
        console.log('No matching document found.');
        return null;
      }
    } catch (error) {
      console.error('Error querying lessons:', error);
      return null;
    }
  }

  addQuiz(lessons: Lesson[]) {
    const questions = [
      {
        question:
          'What is the spiritual meaning of the Light and the Darkness? ( Jn1:1-5, Ps119:105, 130)',
        choices: [
          'Light = Christians / Darkness = Non-Christians',
          'Light = Revealed word of God / Darkness = Ignorance of God’s word(Sealed word)',
        ],
        correctAnswer: 1,
      },
      {
        question:
          'Jesus prophesied the night is coming (Jn9:4). And he is coming back in the night time(Mt24:29-31, 1Th5:1-3). When he comes back, he will send us the true light(=open word) to lead us to Kingdom of heaven.',
        choices: [
          'Darkness of not knowing the secret of N.T prophecy',
          'Darkness of not believing in Jesus as savior',
          'Darkness of absense of peace on this earth',
        ],
        correctAnswer: 0,
      },
      {
        question: 'what time do we live in today according to the signs?',
        choices: [
          'time of the O.T. prophecy (sealed book)',
          'time of the open word of the O.T prophecy at the first coming',
          'time of the N.T. prophecy (seal book)',
        ],
        correctAnswer: 0,
      },
      {
        question: 'What is the spiritual meaning of the lampstands? ',
        choices: ['Spirit', ' Person (worker)', 'Both A and B'],
        correctAnswer: 0,
      },
      {
        question:
          "Moses' Tabernacle was copy and Shadow (Heb8:5) And the true reality appeared at the 1st coming! Who was the true reality of Lampstand of Holy Place?",
        choices: [
          'time of the O.T. prophecy (sealed book)',
          'time of the open word of the O.T prophecy at the first coming',
          'time of the N.T. prophecy (seal book)',
        ],
        correctAnswer: 0,
      },
    ];

    // lessons.forEach(lesson => {
    //   this.firestore.collection('lesson').where()
    // })
  }

  async getStudentByEmail(email: string) {
    const querySnapshot = await getDocs(
      query(this.studentCol, where('email', '==', email))
    );

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map((doc) => doc.data());
    } else {
      // No matching documents
      return [];
    }
  }
  

  getUserByEmail(email: string): Observable<any[]> {
    // Use 'ref' to create a query based on the 'email' field
    return this.firestore
      .collection('users', (ref) => ref.where('email', '==', email))
      .valueChanges();
  }

  async updateUserByEmail(data: any, email: string) {
    const querySnapshot = await getDocs(
      query(this.studentCol, where('email', '==', email))
    );
    if (!querySnapshot.empty) {
      const docRef = doc(this.studentCol, querySnapshot.docs[0].id);

      // Update the document with the edited data
      await updateDoc(docRef, data);

      console.log('Document updated successfully!');
    } else {
      console.log('No documents found with the specified email.');
    }
  }

  getUserCollection(email: string) {
    // Reference to the collection in Firestore
    const usersCollection = this.firestore.collection('users', (ref) =>
      ref.where('email', '==', email)
    );

    return usersCollection;
  }

  getLessonbyCategory(category: string, lessonId: string) {
    return this.firestore
      .collection('lessons')
      .doc(category)
      .collection('lesson', (ref) => ref.where('id', '==', lessonId))
      .valueChanges();
  }

  getAllLessonByCategory(category: string) {
    return this.firestore
      .collection('lessons')
      .doc(category)
      .collection('lesson')
      .valueChanges();
  }

  // Add a new lesson to a specific category
  addLessonToCategory(category: string, newLesson: Lesson): Promise<void> {
    // Get the collection reference for the specific category
    const categoryCollection = this.firestore
      .collection('lessons')
      .doc(category)
      .collection('lesson');

    // Generate a new ID for the lesson
    const lessonId = this.firestore.createId();

    // Set the new lesson with the generated ID
    return categoryCollection.doc(lessonId).set({
      ...newLesson,
    });
  }

  // Delete a lesson by ID within a specific category
  async deleteLessonByCategory(
    category: string,
    lessonId: string
  ): Promise<void> {
    // Get the collection reference for the specific category
    const categoryCollection = this.firestore
      .collection('lessons')
      .doc(category)
      .collection('lesson');

    // Find the lesson by the unique identifier and delete it
    const snapshot = await categoryCollection.ref
      .where('id', '==', lessonId)
      .get();
    snapshot.forEach((doc) => {
      doc.ref.delete();
    });
  }

  updateLesson(lessonObj: Ilessons[]) {
    const newLessonObject = lessonObj;
    newLessonObject.map((lesson) => (lesson.locked = false));

    const docId = localStorage.getItem('userId') || '';
    const userRef = this.firestore.collection('users').doc(docId);

    // Update the lessonsWatched array
    userRef
      .update({
        lessonsWatched: newLessonObject,
      })
      .then(() => {
        console.log('Lessons watched array updated successfully');
      })
      .catch((error) => {
        console.error('Error updating lessonsWatched array:', error);
      });
  }

  //inititate lessons to a user for progress
  initCourse(lessons: any[]) {
    const email: any = localStorage.getItem('email');
    // const data = {
    //   id: lessons.id,
    //   userId: email,
    //   progress: 100,
    //   locked: false,
    //   startDate: Timestamp.now()
    // }
    this.intNum = 0;
    const array: any[] = [];
    //const intNum:number=0;
    lessons.forEach((lesson) => {
      this.intNum++;
      const data = {
        lessonNo: this.intNum,
        id: lesson.id,
        userId: email,
        progress: 0,
        locked: this.intNum == 1 ? false : true,
        startDate: this.intNum == 1 ? Timestamp.now(): 'undefined',
      };
      //  const progress = this.firestore.collection('progress').doc(email);
      array.push(data);
    });
    const progress = this.firestore.collection('progress').doc(email);
    progress
      .set({ BB: array })
      .then(() => {
        console.log(
          `Document with ID ${email} successfully written to Firestore.`,
          array
        );
      })
      .catch((error) => {
        console.error('Error writing document:', error);
      });
  }

  // Next Lesson Update for Enable:

  // vidEndNxtLessonUpdate(lessons:any[]){
  //   console.log(lessons);
  //   console.log("lllllllllllllllllllllessonIndex");
  //   const email: any = localStorage.getItem('email');
  //   const progress = this.firestore.collection('progress').doc(email);

  //   const lessonIndex = lessons.findIndex((lesson) => lesson.lessonNo === 2);

  // console.log(lessonIndex);

  // // Check if the lesson with the unique identifier was found
  // if (lessonIndex !== -1) {
  //   // Update the 'locked' property of the specified lesson in the array
  //   lessons[lessonIndex].locked = false;

  //   // Create an object to set in Firestore with the modified lesson
  //   const updateObject = { BB: [lessons[lessonIndex]] };

  //   // Update the 'progress' document in Firestore
  //   progress.set(updateObject)
  //     .then(() => {
  //       console.log(`Document with ID ${email} successfully written to Firestore.`, updateObject);
  //     })
  //     .catch((error) => {
  //       console.error('Error writing document:', error);
  //     });
  // } else {
  //   console.log(`Lesson with unique identifier ${lessons[0].lessonNo+1} not found in the 'lessons' array.`);
  // }
  // }

  getLessonProgress(){
    const email: string = localStorage.getItem('email') ?? '';
    
    const progressDocRef = this.firestore.collection('progress').doc(email).get();
    

    return progressDocRef;
  }

  vidEndNxtLessonUpdate(lessonNo: number, category: string, progress: number) {
    const email: string = localStorage.getItem('email') ?? '';
    console.log(lessonNo, category.toUpperCase(), progress);
    
    const progressDocRef = this.firestore.collection('progress').doc(email);

    progressDocRef.get().subscribe((doc) => {
      if (doc.exists) {
        const data: any = doc.data();
        
        const originalArray = data[category.toUpperCase()];
        
        const updated = originalArray.map((v:any) => {
    
          if (v.lessonNo === lessonNo) {
            return { ...v, progress: progress, endDate: Timestamp.now() };
          } else if (v.lessonNo === lessonNo + 1) {
            return { ...v, locked: false };
          } else {
            return v;
          }
        });
        console.log(updated);
        data[category.toUpperCase()] = updated;

        // Update the document with the modified data
        progressDocRef
          .update(data)
          .then(() => {
            console.log('Field updated successfully');
          })
          .catch((error) => {
            console.error('Error updating field: ', error);
          });
      }
    });
  }

  getMaterialsByLesson(lessonNo:number, category:string){
    const lang = (localStorage.getItem('language'))?.toLowerCase();

    const folderPath = `materials/${category}/${lang}`;
    const storageRef = this.storage.ref(folderPath);

    return storageRef;
  }
}
