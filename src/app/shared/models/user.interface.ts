export interface IUser{
    id: string,
    name: string,
    classId: string,
    networker: string,
    instructor: string,
    language: string,
    userDetails: IUserDetails,
    email: string
}

export interface IUserDetails {
    age: string,
    dob: string,
    phone: string,
    religion: string,
    faith: string,
    occupation: string,
    gender: "Male" | "Female",
    marital: "Single" | "Married" | "Other",
    whyApply: string,
    linkFrom: string,
    studying: string
}