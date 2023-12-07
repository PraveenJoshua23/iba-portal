import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from 'src/app/components/app-shell/app-shell.component';
import { RouterModule } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { lastValueFrom } from 'rxjs';

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

  constructor(private fb: FirebaseService){}

  bbLessons: any[]= [];
  initialLesson: Ilessons[] = []; 
  currentLesson: Ilessons[] = [];

  ngOnInit(): void {
      this.getAllLessons();
      // this.seedData();
     
      this.getUser()
  }

  getAllLessons(){
     this.fb.getAllLessonByCategory('bb').subscribe( lesson => {
      this.bbLessons = lesson
      console.log(this.bbLessons)
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

  // getLesson(category: string, id: string): Promise<Ilessons> {
  //   const res = this.fb.getLessonbyCategory(category, id)
  //   return lastValueFrom(res)
  //     .then(lesson => {
  //       this.currentLesson.push(lesson[0] as Ilessons);
  //       return lesson[0] as Ilessons;
  //     })
  //     .catch(error => {
  //       // Handle errors here
  //       console.error(error);
  //       throw error; // rethrowing the error if needed
  //     });
  // }

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

  selectLesson(id: string){
    const les = this.bbLessons.filter(lesson => lesson.id === id)
    const currentLes = JSON.stringify(les)
    localStorage.setItem('currentLesson',currentLes)
    console.log(les)
  
    this.fb.updateLesson(les)
  }

}
