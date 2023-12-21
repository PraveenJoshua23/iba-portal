import { Component, EventEmitter, Input, Output, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CropperDialogComponent, CropperDialogResult } from '../cropper-dialog/cropper-dialog.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-image-control',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './image-control.component.html',
  styleUrls: ['./image-control.component.scss']
})
export class ImageControlComponent {
  imageWidth = signal(0);
  @Input() set width(val: number){
    this.imageWidth.set(val);
  }

  imageHeight = signal(0);
  @Input() set height(val: number){
    this.imageHeight.set(val);
  }

  placeholder = computed(() => `https://placehold.co/${this.imageWidth()}x${this.imageHeight()}`)

  dialog = inject(MatDialog)
  croppedImage = signal<CropperDialogResult|undefined>(undefined)

  fileSelected(event: any){
    const file = event.target.files[0];
    if(file){
      const dialogRef = this.dialog.open(CropperDialogComponent,{
        data: { image: file, width: this.imageWidth(), height: this.imageHeight()},
        width: '500px'
      });

      dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((result)=>{
        this.croppedImage.set(result);
      })
    }
  }

  imageSource = computed(()=>{
    if(this.croppedImage){
      return this.croppedImage()?.imageUrl
    } else{
      return this.placeholder()
    }
    
  })

  @Output() imageReady = new EventEmitter<Blob>();

  constructor(){
    effect(()=>{
      if(this.croppedImage()){
        this.imageReady.emit(this.croppedImage()?.blob)
      }
    })
  }
}
