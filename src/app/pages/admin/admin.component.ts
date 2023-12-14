import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

export interface UserData {
  id: string;
  name: string;
  progress: string;
  color: string;
}

const ELEMENT_DATA: UserData[] = [
  { id: '1', name: 'John Doe', progress: '75%', color: 'green' },
  { id: '2', name: 'John Doe', progress: '75%', color: 'green' },
  { id: '3', name: 'John Doe', progress: '75%', color: 'green' },
  { id: '4', name: 'John Doe', progress: '75%', color: 'green' },
  { id: '5', name: 'John Doe', progress: '75%', color: 'green' },
  // Add more data as needed
];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit{

  displayedColumns: string[] = ['name', 'age', 'language'];
  dataSource: any = [];

  constructor(private fb: FirebaseService){

  }


  ngOnInit(): void {
     this.getAllUsers();
  }
  

  getAllUsers(){
    return this.fb.getUsers().then(v=> {
      this.dataSource = v
      console.log(v)
    })
  }
}
