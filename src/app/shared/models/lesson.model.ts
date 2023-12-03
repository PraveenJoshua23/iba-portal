export interface Lesson {
    id: string;
    title: string;
    description: string;
    category: 'bb' | 'intro' | 'intermediate' | 'advanced';
    path: string;
  }