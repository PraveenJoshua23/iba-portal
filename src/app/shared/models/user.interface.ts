export interface IUser {
    id: string;
    role: 'admin' | 'student' | 'instructor';
    name: string;
    classId: string;
    networker: string;
    instructor: string;
    language: string;
    userDetails: IUserDetails;
    email: string;
}

export interface IUserDetails {
    age: string;
    dob: string;
    phone: string;
    religion: string;
    occupation: string;
    gender: 'Male' | 'Female';
    marital: 'Single' | 'Married' | 'Other';
    whyApply: string;
    studying: string;
}
