import { IQuiz } from './quiz.interface';

export interface ILesson {
    id: string;
    names?: Record<string, string>;
    descriptions?: Record<string, string>;
    lessonNo: string;
    vimeoIds?: Record<string, string>;
    category: 'bb' | 'intro' | 'intermediate' | 'advanced';
    path: string;
    language: string;
    instructor: string;
    quiz: IQuiz[];
}
