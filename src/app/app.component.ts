import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppShellComponent } from './components/app-shell/app-shell.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, AppShellComponent],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'hztc-website';
}
