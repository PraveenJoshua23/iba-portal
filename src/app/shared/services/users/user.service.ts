import { Injectable, inject } from '@angular/core';
import { CollectionReference, Firestore, collection, doc, setDoc, getDoc, addDoc, query, where, getDocs, updateDoc, DocumentReference, DocumentData, deleteDoc } from '@angular/fire/firestore';
import { IUser } from '../../models/user.interface';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    usersRef!: CollectionReference;

    firestore = inject(Firestore);
    constructor() {
        this.usersRef = collection(this.firestore, 'users');
    }

    async addUser(newUser: IUser) {
        // Check if user with the same email already exists
        const q = query(this.usersRef, where('email', '==', newUser.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Handle duplicate email (e.g., show error message)
            console.error('User with this email already exists.');
            return; // Don't add the user
        }

        try {
            await addDoc(this.usersRef, newUser);
            console.log(`User ${newUser.name} added successfully.`);
            // Optionally, navigate to a success page or perform other actions
        } catch (error) {
            console.error(`Error adding user ${newUser.name}:`, error);
            // Handle error appropriately (e.g., show error message)
        }
    }

    async seedUsersToFirestore(users: IUser[]): Promise<void> {
        const userCollection = collection(this.firestore, 'users');

        for (const user of users) {
            try {
                await addDoc(userCollection, user);
                console.log(`User ${user.name} added successfully.`);
            } catch (error) {
                console.error(`Error adding user ${user.name}:`, error);
            }
        }
    }

    async updateUser(updatedUser: any | IUser): Promise<void> {
        try {
            // Assuming your IUser object has an 'id' property
            const userDocRef = doc(this.firestore, 'users', updatedUser.id);

            // Update the document in Firestore
            await updateDoc(userDocRef, updatedUser);
            console.log(`User ${updatedUser.name} updated successfully.`);
        } catch (error) {
            console.error(`Error updating user ${updatedUser.name}:`, error);
        }
    }

    async deleteUser(userId: string): Promise<void> {
        try {
            const userDocRef = doc(this.firestore, 'users', userId);
            await deleteDoc(userDocRef);
            console.log(`User with ID ${userId} deleted successfully.`);
        } catch (error) {
            console.error(`Error deleting user with ID ${userId}:`, error);
            throw error; // Rethrow to handle in the component
        }
    }
}
