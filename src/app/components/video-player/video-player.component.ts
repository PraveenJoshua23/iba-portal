import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VgApiService, VgCoreModule } from '@videogular/ngx-videogular/core';
import {VgControlsModule} from '@videogular/ngx-videogular/controls';
import {VgOverlayPlayModule} from '@videogular/ngx-videogular/overlay-play';
import {VgBufferingModule} from '@videogular/ngx-videogular/buffering';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule,
    VgCoreModule, VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule ],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnDestroy {
  @Input() src!: string;

  preload: string = 'auto';
  api: VgApiService = new VgApiService();

  private subscriptions: any[] = [];

  onPlayerReady(source: VgApiService){
    this.api = source;
    console.log("Player Ready")
      const autoplaySubscription = this.api.getDefaultMedia().subscriptions.loadedMetadata.subscribe(
        this.autoplay.bind(this)
      )
      const endSubscription = this.api.getDefaultMedia().subscriptions.ended.subscribe(() => {
        // Handle the video end event
        this.onVideoEnd();
      });

      this.subscriptions.push(endSubscription);
  }

  autoplay() {
    this.api.play();
  }


  onVideoEnd() {
    // Your logic when the video ends
    console.log('Video ended');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
