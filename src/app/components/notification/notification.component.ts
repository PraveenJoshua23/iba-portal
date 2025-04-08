import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div
            *ngIf="visible"
            class="fixed top-4 right-4 p-4 rounded-md text-white z-50 flex items-center space-x-2 shadow-lg"
            [ngClass]="{ 'bg-green-500': type === 'success', 'bg-red-500': type === 'error', 'bg-blue-500': type === 'info' }"
            [@fadeInOut]
        >
            <span *ngIf="type === 'success'" class="material-icons text-sm">check_circle</span>
            <span *ngIf="type === 'error'" class="material-icons text-sm">error</span>
            <span *ngIf="type === 'info'" class="material-icons text-sm">info</span>
            <span>{{ message }}</span>
        </div>
    `,
    animations: [
        trigger('fadeInOut', [
            state(
                'void',
                style({
                    opacity: 0,
                    transform: 'translateY(-20px)',
                }),
            ),
            transition('void <=> *', [animate('300ms ease-out')]),
        ]),
    ],
})
export class NotificationComponent implements OnInit {
    @Input() message: string = '';
    @Input() duration: number = 3000; // Default 3 seconds
    @Input() type: 'success' | 'error' | 'info' = 'info';

    visible: boolean = false;

    ngOnInit() {
        this.show();
    }

    show() {
        this.visible = true;

        setTimeout(() => {
            this.visible = false;
        }, this.duration);
    }
}
