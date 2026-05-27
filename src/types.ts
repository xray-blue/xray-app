export interface ViewImages {
    reference: string;
    xray: string;
}

export type Views = Record<string, ViewImages>;
export type RadiographData = Record<string, Views>;

export interface QuizQuestion {
    id: string;
    bodyPart: string;
    view: string;
    customImage?: string; // Used if they upload their own
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
}

export interface QuizSettings {
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    questionCount: number;
    studentNameRequired: boolean;
}

export interface Quiz {
    id: string;
    title: string;
    questions: QuizQuestion[];
    settings: QuizSettings;
}
