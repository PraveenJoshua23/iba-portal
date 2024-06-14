export interface ILesson{
    id: string;
    name: string;
    title: string;
    description: string;
    category: 'bb' | 'intro' | 'intermediate' | 'advanced';
    path: string;
    language: string;
    instructor: string;
}