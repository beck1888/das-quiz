export interface QuizQuestion {
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
}

export interface Quiz {
  topic: string;
  questions: QuizQuestion[];
}
