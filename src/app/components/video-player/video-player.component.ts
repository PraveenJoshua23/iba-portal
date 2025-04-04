import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VgApiService, VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';
import { delay, distinctUntilChanged, filter, lastValueFrom, map, take } from 'rxjs';

@Component({
    selector: 'app-video-player',
    standalone: true,
    imports: [CommonModule, VgCoreModule, VgControlsModule, VgOverlayPlayModule, VgBufferingModule],
    templateUrl: './video-player.component.html',
    styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnDestroy, AfterViewInit {
    @Input() src!: string;
    @Input() set allowScrubbing(value: boolean) {
        this._allowScrubbing = value;
        // If component is already initialized, update the scrubbing state
        if (this.scrubBarContainer) {
            this.updateScrubbingState();
        }
    }
    get allowScrubbing(): boolean {
        return this._allowScrubbing;
    }

    private _allowScrubbing: boolean = false; // Private backing field
    @Output() videoEnded = new EventEmitter<void>();
    @Output() videoProgress = new EventEmitter<number>();

    @ViewChild('scrubBarContainer') scrubBarContainer!: ElementRef;

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
        const autoplay$ = media.subscriptions.loadedMetadata.subscribe(this.autoplay.bind(this));

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

        const progress$ = media.subscriptions.timeUpdate.subscribe(() => {
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
        if (!Number.isNaN(this.progressRate) && this.progressRate % 2 === 0 && this.progressRate !== 0) {
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

    ngAfterViewInit(): void {
        // Apply scrubbing control after view is initialized
        this.updateScrubbingState();
    }

    // Update when allowScrubbing changes
    private updateScrubbingState(): void {
        if (this.scrubBarContainer && this.scrubBarContainer.nativeElement) {
            setTimeout(() => {
                // Get all scrub bar elements
                const scrubBars = this.scrubBarContainer.nativeElement.querySelectorAll('vg-scrub-bar');

                scrubBars.forEach((scrubBar: HTMLElement) => {
                    if (!this.allowScrubbing) {
                        // Add class to disable scrubbing
                        scrubBar.classList.add('scrubbing-disabled');

                        // Find and disable the scrubBar's interactive elements
                        const scrubBarElements = scrubBar.querySelectorAll('.scrub-bar, .scrub-bar-current-time');
                        scrubBarElements.forEach((element) => {
                            const htmlElement = element as HTMLElement;
                            htmlElement.style.pointerEvents = 'none';
                        });
                    } else {
                        // Remove class to enable scrubbing
                        scrubBar.classList.remove('scrubbing-disabled');

                        // Find and enable the scrubBar's interactive elements
                        const scrubBarElements = scrubBar.querySelectorAll('.scrub-bar, .scrub-bar-current-time');
                        scrubBarElements.forEach((element) => {
                            (element as HTMLElement).style.pointerEvents = 'auto';
                        });
                    }
                });
            }, 0);
        }
    }
}
