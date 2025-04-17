import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GeminiService {
    private http = inject(HttpClient);

    /**
     * Generate a summary from text content using Gemini AI
     * @param text - The text content to summarize (e.g., video transcript)
     * @returns Observable with the generated summary
     */
    generateSummary(text: string): Observable<string> {
        // This assumes you have a backend API endpoint that handles the Gemini API call
        return this.http.post<{ summary: string }>(`${environment.gemini.apiKey}/api/gemini/summarize`, { text }).pipe(
            map(response => response.summary),
            catchError((error) => {
                console.error('Error generating summary with Gemini AI:', error);
                return throwError(() => new Error(`Failed to generate summary: ${error.message || 'Unknown error'}`));
            }),
        );
    }

    /**
     * Generate a summary directly using the Gemini API (client-side implementation)
     * Note: This approach requires exposing your API key in the frontend, which is not recommended for production.
     * A better approach is to use a backend service to handle the API calls.
     * @param text - The text content to summarize
     * @returns Observable with the generated summary
     */
    generateSummaryDirect(text: string): Observable<string> {
        // This is a simplified example - in production, use a backend service instead
        const apiKey = environment.gemini?.apiKey;
        const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `Please provide a concise and informative summary of the following video transcript:
          
          ${text}
          
          Focus on the main topics, key points, and important takeaways. The summary should be well-structured and easy to understand.`,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        };

        return this.http.post<any>(`${geminiApiUrl}?key=${apiKey}`, requestBody).pipe(
            map((response) => {
                if (response.candidates && response.candidates.length > 0) {
                    return response.candidates[0].content.parts[0].text;
                }
                throw new Error('Invalid response format from Gemini API');
            }),
            catchError((error) => {
                console.error('Error calling Gemini API directly:', error);
                return throwError(() => new Error(`Failed to generate summary: ${error.message || 'Unknown error'}`));
            }),
        );
    }
}
