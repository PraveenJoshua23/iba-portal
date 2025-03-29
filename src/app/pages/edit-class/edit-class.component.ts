import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { ClassServiceService } from 'src/app/shared/services/class/class-service.service';
import { classData } from 'src/app/shared/utils/init-data';

@Component({
  selector: 'app-edit-class',
  standalone: true,
  imports: [],
  templateUrl: './edit-class.component.html',
  styleUrl: './edit-class.component.scss'
})
export class EditClassComponent implements OnInit {
  displayedColumns: string[] = ['id','name', 'language', 'networker', 'instructor', 'class', 'progress', 'action'];
  cs = inject(ClassServiceService)
  searchTerm: string = ''; 
  originalData: any = [];  
  dataSource = new MatTableDataSource<any>([]);
  appearance: MatFormFieldAppearance = 'fill';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public dialog: MatDialog){}

  ngOnInit(): void {
      // this.cs.seedClassesToFirestore(classData);
  }

  addClass(){
    
  }
  
  getAllClass(){
    return this.cs.getAllClassData().subscribe(cls=>{
      this.dataSource.data = cls;
      this.originalData = this.dataSource.data;
      this.dataSource.sort = this.sort;
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue.trim().toLowerCase();
    console.log(filterValue)
    this.dataSource.data = this.searchTerm ?
      this.originalData.filter((user: { name: string; }) =>
        user.name.toLowerCase().includes(this.searchTerm)
        // ... add more filter conditions for other fields
      ) : this.originalData;

      console.log(this.dataSource.data)
  }


}
