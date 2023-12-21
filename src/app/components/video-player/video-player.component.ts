import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VgApiService, VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';
import { delay, distinctUntilChanged, filter, lastValueFrom, map, take } from 'rxjs';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [
    CommonModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
  ],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnDestroy {
  @Input() src!: string;
  @Output() videoEnded = new EventEmitter<void>();
  @Output() videoProgress = new EventEmitter<number>();

  preload: string = 'auto';
  api: VgApiService = new VgApiService();

  currentTime!: number;
  duration!: number;
  progressRate!: number;

  private subscriptions: any[] = [];

  onPlayerReady(source: VgApiService) {
    this.api = source;
    const media = this.api.getDefaultMedia();
    // console.log("Player Ready, src:", this.src)
    const autoplay$ = media.subscriptions.loadedMetadata.subscribe(
      this.autoplay.bind(this)
    );

    // Check if there is a last watched time in local storage
    // const lastWatchedTime = localStorage.getItem('lastWatchedTime');
    const lastWatchedTime = '1560.590656';
    if (lastWatchedTime) {
      // Set the video current time to the last watched time
      this.api.currentTime = parseFloat(lastWatchedTime);
    }

    const end$ = media.subscriptions.ended.subscribe(() => {
      // Handle the video end event
      this.onVideoEnd();
    });

    const progress$ = media.subscriptions.timeUpdate
      .subscribe(() => {
        this.currentTime = media.currentTime;
        this.duration = media.duration;
        this.onTimeUpdate();
      });

    // Subscribe to time updates
    // this.api.getDefaultMedia().subscriptions.timeUpdate.subscribe(() => {
    //   const currentTime = this.api.currentTime;

    //   // Update the last watched time in local storage
    //   // localStorage.setItem('lastWatchedTime', currentTime.toString());
    // });

    this.subscriptions.push(autoplay$);
    this.subscriptions.push(end$);
    this.subscriptions.push(progress$);
  }

  autoplay() {
    // this.api.play();
  }

  onTimeUpdate() {
    this.progressRate = Math.round((this.currentTime / this.duration) * 100);
    if (!Number.isNaN(this.progressRate) && this.progressRate%3===0 && this.progressRate!==0) {
      this.videoProgress.emit(this.progressRate);
    }
  }

  onVideoEnd() {
    console.log('Video ended');
    this.videoEnded.emit();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
