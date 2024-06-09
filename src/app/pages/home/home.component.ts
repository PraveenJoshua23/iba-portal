import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from 'src/app/components/app-shell/app-shell.component';
import { RouterModule } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { Observable, Subscription, lastValueFrom, tap } from 'rxjs';
import { DataService } from 'src/app/shared/services/data.service';
import { Lesson } from 'src/app/shared/models/lesson.model';

// interface Lesson {
//   name: string;
//   id: string;
//   progress: number;
//   category: string;
//   instructor: string;
//   language: string;
//   path:  string;
//   locked: boolean;
// }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AppShellComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy{

  ds = inject(DataService);
  allBBLessons$: Observable<any> = this.ds.getAllLessonSubCollection('bb');

  constructor(private fb: FirebaseService ){
    }

  bbLessons: any[]= [];
  initialLesson: Lesson[] = []; 
  currentLesson: Lesson[] = [];
  usersList: any = []
  progress!: any;
  progress$!: Subscription;

  ngOnInit(): void {
      // this.getAllLessons();
      // this.getAllUser();
      this.getUser();
      this.ds.checkUserProgress();

      // this.progress$ = this.fb.getLessonProgress().subscribe(prog => this.progress= prog.data());
      // console.log(this.progress)
  }
  /* Init :

  Check Auth
  Init User Details
  Init Progress Details: If !progress then false
  If progress, check progress update dashboard

  */
  ngOnDestroy(): void {
    // this.progress$.unsubscribe();
  }

  // getAllLessons(){
  //    this.fb.getAllLessonByCategory('bb').subscribe( lesson => {
  //     this.bbLessons = lesson
  //     console.log(this.bbLessons)
  //     this.sortLessons(this.bbLessons)
  //   })
  // }

  extractLessonNumber(lesson: { name: string; }) {
    const match = lesson.name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // Function to sort lessons by lesson number
  sortLessons(array: any) {
    array.sort((a: { name: string; }, b: { name: string; }) => {
      const lessonNumberA = this.extractLessonNumber(a);
      const lessonNumberB = this.extractLessonNumber(b);
      return lessonNumberA - lessonNumberB;
    });
  }

  getUser(){
    const email = localStorage.getItem('email')?? ''
    // this.fb.getUserCollection(email).get().subscribe(querySnapshot => {
    //   if (querySnapshot.size > 0) {
    //     // Assuming there's only one document with the given email
    //     const docId = querySnapshot.docs[0].id;
    //     localStorage.setItem('userId', docId);
    //   } else {
    //     console.log("No document found with the specified email");
    //   }
    // })
  }

  selectLesson(id: string){
    console.log(id)
    const les = this.bbLessons.filter(lesson => lesson.id === id)
    const currentLes = JSON.stringify(les)
    localStorage.setItem('currentLesson',currentLes)
    console.log(les)
  
    this.fb.updateLesson(les)
  }

  startLesson(id: string){
    this.fb.initCourse(this.bbLessons)
  }
}
