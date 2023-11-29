import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(public db: AngularFireDatabase) { }


  getLesson(category: string): Observable<any>{
    return this.db.list(`lessons/${category}`).valueChanges();
  }
}
