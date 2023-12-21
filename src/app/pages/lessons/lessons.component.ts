import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { Lesson } from 'src/app/shared/models/lesson.model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [CommonModule,
    VideoPlayerComponent,
    RouterLink
   ],
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
  }

  async initializeLesson(email:string){
    this.firebase.getLessonbyCategory('bb','bb/lesson1').subscribe(lesson=> {
      console.log("jjjjjjjjjjj");
      
      console.log(lesson);
      this.currentLesson = lesson;
      if (!this.videoSrc) this.getVideoFromFirebase(this.currentLesson).then(url => this.videoSrc = url);
      this.initializeQuiz(this.currentLesson);
    })
  }

  initializeQuiz(lesson: Lesson[]) {
    this.questions = lesson[0].quiz;
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
    this.storeQuiz();
  }

  retryQuiz(lesson:any) {
    this.currentQuizIndex = 0;
    this.initializeQuiz(lesson);
    this.showCorrectAnswer = false;
  }

  onVideoEnd(){
    console.log('triggered')
    this.isQuizOpen = true;
    this.firebase.vidEndNxtLessonUpdate(this.currentLesson)
  }

  progressUpdate(update:number){
    console.log(update)
  }

  isChoiceSelected(): boolean {
    return this.userAnswers[this.currentQuizIndex] === -1;
  }

  async getVideoFromFirebase(lesson: Lesson[]){
    return await this.firebase.getVideo(lesson[0].category, lesson[0].language, lesson[0].path)
  }

  storeQuiz(){
    const getCurrentLesson: string|null = localStorage.getItem('currentLesson')
    const lesson = JSON.parse(getCurrentLesson!)
    const {category, id } = lesson[0]
    this.firebase.storeUserQuizAnswers(category, id, this.userAnswers, 90)
  }
} 
