import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { VimeoMappingService } from './vimeo-mapping.service';

@Injectable({
    providedIn: 'root',
})
export class VimeoService {
    private http = inject(HttpClient);
    private mappingService = inject(VimeoMappingService);
    private accessToken = environment.vimeo.accessToken;
    private apiUrl = 'https://api.vimeo.com';

    constructor() {}

    /**
     * Get video details by video ID
     * @param videoId - Vimeo video ID (numeric)
     */
    getVideoDetails(videoId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/videos/${videoId}`, { headers }).pipe(
            catchError((error) => {
                console.error(`Error fetching video details for ID ${videoId}:`, error);
                if (error.status === 400) {
                    console.warn(`Vimeo API returned 400 Bad Request for video ID ${videoId}. This may indicate an invalid video ID or restricted access.`);
                } else if (error.status === 401 || error.status === 403) {
                    console.warn(`Vimeo API returned ${error.status} for video ID ${videoId}. This may indicate an authentication or authorization issue.`);
                }
                return throwError(() => new Error(`Failed to fetch video details from Vimeo for ID ${videoId}: ${error.message || 'Unknown error'}`));
            }),
        );
    }

    /**
     * Get direct video URL for playback (always returns highest quality)
     * @param videoId - Vimeo video ID (numeric)
     */
    getVideoUrl(videoId: string): Observable<string> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/videos/${videoId}`, { headers }).pipe(
            map((response: any) => {
                // Get the highest quality progressive download URL
                const files = response.files || [];
                const progressiveFiles = files.filter((file: any) => file.type === 'video/mp4' && file.quality !== 'hls');

                // Sort by quality (get highest quality)
                progressiveFiles.sort((a: any, b: any) => b.height - a.height);

                if (progressiveFiles.length > 0) {
                    return progressiveFiles[0].link;
                }

                throw new Error('No playable video URL found');
            }),
            catchError((error) => {
                console.error('Error fetching video URL:', error);
                return throwError(() => new Error('Failed to get playable URL from Vimeo'));
            }),
        );
    }

    /**
     * Map Firebase Storage path to Vimeo video ID
     * @param category - lesson category
     * @param lang - language code
     * @param path - original path used in Firebase
     */
    mapPathToVimeoId(category: string, lang: string, path: string): Observable<string> {
        // Use the mapping service to get the Vimeo ID from Firestore
        return this.mappingService.getVimeoIdForPath(category, lang, path).pipe(
            switchMap((vimeoId) => {
                if (vimeoId) {
                    console.log(`Found mapping in Firestore for ${category}/${lang}/${path}: ${vimeoId}`);
                    return of(vimeoId);
                }

                // Fallback to hardcoded mappings during transition period
                const videoMap: Record<string, string> = {
                    // Format: `${category}/${lang}/${path}`: 'vimeoId'
                    'bb/en/BB Lesson 1': '1072835401',
                    'bb/en/BB Lesson 2': '1072835540',
                    'bb/en/BB Lesson 3': '1072835499',
                    'bb/en/BB Lesson 4': '1072835456',
                    'bb/en/BB Lesson 5': '1072835401',
                    'bb/en/BB Lesson 6': '1072835337',
                    'bb/en/BB Lesson 7': '1072835263',
                    'bb/en/BB Lesson 8': '1072835222',
                    'bb/ta/BB Lesson 1': '1072835401', // Tamil versions (using same IDs for demo)
                    'bb/ta/BB Lesson 2': '1072835540',
                    'bb/ta/BB Lesson 3': '1072835499',
                    'bb/ta/BB Lesson 4': '1072835456',
                    'bb/ta/BB Lesson 5': '1072835401',
                    'bb/ta/BB Lesson 6': '1072835337',
                    'bb/ta/BB Lesson 7': '1072835263',
                    'bb/ta/BB Lesson 8': '1072835222',
                    // Add more mappings as needed
                };

                const key = `${category}/${lang}/${path}`;
                const hardcodedId = videoMap[key];

                if (hardcodedId) {
                    console.log(`Found hardcoded mapping for ${key}: ${hardcodedId}`);

                    // Also add this mapping to Firestore for future use
                    this.createMappingInFirestore(category, lang, path, hardcodedId);

                    return of(hardcodedId);
                }

                // If no mapping exists, return an error
                return throwError(() => new Error(`No Vimeo ID mapping found for: ${key}`));
            }),
        );
    }

    /**
     * Helper method to create a mapping in Firestore
     * This is used to migrate hardcoded mappings to Firestore
     */
    private createMappingInFirestore(category: string, lang: string, path: string, vimeoId: string): void {
        const firebasePath = `${category}/${lang}/${path}`;

        // Create a simple mapping object
        const mapping = {
            firebasePath: firebasePath,
            vimeoId: vimeoId,
            title: path, // Use path as title for now
            description: `Auto-migrated from hardcoded mapping for ${firebasePath}`,
        };

        // Add the mapping to Firestore (ignoring result)
        this.mappingService.addMapping(mapping).subscribe({
            next: (id) => console.log(`Created Firestore mapping with ID: ${id}`),
            error: (err) => console.error('Failed to create Firestore mapping:', err),
        });
    }

    /**
     * Get auth headers for Vimeo API requests
     */
    private getAuthHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
        });
    }
}
