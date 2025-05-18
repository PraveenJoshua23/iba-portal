// src/app/components/support-dialog/support-dialog.component.ts
import { Component, OnInit, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { NotificationService } from '../notification/notification.service';
import { TranslationService } from 'src/app/shared/services/language/language.service';

@Component({
    selector: 'app-support-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <!-- src/app/components/support-dialog/support-dialog.component.html -->
        <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <!-- Close button -->
                <button (click)="closeDialog()" class="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 class="text-xl font-semibold text-gray-800 mb-4">{{ translationService.instant('support') || 'Support' }}</h2>

                <form [formGroup]="supportForm" (ngSubmit)="handleSubmit()">
                    <!-- Issue Type Dropdown -->
                    <div class="mb-4">
                        <label for="issueType" class="block text-sm font-medium text-gray-700 mb-1"> {{ translationService.instant('issueType') || 'Issue Type' }} * </label>
                        <div class="relative">
                            <select
                                id="issueType"
                                formControlName="issueType"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-golden-500 focus:border-golden-500"
                                [class.border-red-500]="supportForm.get('issueType')?.invalid && supportForm.get('issueType')?.touched"
                            >
                                <option value="" disabled selected>{{ translationService.instant('selectIssue') || 'Select an issue' }}</option>
                                <option *ngFor="let issue of issueTypes" [value]="issue">{{ issue }}</option>
                            </select>
                        </div>
                        <p *ngIf="supportForm.get('issueType')?.invalid && supportForm.get('issueType')?.touched" class="mt-1 text-xs text-red-600">
                            {{ translationService.instant('issueTypeRequired') || 'Please select an issue type' }}
                        </p>
                    </div>

                    <!-- Description -->
                    <div class="mb-4">
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-1"> {{ translationService.instant('description') || 'Description' }} * </label>
                        <textarea
                            id="description"
                            formControlName="description"
                            rows="4"
                            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-golden-500 focus:border-golden-500"
                            [class.border-red-500]="supportForm.get('description')?.invalid && supportForm.get('description')?.touched"
                            placeholder="{{ translationService.instant('describeIssue') || 'Please describe your issue in detail...' }}"
                        ></textarea>
                        <p *ngIf="supportForm.get('description')?.invalid && supportForm.get('description')?.touched" class="mt-1 text-xs text-red-600">
                            <span *ngIf="supportForm.get('description')?.errors?.['required']">
                                {{ translationService.instant('descriptionRequired') || 'Description is required' }}
                            </span>
                            <span *ngIf="supportForm.get('description')?.errors?.['minlength']">
                                {{ translationService.instant('descriptionMinLength') || 'Description must be at least 10 characters' }}
                            </span>
                        </p>
                    </div>

                    <!-- Email (hidden but included in form) -->
                    <div class="mb-4">
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1"> {{ translationService.instant('email') || 'Email' }} * </label>
                        <input
                            type="email"
                            id="email"
                            formControlName="email"
                            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-golden-500 focus:border-golden-500"
                            [class.border-red-500]="supportForm.get('email')?.invalid && supportForm.get('email')?.touched"
                            readonly
                        />
                        <p *ngIf="supportForm.get('email')?.invalid && supportForm.get('email')?.touched" class="mt-1 text-xs text-red-600">
                            {{ translationService.instant('validEmail') || 'Please enter a valid email' }}
                        </p>
                    </div>

                    <!-- Error Message -->
                    <div *ngIf="formError" class="mb-4 p-2 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
                        {{ formError }}
                    </div>

                    <!-- Submit Button -->
                    <div class="flex justify-end">
                        <button
                            type="submit"
                            class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-golden-600 border border-transparent rounded-md shadow-sm hover:bg-golden-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
                            [disabled]="isSubmitting"
                        >
                            <span *ngIf="!isSubmitting">{{ translationService.instant('submit') || 'Submit' }}</span>
                            <span *ngIf="isSubmitting" class="flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {{ translationService.instant('submitting') || 'Submitting...' }}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `,
})
export class SupportDialogComponent implements OnInit {
    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<any>();

    isOpen = false;
    isSubmitting = false;
    supportForm!: FormGroup;
    formError: string | null = null;

    auth = inject(AuthService);
    notificationService = inject(NotificationService);
    translationService = inject(TranslationService);
    fb = inject(FormBuilder);

    issueTypes = ['Video is not playing', 'How to view my progress', 'I cannot go to the next lesson', 'I cannot add a note', 'I need help from the team', 'Others'];

    ngOnInit() {
        this.supportForm = this.fb.group({
            issueType: ['', Validators.required],
            description: ['', [Validators.required, Validators.minLength(10)]],
            email: [this.auth.getUserEmail() || localStorage.getItem('email') || '', [Validators.required, Validators.email]],
        });
    }

    open() {
        this.isOpen = true;
        this.resetForm();
    }

    closeDialog() {
        this.isOpen = false;
        this.isSubmitting = false; // Reset submission state
        this.close.emit();
    }

    resetForm() {
        this.formError = null;
        this.supportForm.reset({
            issueType: '',
            description: '',
            email: this.auth.getUserEmail() || localStorage.getItem('email') || '',
        });
    }

    handleSubmit() {
        if (!this.supportForm.valid) {
            this.formError = 'Please fill all required fields correctly';
            return;
        }

        this.isSubmitting = true;
        this.formError = null;

        const formData = {
            ...this.supportForm.value,
            timestamp: new Date().toISOString(),
        };

        this.submit.emit(formData);
    }
}
