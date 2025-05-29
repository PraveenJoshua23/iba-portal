import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../../shared/services/data.service';
import { TranslationService } from 'src/app/shared/services/language/language.service';

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
    @Input() isOpen: boolean = false;
    @Output() closeSidebar = new EventEmitter<void>();

    usrEmail: string | null = '';
    userRole: string | null = null;

    translationService = inject(TranslationService);
    currentLanguage: string = 'English';

    menuItems: MenuItem[] = [
        {
            label: 'lessons',
            route: '/home',
            icon: '../../../assets/icons/book.svg',
        },
        {
            label: 'myProfile',
            route: '/profile',
            icon: '../../../assets/icons/profile.svg',
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

    constructor(
        private auth: AngularFireAuth,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.currentLanguage = this.translationService.getCurrentLanguageValue();
        const authSub = this.auth.authState.subscribe((user) => {
            if (user) {
                this.usrEmail = user.email;
                this.getUserDetails(user.email);
            }
        });

        const langSub = this.translationService.getCurrentLanguage().subscribe((language) => {
            this.currentLanguage = language;
        });

        this.subscriptions.push(authSub, langSub);
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

    canShowMenuItem(item: MenuItem): boolean {
        if (!item.requiredRole) return true;
        return this.userRole?.toLowerCase() === item.requiredRole;
    }

    onMenuItemClick(route: string): void {
        // Navigate to the route
        this.router.navigate([route]);
        // Close sidebar on mobile
        this.closeSidebar.emit();
    }

    onCloseSidebar(): void {
        this.closeSidebar.emit();
    }
}
