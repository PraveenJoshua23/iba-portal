import { Injectable, ApplicationRef, createComponent, EnvironmentInjector, Type } from '@angular/core';
import { NotificationComponent } from './notification.component';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private notificationTimeout: any;

    constructor(
        private appRef: ApplicationRef,
        private environmentInjector: EnvironmentInjector,
    ) {}

    show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000): void {
        // Clear any existing notification
        this.clear();

        // Create notification component
        const notificationComponentRef = createComponent(NotificationComponent, {
            environmentInjector: this.environmentInjector,
        });

        // Set input properties
        notificationComponentRef.instance.message = message;
        notificationComponentRef.instance.type = type;
        notificationComponentRef.instance.duration = duration;

        // Add to DOM
        document.body.appendChild(notificationComponentRef.location.nativeElement);

        // Detect changes to display the component
        this.appRef.attachView(notificationComponentRef.hostView);

        // Set timeout to remove the notification
        this.notificationTimeout = setTimeout(() => {
            this.appRef.detachView(notificationComponentRef.hostView);
            notificationComponentRef.location.nativeElement.remove();
        }, duration + 300); // Add 300ms for animation
    }

    clear(): void {
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
    }
}
