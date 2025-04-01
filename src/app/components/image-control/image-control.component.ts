import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Storage, getDownloadURL, ref } from '@angular/fire/storage';

@Component({
    selector: 'app-image-control',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex flex-col items-center">
            <div [style.width.px]="width" [style.height.px]="height" class="relative overflow-hidden rounded-full">
                <img [src]="imageUrl || defaultImageUrl" [alt]="alt" class="object-cover w-full h-full" (error)="handleImageError()" />
            </div>
            <div *ngIf="showUploadOption" class="mt-2">
                <input type="file" accept="image/*" (change)="onFileSelected($event)" class="hidden" #fileInput />
                <button class="px-3 py-1 bg-golden-400 rounded-md cursor-pointer text-slate-900 text-sm" (click)="fileInput.click()">Upload image</button>
            </div>
        </div>
    `,
    styles: [],
})
export class ImageControlComponent implements OnInit {
    @Input() width = 100;
    @Input() height = 100;
    @Input() path = '';
    @Input() alt = 'Profile Image';
    @Input() showUploadOption = true;
    @Input() defaultImageUrl = 'assets/images/default-profile.png';

    @Output() imageReady = new EventEmitter<{ status: string; url?: string }>();

    storage = inject(Storage);
    imageUrl: string | null = null;

    ngOnInit() {
        this.loadImage();
    }

    loadImage() {
        if (!this.path) {
            this.imageReady.emit({ status: 'error', url: this.defaultImageUrl });
            return;
        }

        const storageRef = ref(this.storage, this.path);

        getDownloadURL(storageRef)
            .then((url) => {
                this.imageUrl = url;
                this.imageReady.emit({ status: 'success', url });
            })
            .catch((error) => {
                console.error('Error loading image:', error);
                this.imageReady.emit({ status: 'error' });
            });
    }

    handleImageError() {
        this.imageUrl = this.defaultImageUrl;
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            // Handle file upload to Firebase Storage
            // Implement your file upload logic here
        }
    }
}
