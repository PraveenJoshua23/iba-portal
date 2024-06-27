export interface ILesson{
    id: string;
    name: string;
    description: string;
    lessonNo: string;
    category: 'bb' | 'intro' | 'intermediate' | 'advanced';
    path: string;
    language: string;
    instructor: string;
}