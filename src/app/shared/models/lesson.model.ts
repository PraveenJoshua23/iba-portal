export interface Lesson {
    id: string;
    title: string;
    description: string;
    category: 'bb' | 'intro' | 'intermediate' | 'advanced';
    path: string;
    language: string;
    quiz: Quiz[]
  }

export interface Quiz {
  question: string[];
  choices: string[]
  correctAnswer: string
}