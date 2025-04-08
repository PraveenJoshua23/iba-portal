import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { IUser } from '../../shared/models/user.interface';

interface MenuItem {
    label: string;
    route: string;
    icon: string;
    requiredRole?: 'admin' | 'student' | 'instructor';
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
    usrEmail: string | null = '';
    userRole: string | null = null;

    menuItems: MenuItem[] = [
        {
            label: 'Lessons',
            route: '/home',
            icon: '../../../assets/icons/book.svg',
        },
        {
            label: 'My Profile',
            route: '/profile',
            icon: '../../../assets/icons/book.svg',
        },
        {
            label: 'Admin Dashboard',
            route: '/admin',
            icon: '../../../assets/icons/dashboard.svg',
            requiredRole: 'admin',
        },
    ];

    private subscriptions: Subscription[] = [];
    private dataService = inject(DataService);

    constructor(private auth: AngularFireAuth) {}

    ngOnInit(): void {
        const authSub = this.auth.authState.subscribe((user) => {
            if (user) {
                this.usrEmail = user.email;
                // Fetch user details to get the role
                this.getUserDetails(user.email);
            }
        });

        this.subscriptions.push(authSub);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    private async getUserDetails(email: string | null): Promise<void> {
        if (!email) return;

        try {
            const user = await this.dataService.getUserByEmail(email);
            if (user) {
                this.userRole = user.role;
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    }

    // Helper method to determine if a menu item should be visible
    canShowMenuItem(item: MenuItem): boolean {
        // If no required role is specified, show the item to everyone
        if (!item.requiredRole) return true;

        // Otherwise, check if the user has the required role
        return this.userRole?.toLowerCase() === item.requiredRole;
    }
}
