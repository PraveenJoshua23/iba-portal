import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-app-shell',
    templateUrl: './app-shell.component.html',
    standalone: true,
    imports: [NavbarComponent, SidebarComponent, RouterModule],
    styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent {
    isSidebarOpen: boolean = false;

    toggleSidebar(): void {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    closeSidebar(): void {
        this.isSidebarOpen = false;
    }
}
