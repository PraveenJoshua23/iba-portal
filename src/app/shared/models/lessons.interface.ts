import { IQuiz } from './quiz.interface';

export interface ILesson {
    id: string;
    names?: {
        [language: string]: string; // e.g., 'en': 'Lesson 1', 'ta': 'பாடம் 1'
    };
    descriptions?: {
        [language: string]: string; // e.g., 'en': 'Description in English', 'ta': 'தமிழில் விளக்கம்'
    };
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
