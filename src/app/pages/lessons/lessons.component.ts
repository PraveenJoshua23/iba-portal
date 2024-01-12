import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, Time } from '@angular/common';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { Lesson } from 'src/app/shared/models/lesson.model';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';

interface Progress {
  BB: LessonProg[],
  INTRO: LessonProg[],
  INTERMEDIATE: LessonProg[],
  ADVANCED: LessonProg[],
  registration: number,
}

interface LessonProg {
  id: string;
  lessonNo: 1;
  locked: boolean;
  progress: number;
  startDate: Timestamp;
  endDate: Timestamp;
  userId: string;
}

interface Timestamp {
  nanoseconds: number;
  seconds: number;
}

interface fileMetadata{
    contentType: string| null | undefined;
    name: string;
    size: number;
    path: string | undefined;
}
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
export class LessonsComponent implements OnInit, OnDestroy {
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
  lessonNo!: number;
  category!: string;
  tabs = ['Materials', 'Notes', 'Quiz', 'QnA Forum'];
  activeTabIndex = 0;
  progress!: Progress;
  progress$!: Subscription;
  lessonProgress!: LessonProg;
  fileList: { name: string; videolink: any; }[] = [];
  materialList: fileMetadata[] = [];
  imageArray: any[] = [];
  files:any[] =[];
  uploadCompleted = signal(false);

  constructor(
    private route: Router, 
    private firebase: FirebaseService, 
    private ar: ActivatedRoute, 
    private storage: AngularFireStorage,
   ){
    this.ar.queryParams.subscribe(params => {
      this.lessonId = params['id'];
      this.category = this.lessonId.split('/')[0];
      const str = this.lessonId.split('/')[1];
      const numbers = str.match(/\d+/);

      if (numbers) {
        this.lessonNo = parseInt(numbers[0], 10);
      }
    });
  }

  ngOnInit(): void {
      this.materialList = [];
      const encoded = this.route.url.split('/')[3]
      this.title = decodeURIComponent(encoded);

      const email = localStorage.getItem('email') || '';
      this.initializeLesson(email);

      this.progress$ = this.firebase.getLessonProgress().subscribe((prog:any) => {
        this.progress = prog.data();
        this.lessonProgress = (this.progress as any)[this.category.toUpperCase()].find((lesson:any) => lesson.lessonNo === this.lessonNo)
        // this.progress = progdata[this.category.toUpperCase()].filter((lesson:any) => {
        //   // console.log(lessson.id, this.lessonId )
        //   lesson.id = this.lessonId
        // } )
        console.log(this.lessonProgress)
      });
  }

  ngOnDestroy(): void {
      this.progress$.unsubscribe();
  }


  async initializeLesson(email:string){
    this.firebase.getLessonbyCategory(this.category,this.lessonId).subscribe(lesson=> {
      this.currentLesson = lesson;
      if (!this.videoSrc) this.getVideoFromFirebase(this.currentLesson).then(url => this.videoSrc = url);
      this.initializeQuiz(this.currentLesson);
    })
    this.getFileList();
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
    this.firebase.vidEndNxtLessonUpdate(this.lessonNo, this.category, this.progressRate())
    
  }

  progressUpdate(update:number){ 
    this.progressRate.set(update);
    console.log(this.progressRate())
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
  

  getFileList() {
    const ref = this.storage.ref('materials/bb/english');
    let myurlsubscription = ref.listAll().subscribe((data) => {
      console.log(data.items)
      data.items.forEach(item => {
    
        let metadata: fileMetadata;
        item.getMetadata().then(meta => {
          metadata = {
            contentType: meta.contentType,
            name: meta.name,
            size: meta.size,
            path: ''
          }
        })
        item.getDownloadURL().then(val => {
          metadata.path = val
          this.materialList.push(metadata);
          console.log(this.materialList);
        });
      })
    });
  }

  downloadFile(path: string|undefined){
    if(path == undefined) return ;
    window.open(path, '_blank');
  }
  
  onDragOver(event: DragEvent){
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent){
    event.preventDefault();
        event.stopPropagation();
        const files: unknown = event.dataTransfer?.files;
        if (files) {
            Array.from(files as any[]).forEach((file: File) => {
                this.preview(file);
            });
        }
  }

  fileUpload(event:any){
    const files: File[] = Array.from(event.target.files);
        files.forEach((file: File) => {
            this.preview(file);
        });
  }

  preview(file: File) {
    this.files.push(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        this.imageArray.push(reader.result);
    };
    console.log(this.imageArray)
  }

  //Remove the image from the array
  deleteImage(index: number) {
      this.imageArray.splice(index, 1);
  }

  isPdfFile(url: string): boolean {
    return /^data:application\/pdf/.test(url);
  }

  uploadNotes(){
    this.imageArray.forEach((file, index) =>{
      const email = localStorage.getItem('email');
      const {base64Content, contentType} = this.splitDataUri(file);
      const fileRef = this.storage.ref(`notes/${email}/${this.lessonId}/note_${index}`);
      fileRef.putString(base64Content, 'base64', { contentType: contentType }).then((snapshot) => {
        console.log('File uploaded successfully:', snapshot.totalBytes);
        // Get download URL if needed:
        const downloadURL = snapshot.ref.getDownloadURL();
        console.log(downloadURL);
        // Check if all files are uploaded
        if (index === this.imageArray.length - 1) {
          // Clear imageArray
          this.imageArray = [];

          // Set uploadCompleted to true
          this.uploadCompleted.set(true);

          console.log('Upload completed');
        }
      });
    })
  }

  splitDataUri(dataUri: string): { base64Content: string, contentType: string } {
    const base64Index = dataUri.indexOf(';base64,');
    if (base64Index === -1) {
      throw new Error('Invalid data URI: Missing ;base64');
    }
  
    const contentType = dataUri.substring(5, base64Index); // Extract content type
    const base64Content = dataUri.substring(base64Index + 8); // Extract base64 content
  
    return { base64Content, contentType };
  }
} 