import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserFilterPipe } from '../../shared/pipes/user-filter.pipe';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DataService } from 'src/app/shared/services/data.service';
import { EditUserComponent } from 'src/app/components/edit-user/edit-user.component';
import { UserService } from 'src/app/shared/services/users/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { AddUserDialogComponent } from 'src/app/components/add-user/add-user-dialog.component';

@Component({
    selector: 'app-edit-user',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatDialogModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, UserFilterPipe, MatSnackBarModule],
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
    userService = inject(UserService);
    snackBar = inject(MatSnackBar);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(public dialog: MatDialog) {}

    ngOnInit(): void {
        this.getAllUsers();
    }

    openDialog(item: any) {
        const dialogRef = this.dialog.open(EditUserComponent, {
            data: item,
            width: '800px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Refresh the table data
                this.getAllUsers();
                this.snackBar.open('User updated successfully', 'Close', {
                    duration: 3000,
                });
            }
        });
    }

    openAddUserDialog() {
        const dialogRef = this.dialog.open(AddUserDialogComponent, {
            width: '800px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Refresh the table data after adding a new user
                this.getAllUsers();
                this.snackBar.open('User added successfully', 'Close', {
                    duration: 3000,
                });
            }
        });
    }

    deleteUser(user: any) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: {
                title: 'Confirm Delete',
                message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.userService
                    .deleteUser(user.id)
                    .then(() => {
                        this.getAllUsers();
                        this.snackBar.open('User deleted successfully', 'Close', {
                            duration: 3000,
                        });
                    })
                    .catch((error) => {
                        console.error('Error deleting user:', error);
                        this.snackBar.open('Error deleting user', 'Close', {
                            duration: 3000,
                        });
                    });
            }
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
                  (user: { name: string; email: string; language: string; networker: string; instructor: string }) =>
                      user.name.toLowerCase().includes(this.searchTerm) ||
                      (user.email && user.email.toLowerCase().includes(this.searchTerm)) ||
                      (user.language && user.language.toLowerCase().includes(this.searchTerm)) ||
                      (user.networker && user.networker.toLowerCase().includes(this.searchTerm)) ||
                      (user.instructor && user.instructor.toLowerCase().includes(this.searchTerm)),
              )
            : this.originalData;
    }
}
