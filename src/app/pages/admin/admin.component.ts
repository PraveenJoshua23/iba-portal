import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; 
import {MatDialog, MatDialogModule} from '@angular/material/dialog';

import { EditAllUserComponent } from '../edit-user/edit-all-user.component';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { DataService } from 'src/app/shared/services/data.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserFilterPipe } from "../../shared/pipes/user-filter.pipe";
import { Observable } from 'rxjs';
import { EditClassComponent } from '../edit-class/edit-class.component';
import { EditLessonComponent } from '../edit-lesson/edit-lesson.component';

@Component({
    selector: 'app-admin',
    standalone: true,
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    imports: [CommonModule, MatTableModule, MatButtonModule, MatDialogModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, UserFilterPipe, EditAllUserComponent, EditClassComponent, EditLessonComponent]
})
export class AdminComponent implements OnInit{


  displayedColumns: string[] = ['id','name', 'language', 'networker', 'instructor', 'class', 'progress', 'action'];
  dataSource = new MatTableDataSource<any>([]);;
  visibleRowCount = 5; // Default number of visible rows
  searchTerm: string = ''; 
  originalData: any = [];  
  appearance: MatFormFieldAppearance = 'fill';

  ds = inject(DataService)

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  constructor(public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer){}

  ngOnInit(): void {
    //  this.getAllUsers();
  }

  // openDialog(item:any) {
  //   console.log(item)
  //   const dialogRef = this.dialog.open(EditUserComponent,{
  //     data: item
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     console.log(`Dialog result: ${result}`);
  //   });
  // }

  // // Function to update the number of visible rows
  // updateVisibleRows(count: number) {
  //   this.visibleRowCount = count;
  // }

  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  // }
  
  // getAllUsers(){
  //   return this.ds.getAllUsersData().subscribe(users=>{
  //     this.dataSource.data = users;
  //     this.originalData = this.dataSource.data;
  //     this.dataSource.sort = this.sort;
  //   })
  // }

  // applyFilter(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.searchTerm = filterValue.trim().toLowerCase();
  //   console.log(filterValue)
  //   this.dataSource.data = this.searchTerm ?
  //     this.originalData.filter((user: { name: string; }) =>
  //       user.name.toLowerCase().includes(this.searchTerm)
  //       // ... add more filter conditions for other fields
  //     ) : this.originalData;

  //     console.log(this.dataSource.data)
  // }

  // announceSortChange(sortState: Sort) {
  //   if (sortState.direction) {
  //     this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
  //   } else {
  //     this._liveAnnouncer.announce('Sorting cleared');
  //   }
  //   }

  
}
