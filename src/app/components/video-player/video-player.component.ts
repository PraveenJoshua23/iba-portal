import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VgApiService, VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';

@Component({
    selector: 'app-video-player',
    standalone: true,
    imports: [CommonModule, VgCoreModule, VgControlsModule, VgOverlayPlayModule, VgBufferingModule],
    templateUrl: './video-player.component.html',
    styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnDestroy, AfterViewInit, OnChanges {
    @Input() src!: string;
    @Input() lessonId!: string;
    @Input() set allowScrubbing(value: boolean) {
        this._allowScrubbing = value;
        if (this.scrubBarContainer) {
            this.updateScrubbingState();
        }
    }
    get allowScrubbing(): boolean {
        return this._allowScrubbing;
    }

    private _allowScrubbing: boolean = false;
    @Output() videoEnded = new EventEmitter<void>();
    @Output() videoProgress = new EventEmitter<number>();

    @ViewChild('scrubBarContainer') scrubBarContainer!: ElementRef;

    preload: string = 'auto';
    api!: VgApiService;

    currentTime: number = 0;
    duration: number = 0;
    progressRate: number = 0;
    
    // Flag to track whether position has been restored
    private positionRestored: boolean = false;
    private subscriptions: any[] = [];
    private readonly STORAGE_KEY_PREFIX = 'video_position_';
    
    constructor() {
        // Register visibility change handler with proper binding
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.savePlaybackPosition = this.savePlaybackPosition.bind(this);
    }
    
    ngOnChanges(changes: SimpleChanges): void {
        // Reset position restored flag when source changes
        if (changes['src'] && !changes['src'].firstChange) {
            this.positionRestored = false;
            console.log('Video source changed, will restore position when ready');
        }
    }

    onPlayerReady(api: VgApiService) {
        this.api = api;
        
        // Log initialization
        console.log(`Video player initialized for lesson: ${this.lessonId}`);
        console.log(`Current video source: ${this.src}`);
        
        const media = this.api.getDefaultMedia();
        
        // Log the media 
        console.log('Media element:', media);

        // Wait for video to be properly loaded before attempting to set position
        const canPlay$ = media.subscriptions.canPlay.subscribe(() => {
            console.log('Video can play event triggered');
            // Only restore position once per video load
            if (!this.positionRestored) {
                this.restorePlaybackPosition();
            }
        });

        // Metadata loaded - first opportunity to get duration
        const metadata$ = media.subscriptions.loadedMetadata.subscribe(() => {
            console.log('Video metadata loaded. Duration:', this.api.duration);
            this.duration = this.api.duration;
            
            // Backup attempt to restore position if canPlay doesn't fire
            setTimeout(() => {
                if (!this.positionRestored) {
                    console.log('Attempting to restore position after metadata loaded');
                    this.restorePlaybackPosition();
                }
            }, 500);
        });

        // Handle video end
        const end$ = media.subscriptions.ended.subscribe(() => {
            console.log('Video ended naturally');
            this.clearSavedPosition();
            this.videoEnded.emit();
        });

        // Handle time updates
        const timeUpdate$ = media.subscriptions.timeUpdate.subscribe(() => {
            this.currentTime = media.currentTime;
            if (!this.duration && media.duration) {
                this.duration = media.duration;
            }
            this.updateProgress();
        });

        // Handle play state changes
        const play$ = media.subscriptions.play.subscribe(() => {
            console.log('Video playback started');
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
        });

        const pause$ = media.subscriptions.pause.subscribe(() => {
            console.log('Video playback paused at:', media.currentTime);
            this.savePlaybackPosition();
        });

        this.subscriptions.push(canPlay$, metadata$, end$, timeUpdate$, play$, pause$);
        
        // Save position when leaving the page
        window.addEventListener('beforeunload', this.savePlaybackPosition);
    }

    private getStorageKey(): string {
        return `${this.STORAGE_KEY_PREFIX}${this.lessonId}`;
    }

    private savePlaybackPosition(): void {
        if (!this.lessonId || !this.api) return;
        
        const currentTime = this.api.currentTime;
        if (!currentTime) return;
        
        // Don't save if we're at the end of the video
        if (this.duration && currentTime >= this.duration - 2) {
            this.clearSavedPosition();
            return;
        }
        
        localStorage.setItem(this.getStorageKey(), currentTime.toString());
        console.log(`Saved position ${currentTime.toFixed(2)} for lesson ${this.lessonId}`);
    }

    private restorePlaybackPosition(): void {
        if (!this.lessonId || !this.api || this.positionRestored) return;
        
        const savedPosition = localStorage.getItem(this.getStorageKey());
        console.log(`Attempting to restore position. Saved value: ${savedPosition}`);
        
        if (savedPosition) {
            const position = parseFloat(savedPosition);
            
            // Check if position is valid
            if (!isNaN(position) && position > 0) {
                console.log(`Restoring to position: ${position.toFixed(2)}`);
                
                // Set position with a slight delay to ensure video is ready
                setTimeout(() => {
                    // Double-check if duration is available and position is valid
                    if (this.api.duration && position < this.api.duration - 2) {
                        console.log(`Setting currentTime to ${position.toFixed(2)}`);
                        this.api.currentTime = position;
                        this.positionRestored = true;
                    } else {
                        console.log(`Cannot restore position: duration=${this.api.duration}, position=${position}`);
                    }
                }, 300);
            }
        } else {
            console.log('No saved position found');
            this.positionRestored = true; // Mark as restored even if no position was found
        }
    }

    private clearSavedPosition(): void {
        if (this.lessonId) {
            localStorage.removeItem(this.getStorageKey());
            console.log(`Cleared saved position for lesson ${this.lessonId}`);
        }
    }

    private updateProgress(): void {
        const newProgressRate = Math.round((this.currentTime / this.duration) * 100);
        
        // Only emit progress updates when it changes significantly
        if (!isNaN(newProgressRate) && 
            newProgressRate !== this.progressRate && 
            newProgressRate % 2 === 0 && 
            newProgressRate > 0) {
            
            this.progressRate = newProgressRate;
            this.videoProgress.emit(this.progressRate);
            
            // Save position on significant progress changes
            if (newProgressRate % 10 === 0) {
                this.savePlaybackPosition();
            }
        }
    }

    private handleVisibilityChange(): void {
        if (document.visibilityState === 'hidden') {
            // Page is being hidden (switched tabs, minimized) - save position
            console.log('Page visibility changed to hidden - saving position');
            this.savePlaybackPosition();
        }
    }

    ngOnDestroy(): void {
        // Save position before component is destroyed
        this.savePlaybackPosition();
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('beforeunload', this.savePlaybackPosition);
        
        // Unsubscribe from all subscriptions
        this.subscriptions.forEach(sub => {
            if (sub && typeof sub.unsubscribe === 'function') {
                sub.unsubscribe();
            }
        });
        
        console.log('Video player component destroyed');
    }

    ngAfterViewInit(): void {
        this.updateScrubbingState();
    }

    private updateScrubbingState(): void {
        if (!this.scrubBarContainer?.nativeElement) return;
        
        setTimeout(() => {
            const scrubBars = this.scrubBarContainer.nativeElement.querySelectorAll('vg-scrub-bar');
            
            scrubBars.forEach((scrubBar: HTMLElement) => {
                if (!this.allowScrubbing) {
                    scrubBar.classList.add('scrubbing-disabled');
                    const elements = scrubBar.querySelectorAll('.scrub-bar, .scrub-bar-current-time');
                    elements.forEach(el => (el as HTMLElement).style.pointerEvents = 'none');
                } else {
                    scrubBar.classList.remove('scrubbing-disabled');
                    const elements = scrubBar.querySelectorAll('.scrub-bar, .scrub-bar-current-time');
                    elements.forEach(el => (el as HTMLElement).style.pointerEvents = 'auto');
                }
            });
        }, 0);
    }
}