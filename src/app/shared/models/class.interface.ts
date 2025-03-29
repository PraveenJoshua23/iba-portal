export interface IClass {
    id: string;
    classId: string;
    instructor: string;
    networker: string;
    language: string;
    startDate?: string;
    endDate?: string;
    students?: IStudents[]
}

export interface IStudents {
    studentId: string,
    name: string
}