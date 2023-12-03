import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from 'src/app/components/app-shell/app-shell.component';
import { RouterModule } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

interface Ilessons {
  title: string;
  status: string;
  progress: number;
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

  allLessons= [];
  lessons: Ilessons[] = [
    {
      title: 'Word of the Beginning',
      status : 'Start',
      progress: 0
    },
    {
      title: 'Religion',
      status : 'Finish Previous Lesson',
      progress: 0
    },
    {
      title: 'Basic Biblical Knowledge (1)',
      status : 'Finish Previous Lesson',
      progress: 0
    },
    {
      title: 'Basic Biblical Knowledge (2)',
      status : 'Finish Previous Lesson',
      progress: 0
    },
  ]

  ngOnInit(): void {
      this.getAllLessons();
      // this.seedData();
      this.getlesson()
  }

  getAllLessons(){
    this.fb.getLesson('BB').subscribe(res => {
      this.allLessons = res
      console.log(this.allLessons)
    })
  }

  seedData(){
    this.fb.seedLessons();
    // this.fb.seedUsers();
  }

  getlesson(){
    this.fb.getLessonbyCategory('bb', 'bb/lesson1').subscribe( lesson => {
      console.log(lesson)
      //this.saveLessons(lesson);
    })
  }

  

  // saveLessons(lesson: any[]) {
  //   console.log(lesson);
  //   this.fb.saveLessons(lesson)
  //   // console.log("jojojoojojooojojojoj");
    
  // }


}
