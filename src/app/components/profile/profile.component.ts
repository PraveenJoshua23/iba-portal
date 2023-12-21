import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ImageControlComponent } from '../image-control/image-control.component';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ImageControlComponent, MatDialogModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  constructor(private fb: FirebaseService){}

  imageReady(event:any){
    console.log(event)
  }
}
