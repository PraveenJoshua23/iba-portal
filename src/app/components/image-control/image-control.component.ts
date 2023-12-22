import { Component, EventEmitter, Input, Output, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CropperDialogComponent, CropperDialogResult } from '../cropper-dialog/cropper-dialog.component';
import { filter } from 'rxjs';
import { Storage, ref, uploadBytes } from '@angular/fire/storage';
import { getDownloadURL } from 'firebase/storage';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { FirebaseService } from 'src/app/shared/services/firebase.service';


@Component({
  selector: 'app-image-control',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './image-control.component.html',
  styleUrls: ['./image-control.component.scss']
})
export class ImageControlComponent {
  imageWidth = signal(0);
  @Input({ required: true}) set width(val: number){
    this.imageWidth.set(val);
  }

  imageHeight = signal(0);
  @Input({ required: true}) set height(val: number){
    this.imageHeight.set(val);
  }

  imagePath = signal('');
  @Input({ required: true}) set path(val: string){
    this.imagePath.set(val);
  }

  uploading = signal(false);

  placeholder = computed(() => `https://placehold.co/${this.imageWidth()}x${this.imageHeight()}`)

  dialog = inject(MatDialog)
  croppedImageUrl = signal<string|undefined>(undefined)

  fileSelected(event: any){
    const file = event.target.files[0];
    if(file){
      const dialogRef = this.dialog.open(CropperDialogComponent,{
        data: { image: file, width: this.imageWidth(), height: this.imageHeight()},
        width: '500px'
      });

      dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((result)=>{
        this.uploadImage(result.blob)
      })
    }
  }

  imageSource = computed(()=>{
    return this.croppedImageUrl() ?? this.placeholder();
  })

  @Output() imageReady = new EventEmitter<string>();

  constructor(private firebase: FirebaseService){

    this.getImage();
    effect(()=>{
      if(this.croppedImageUrl()){
        this.imageReady.emit(this.croppedImageUrl())
      }
    })
  }

  storage = inject(Storage)

  async uploadImage(blob: Blob){
    this.uploading.set(true)
    const storageRef = ref(this.storage, this.imagePath());
    const uploadTask = await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(uploadTask.ref);
    this.croppedImageUrl.set(downloadUrl);
    this.uploading.set(false)
  }

  async getImage(){
    const email = localStorage.getItem('email') ?? ''
    this.firebase.getProfile(email).then((v)=>{
      this.croppedImageUrl.set(v)
    })
  }
}
