export interface IUser {
    id: string;
    name: string;
    currentLesson: string;
    classNo: string;
    networker: string;
    details: UserDetails
    email: string;
}

export interface UserDetails {
    // name: string,
    age: number,
    dob: string,
    phone: string,
    email: string,
    religion: string,
    faith: string,
    occupation: string,
    gender: string,
    marital: string,
    language: string,
    whyApply: string,
    linkFrom: string,
    studying: string,
    networker: string
}