import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { Lesson } from 'src/app/shared/models/lesson.model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [CommonModule,
    VideoPlayerComponent ],
  templateUrl: './lessons.component.html',
  styleUrls: ['./lessons.component.scss'],
})
export class LessonsComponent implements OnInit {
  title!: string;
  isQuizOpen: boolean = false;
  currentQuizIndex = 0;
  currentLesson!: any; 

  // questions = [
  //   {
  //     question: "What is 2*5?",
  //     choices: [2, 5, 10, 15, 20],
  //     correctAnswer: 2
  //   },
  //   {
  //     question: "What is 3*6?",
  //     choices: [3, 6, 9, 12, 18],
  //     correctAnswer: 4
  //   },
  //   {
  //     question: "What is 8*9?",
  //     choices: [72, 99, 108, 134, 156],
  //     correctAnswer: 0
  //   },
  //   {
  //     question: "What is 1*7?",
  //     choices: [4, 5, 6, 7, 8],
  //     correctAnswer: 3
  //   },
  //   {
  //     question: "What is 8*8?",
  //     choices: [20, 30, 40, 50, 64],
  //     correctAnswer: 4
  //   }
  // ];

  userAnswers: number[] = [];
  showCorrectAnswer = false;
  videoSrc: any;
  questions:any[]= [];
  isVideoFinished: boolean = false;

  constructor(private active: ActivatedRoute, private route: Router, private firebase: FirebaseService ){}

  ngOnInit(): void {
      const encoded = this.route.url.split('/')[3]
      this.title = decodeURIComponent(encoded);

      const email = localStorage.getItem('email') || '';
      this.initializeLesson(email)
      console.log(this.questions)
      
  }

  async initializeLesson(email:string){
    this.firebase.getUserByEmail(email).subscribe(user => {
      this.currentLesson = user[0].lessonsWatched.filter((les: { name: string; }) => les.name === this.title);
      // console.log(this.currentLesson)
      if (!this.videoSrc) this.getVideoFromFirebase(this.currentLesson).then(url => this.videoSrc = url);
      this.initializeQuiz(this.currentLesson);
    })
  }

  initializeQuiz(lesson: Lesson[]) {

    this.questions = lesson[0].quiz;
    console.log(this.questions)
    console.log(lesson);
    
    this.userAnswers = new Array(this.questions.length).fill(-1);
  }

  nextQuestion() {
    this.currentQuizIndex++;
    this.showCorrectAnswer = false;
  }

  prevQuestion() {
    this.currentQuizIndex--;
    this.showCorrectAnswer = false;
  }

  submitQuiz() {
    // Logic to handle the submission of the quiz
    // You can implement scoring or any other actions here
    this.showCorrectAnswer = true;
    console.log(this.userAnswers)
  }

  retryQuiz(lesson:any) {
    this.currentQuizIndex = 0;
    this.initializeQuiz(lesson);
    this.showCorrectAnswer = false;
  }

  onVideoEnd(){
    console.log('triggered')
    this.isQuizOpen = true;
  }

  isChoiceSelected(): boolean {
    return this.userAnswers[this.currentQuizIndex] === -1;
  }

  async getVideoFromFirebase(lesson: Lesson[]){
    return await this.firebase.getVideo(lesson[0].category, lesson[0].language, lesson[0].path)
  }
}
