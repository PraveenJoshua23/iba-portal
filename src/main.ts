
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { APP_ROUTE } from './app/app.route';
import { importProvidersFrom } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTE), importProvidersFrom(AngularFireModule.initializeApp({
      apiKey: "AIzaSyAh_Ppv8G1bsyY7ax4vMVc7IeHKt6ch9ug",
      authDomain: "hsztc-dashboard.firebaseapp.com",
      projectId: "hsztc-dashboard",
      storageBucket: "hsztc-dashboard.appspot.com",
      messagingSenderId: "1075322656509",
      appId: "1:1075322656509:web:e5068ef4a0916646215094",
      measurementId: "G-MV73KNE1PC"
    })), 
  ]
})