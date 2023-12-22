import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  profilePath = signal('')

  constructor(){
    const email = localStorage.getItem('email')
    this.profilePath.set(`/profile/${email}/profile`)
  }

  imageReady(event:any){
    // console.log(event)
  }
}
