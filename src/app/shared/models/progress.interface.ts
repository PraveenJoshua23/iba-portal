export interface IProgress {
    email: string,
    classId: string,
    userId: string,
    categoryProgress: CategoryProgress[]
}

export interface CategoryProgress {
    categoryName: "BB" | "Introductory" | "Intermediate" | "Advanced",
    lessons: LessonsProgress[] 
}

export interface LessonsProgress {
    id: string,
    name: string,
    lessonNo: string,
    watchDuration: number,
    completed: boolean,
    locked: boolean,
    startDate: Date,
    completedDate: Date,
    postQuizId: string
}