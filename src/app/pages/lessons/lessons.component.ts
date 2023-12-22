import { Component, OnInit, signal } from '@angular/core';
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
  userAnswers: number[] = [];
  showCorrectAnswer = false;
  videoSrc: any;
  questions:any[]= [];
  isVideoCompleted: boolean = false;
  progressRate = signal(0);
  lessonId!: string;
  category!: string;
  tabs = ['Materials', 'Notes', 'Quiz', 'QnA Forum'];
  activeTabIndex = 0;


  constructor(private active: ActivatedRoute, private route: Router, private firebase: FirebaseService, private ar: ActivatedRoute ){
    this.ar.queryParams.subscribe(params => {
      this.lessonId = params['id'];
      this.category = this.lessonId.split('/')[0];
    });
  }

  ngOnInit(): void {
      const encoded = this.route.url.split('/')[3]
      this.title = decodeURIComponent(encoded);

      const email = localStorage.getItem('email') || '';
      this.initializeLesson(email)
  }

  async initializeLesson(email:string){
    this.firebase.getLessonbyCategory(this.category,this.lessonId).subscribe(lesson=> {
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
    this.isVideoCompleted = true;

  }

  progressUpdate(update:number){ 
    this.progressRate.set(update);
    // console.log(this.progressRate())
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

  setActiveTab(index: number): void {
    this.activeTabIndex = index;
  }
  
} 
