import { IQuiz } from './quiz.interface';

export interface ILesson {
    id: string;
    name: string;
    description: string;
    lessonNo: string;
    vimeoIds?: {
        [language: string]: string; // e.g., 'en': '1072835401', 'ta': '1072835456'
    };
    category: 'bb' | 'intro' | 'intermediate' | 'advanced';
    path: string;
    language: string;
    instructor: string;
    quiz: IQuiz[];
}
