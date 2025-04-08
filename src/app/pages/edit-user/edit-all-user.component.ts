import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserFilterPipe } from '../../shared/pipes/user-filter.pipe';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DataService } from 'src/app/shared/services/data.service';
import { EditUserComponent } from 'src/app/components/edit-user/edit-user.component';

@Component({
    selector: 'app-edit-user',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatDialogModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, UserFilterPipe],
    templateUrl: './edit-all-user.component.html',
    styleUrl: './edit-all-user.component.scss',
})
export class EditAllUserComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['id', 'name', 'language', 'networker', 'instructor', 'class', 'progress', 'action'];
    dataSource = new MatTableDataSource<any>([]);
    visibleRowCount = 5; // Default number of visible rows
    searchTerm: string = '';
    originalData: any = [];
    appearance: MatFormFieldAppearance = 'fill';

    ds = inject(DataService);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(public dialog: MatDialog) {}

    ngOnInit(): void {
        this.getAllUsers();
    }

    openDialog(item: any) {
        const dialogRef = this.dialog.open(EditUserComponent, {
            data: item,
        });

        dialogRef.afterClosed().subscribe((result) => {
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

    getAllUsers() {
        return this.ds.getAllUsersData().subscribe((users) => {
            this.dataSource.data = users;
            this.originalData = this.dataSource.data;
            this.dataSource.sort = this.sort;
        });
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.searchTerm = filterValue.trim().toLowerCase();

        this.dataSource.data = this.searchTerm
            ? this.originalData.filter(
                  (user: { name: string }) => user.name.toLowerCase().includes(this.searchTerm),
                  // ... add more filter conditions for other fields
              )
            : this.originalData;
    }
}
