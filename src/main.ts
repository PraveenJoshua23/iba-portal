
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterModule } from '@angular/router';

// import { AppModule } from './app/app.module';
import { AppComponent } from './app/app.component';
import { APP_ROUTE } from './app/app.route';
import { importProvidersFrom } from '@angular/core';


// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => console.error(err));
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTE),
  ]
})