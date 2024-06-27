import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; 
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
// import {Sort, MatSortModule} from '@angular/material/sort';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EditUserComponent } from 'src/app/components/edit-user/edit-user.component';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/shared/services/data.service';

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
  imports: [CommonModule, MatTableModule, MatButtonModule, MatDialogModule, MatPaginatorModule ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit{

  displayedColumns: string[] = ['id','name', 'language', 'networker', 'instructor', 'class', 'progress', 'action'];
  dataSource = new MatTableDataSource<any>([]);;
  visibleRowCount = 5; // Default number of visible rows
  ds = inject(DataService)

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('matSort') sort!: MatSort;


  constructor(private form: FormBuilder, private fb: FirebaseService, public dialog: MatDialog){
   
  }


  ngOnInit(): void {
     this.getAllUsers();
  }

  openDialog(item:any) {
    console.log(item)
    const dialogRef = this.dialog.open(EditUserComponent,{
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  // Function to update the number of visible rows
  updateVisibleRows(count: number) {
    this.visibleRowCount = count;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    
  }
  
  getAllUsers(){
    return this.ds.getAllUsersData().subscribe(users=>{
      this.dataSource.data = users
      this.dataSource.sort = this.sort;
    })
  }
}
