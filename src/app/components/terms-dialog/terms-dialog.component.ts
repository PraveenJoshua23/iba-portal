import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-terms-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './terms-dialog.component.html',
  styleUrls: ['./terms-dialog.component.scss']
})
export class TermsDialogComponent {

  constructor(public dialogRef: MatDialogRef<TermsDialogComponent>){}


  closeDialog(): void {
    this.dialogRef.close();
  }

}
