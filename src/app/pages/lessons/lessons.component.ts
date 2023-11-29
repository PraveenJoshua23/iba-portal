import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlyrComponent } from 'ngx-plyr';

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [CommonModule ],
  templateUrl: './lessons.component.html',
  styleUrls: ['./lessons.component.scss']
})
export class LessonsComponent {
// get the component instance to have access to plyr instance
// @ViewChild(PlyrComponent)
// plyr!: PlyrComponent;

// // or get it from plyrInit event
// player!: Plyr;

// videoSources: Plyr.Source[] = [
//   {
//     src: 'bTqVqk7FSmY',
//     provider: 'youtube',
//   },
// ];

// played(event: Plyr.PlyrEvent) {
//   console.log('played', event);
// }

// play(): void {
//   this.player.play(); // or this.plyr.player.play()
// }
}
