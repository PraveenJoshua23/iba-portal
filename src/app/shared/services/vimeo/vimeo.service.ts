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
                // If not found in Firestore, return an error observable
                const key = `${category}/${lang}/${path}`;
                console.error(`No Vimeo ID found in Firestore for ${key}`);
                return throwError(() => new Error(`No Vimeo ID mapping found for: ${key}`));
            }),
        );
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
