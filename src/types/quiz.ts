export interface Question {
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
}

export interface Quiz {
  questions: Question[];
}

export interface QuizStats {
  totalQuestions: number;
  grade: number;
  missedQuestions: Question[];
  correctQuestions: Question[];
}

export interface QuizResponse {
  quiz: Quiz;
  stats: QuizStats;
}
