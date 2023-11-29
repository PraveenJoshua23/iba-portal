import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  constructor(private auth: AuthService, private route: Router){}

  signOut(){
    this.auth.signOut().subscribe({
      next: (res) => {
        this.route.navigate(['/login'])
      }
    })
  }

}
