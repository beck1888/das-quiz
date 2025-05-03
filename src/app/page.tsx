'use client';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, Question } from '@/types/quiz';
import QuizForm from '@/components/QuizForm';
import QuizQuestion from '@/components/QuizQuestion';
import QuizSummary from '@/components/QuizSummary';
import Lottie from 'lottie-react';
import loaderAnimation from '../../public/animations/loader.json';
import Settings from '@/components/Settings';

interface Config {
  settings: {
    questions: {
      default: number;
      min: number;
      max: number;
    };
    defaults: {
      difficulty: string;
    };
    difficulties: { id: string; label: string }[];
  };
}

interface Answer {
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  skipped: boolean;
  attempt: number;
}

export default function Home() {
  const [config, setConfig] = useState<Config | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(1);
  const [previousScores, setPreviousScores] = useState<number[]>([]);
  const [savedQuiz, setSavedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    fetch('/data/configs.json')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
      });
  }, []);

  const generateQuiz = async (topic: string, numQuestions: number, difficulty: string) => {
    setAnswers([]);
    setShowSummary(false);
    setLoading(true);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, numQuestions, difficulty }),
      });
      const data = await response.json();
      setQuiz(data.quiz);
      setSavedQuiz(data.quiz);
      setCurrentQuestion(0);
      if (data.quiz?.questions[0]) {
        setShuffledAnswers(shuffleAnswers(data.quiz.questions[0]));
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    }
    setLoading(false);
  };

  const shuffleAnswers = (question: Question) => {
    const answers = [...question.incorrectAnswers, question.correctAnswer];
    return answers.sort(() => Math.random() - 0.5);
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQ = quiz!.questions[currentQuestion];
    const isCorrect = answer === currentQ.correctAnswer;

    const audio = new Audio(isCorrect ? '/sounds/right.mp3' : '/sounds/wrong.mp3');
    audio.play();

    setAnswers(prev => [...prev, {
      question: currentQ.question,
      userAnswer: answer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      skipped: false,
      attempt
    }]);
    setSelectedAnswer(answer);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      const currentQ = quiz!.questions[currentQuestion];
      setAnswers(prev => [...prev, {
        question: currentQ.question,
        userAnswer: null,
        correctAnswer: currentQ.correctAnswer,
        isCorrect: false,
        skipped: true,
        attempt
      }]);
    }
    if (currentQuestion < quiz!.questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setShuffledAnswers(shuffleAnswers(quiz!.questions[nextQuestion]));
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setShowSummary(true);
    }
  };

  const retryQuiz = () => {
    const currentScore = answers.filter(a => a.isCorrect).length;
    setPreviousScores(prev => [...prev, currentScore]);
    setQuiz(savedQuiz);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setShowSummary(false);
    setAnswers([]);
    setAttempt(prev => prev + 1);
    if (savedQuiz?.questions[0]) {
      setShuffledAnswers(shuffleAnswers(savedQuiz.questions[0]));
    }
  };

  const startNewQuiz = () => {
    setQuiz(null);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setShowSummary(false);
    setAnswers([]);
    setCurrentQuestion(0);
    setAttempt(1);
    setPreviousScores([]);
    setSavedQuiz(null);
  };

  useEffect(() => {
    if (showSummary) {
      const audio = new Audio('/sounds/level-up.mp3');
      audio.play();

      const score = answers.filter(a => a.isCorrect && a.attempt === attempt).length;
      const totalQuestions = quiz!.questions.length;
      const scorePercentage = (score / totalQuestions) * 100;

      if (scorePercentage > 0) {
        const defaults = {
          spread: 360,
          ticks: 200,
          gravity: 0.5,
          decay: 0.94,
          startVelocity: 30,
          colors: ['#5D8C7B', '#F2D091', '#F2A679', '#D9695F', '#8C4646'],
          origin: { y: -0.1, x: 0.5 }
        };

        function shoot() {
          confetti({
            ...defaults,
            particleCount: 50,
            scalar: 1.2,
            shapes: ['circle', 'square'],
            zIndex: 100,
          });
        }

        setTimeout(shoot, 0);
        setTimeout(shoot, 200);
        setTimeout(shoot, 400);
      }
    }
  }, [showSummary, answers, attempt, quiz]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative">
        <Settings />
        <div className="text-center space-y-4 p-8 rounded-xl">
        <p className="text-4xl text-white font-bold">Generating your quiz...</p>
          <div className="w-80 h-80 mx-auto">
            <Lottie animationData={loaderAnimation} loop={true} />
          </div>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <>
        <Settings />
        <QuizSummary
          answers={answers}
          numQuestions={quiz!.questions.length}
          previousScores={previousScores}
          attempt={attempt}
          onRetry={retryQuiz}
          onNewQuiz={startNewQuiz}
        />
      </>
    );
  }

  if (!quiz) {
    return (
      <>
        <Settings />
        <QuizForm onSubmit={generateQuiz} loading={loading} config={config} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative">
      <Settings />
      <QuizQuestion
        question={quiz.questions[currentQuestion]}
        currentQuestion={currentQuestion}
        numQuestions={quiz.questions.length}
        onAnswer={handleAnswerSelect}
        onNext={handleNext}
        showAnswer={showAnswer}
        selectedAnswer={selectedAnswer}
        shuffledAnswers={shuffledAnswers}
      />
    </div>
  );
}
