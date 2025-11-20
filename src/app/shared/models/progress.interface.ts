export interface IProgress {
    id: string;
    email: string;
    classId: string;
    userId: string;
    categoryProgress: CategoryProgress[];
}

export interface CategoryProgress {
    categoryName: 'BB' | 'Introductory' | 'Intermediate' | 'Advanced';
    progress: string | number;
    locked: boolean;
    languageProgress: Record<string, LanguageProgress>;
}

export interface LanguageProgress {
    progress: string;
    lessons: LessonsProgress[];
}

export interface LessonsProgress {
    id: string;
    name: string;
    lessonNo: string;
    watchDuration: number;
    progress: string;
    completed: boolean;
    locked: boolean;
    startDate: Timestamp | null;
    completedDate: Timestamp | null;
    postQuizId: string | null;
    quizAnswers: number[] | null; // New field to store quiz answers
}

export interface Timestamp {
    nanoseconds: number;
    seconds: number;
}
