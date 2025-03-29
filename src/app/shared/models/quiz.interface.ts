export interface IQuiz {
    question: string[];
    choices: string[];
    correctAnswer: string;
}

export interface IQuizResults {
    preQuiz: IQuiz[];
    postQuiz: IQuiz[];
}
