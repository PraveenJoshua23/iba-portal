import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy{
  constructor(private auth: AngularFireAuth){}
  usrEmail!: string | null;

  private subscriptions: any[] = [];

  ngOnInit(): void {
      const authSub = this.auth.authState.subscribe(user => {
        if(user){
          this.usrEmail = user.email
        }
      })

      this.subscriptions.push(authSub) 
  }

  ngOnDestroy(): void {
      this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

}
