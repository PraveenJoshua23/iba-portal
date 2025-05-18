// src/app/shared/services/support/support.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SupportService {
    constructor(private http: HttpClient) {}

    /**
     * Send support request to n8n webhook
     */
    submitSupportRequest(supportData: any): Observable<any> {
        // Replace this URL with your actual n8n webhook URL
        const webhookUrl = environment.n8nWebhookUrl;

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
        };

        return this.http.post(webhookUrl, supportData, httpOptions).pipe(catchError(this.handleError));
    }

    /**
     * Handle HTTP errors
     */
    private handleError(error: any) {
        console.error('An error occurred:', error);
        return throwError(() => new Error(error.message || 'Server error'));
    }
}
