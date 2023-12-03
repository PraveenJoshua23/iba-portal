import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from 'src/app/components/app-shell/app-shell.component';
import { RouterModule } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AppShellComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{

  constructor(private fb: FirebaseService, ){}

  bbLessons: any[]= [];
  currentLesson: Ilessons[] = [];

  ngOnInit(): void {
      this.getAllLessons();
      // this.seedData();
      this.getlesson()
      this.getUser()
  }

  getAllLessons(){
     this.fb.getAllLessonByCategory('bb').subscribe( lesson => {
      this.bbLessons = lesson
      this.sortLessons(this.bbLessons)
    })
    // this.fb.getLesson('BB').subscribe(res => {
    //   this.allLessons = res;
    //   // console.log(this.allLessons)
    // })
  }

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

  seedData(){
    this.fb.seedLessons();
    // this.fb.seedUsers();
  }

  getlesson(){
    this.fb.getLessonbyCategory('bb', 'bb/lesson2').subscribe( lesson => {
      
     this.currentLesson.push(lesson[0] as Ilessons)

    })

   
  }

  getUser(){
    this.fb.getUserCollection("johndoe@gmail.com").get().subscribe(querySnapshot => {
      if (querySnapshot.size > 0) {
        // Assuming there's only one document with the given email
        const docId = querySnapshot.docs[0].id;
        localStorage.setItem('userId', docId);
      } else {
        console.log("No document found with the specified email");
      }
    })
    // this.fb.getUserByEmail("johndoe@gmail.com").subscribe(user=> {
    //   console.log(user)
    // })
  }

  selectLesson(){
    this.fb.updateLesson(this.currentLesson)
  }

}
