import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from 'src/app/components/app-shell/app-shell.component';
import { RouterModule } from '@angular/router';

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
export class HomeComponent {

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
}
