import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ProfileService {
    private storage = inject(Storage);

    constructor() {}

    /**
     * Initialize profile for a new user with default profile picture
     * @param email User's email
     * @returns Observable with success status and URL
     */
    initializeUserProfile(email: string): Observable<{ success: boolean; profileUrl?: string }> {
        if (!email) {
            console.error('Cannot initialize profile: No email provided');
            return of({ success: false });
        }

        // Path to default profile image in assets
        const defaultImagePath = 'assets/images/default-profile.png';

        // Fetch the default image as a blob
        return from(
            fetch(defaultImagePath)
                .then((response) => response.blob())
                .then((blob) => {
                    // Create reference to user's profile directory
                    const profilePath = `profile/${email}/profile`;
                    const storageRef = ref(this.storage, profilePath);

                    // Upload the default image
                    return uploadBytes(storageRef, blob);
                })
                .then((snapshot) => {
                    // Get download URL for the uploaded image
                    return getDownloadURL(snapshot.ref);
                })
                .then((downloadURL) => {
                    console.log('Profile initialized successfully:', downloadURL);
                    return { success: true, profileUrl: downloadURL };
                }),
        ).pipe(
            catchError((error) => {
                console.error('Error initializing profile:', error);
                return of({ success: false });
            }),
        );
    }

    /**
     * Check if user profile directory exists
     * @param email User's email
     * @returns Observable boolean indicating if profile exists
     */
    checkProfileExists(email: string): Observable<boolean> {
        if (!email) return of(false);

        const profilePath = `profile/${email}/profile`;
        const storageRef = ref(this.storage, profilePath);

        return from(getDownloadURL(storageRef)).pipe(
            map(() => true), // If URL retrieval succeeds, profile exists
            catchError(() => of(false)), // If error occurs, profile doesn't exist
        );
    }
}
