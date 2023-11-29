import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { VgApiService, VgCoreModule } from '@videogular/ngx-videogular/core';
// import {VgControlsModule} from '@videogular/ngx-videogular/controls';
// import {VgOverlayPlayModule} from '@videogular/ngx-videogular/overlay-play';
// import {VgBufferingModule} from '@videogular/ngx-videogular/buffering';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [CommonModule,
    VideoPlayerComponent ],
  templateUrl: './lessons.component.html',
  styleUrls: ['./lessons.component.scss'],
})
export class LessonsComponent {
  
}
