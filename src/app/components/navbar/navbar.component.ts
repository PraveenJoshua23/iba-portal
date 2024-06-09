import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  auth = inject(AuthService);
  errMsg:string|null = null;
  constructor(private route: Router){}

  signOut(){
    this.auth.signOut().subscribe({
      next: (res) => {
        this.route.navigateByUrl('/')
      },
      error: (err) => {
        this.errMsg = err.code;
        console.log(this.errMsg)
      }
    })

    localStorage.clear(); 
  }

}
