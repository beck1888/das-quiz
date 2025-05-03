'use client';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, Question, Answer } from '@/types/quiz';
import QuizForm from '@/components/QuizForm';
import QuizQuestion from '@/components/QuizQuestion';
import QuizSummary from '@/components/QuizSummary';
import Lottie from 'lottie-react';
import loaderAnimation from '../../public/animations/loader.json';
import { useSettings } from '@/stores/settings';
import { QuizDatabase } from '@/services/QuizDatabase';
import TopBar from '@/components/TopBar';

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

export default function Home() {
  const { isSoundEnabled } = useSettings();
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

  const quizDb = new QuizDatabase();
  
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
      // Add topic and difficulty to quiz object
      const quizWithMeta = {
        ...data.quiz,
        topic,
        difficulty
      };
      setQuiz(quizWithMeta);
      setSavedQuiz(quizWithMeta);
      setCurrentQuestion(0);
      if (quizWithMeta?.questions[0]) {
        setShuffledAnswers(quizWithMeta.questions[0].incorrectAnswers.concat(quizWithMeta.questions[0].correctAnswer).sort(() => Math.random() - 0.5));
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    }
    setLoading(false);
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQ = quiz!.questions[currentQuestion];
    const isCorrect = answer === currentQ.correctAnswer;

    if (isSoundEnabled) {
      const audio = new Audio(isCorrect ? '/sounds/right.mp3' : '/sounds/wrong.mp3');
      audio.play();
    }

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
      setShuffledAnswers(quiz!.questions[nextQuestion].incorrectAnswers.concat(quiz!.questions[nextQuestion].correctAnswer).sort(() => Math.random() - 0.5));
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
      setShuffledAnswers(savedQuiz.questions[0].incorrectAnswers.concat(savedQuiz.questions[0].correctAnswer).sort(() => Math.random() - 0.5));
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
    if (showSummary && quiz) {
      const score = answers.filter(a => a.isCorrect && a.attempt === attempt).length;
      
      // Map answers to include incorrectAnswers
      const answersWithOptions = answers.filter(a => a.attempt === attempt).map(answer => {
        const question = quiz.questions.find(q => q.question === answer.question);
        return {
          ...answer,
          incorrectAnswers: question ? question.incorrectAnswers : []
        };
      });

      // Check if we are replaying an existing quiz
      const storedQuizId = localStorage.getItem('currentQuizId');
      
      if (storedQuizId) {
        // We're replaying an existing quiz, update it instead of creating a new one
        const quizId = parseInt(storedQuizId);
        
        quizDb.updateQuizResult(quizId, {
          timestamp: Date.now(),
          score,
          answers: answersWithOptions,
          attempt
        }).then(() => {
          // Clear the stored ID after updating
          localStorage.removeItem('currentQuizId');
        }).catch(error => {
          console.error('Failed to update quiz:', error);
          // If update fails, create a new entry as fallback
          addNewQuizEntry(score, answersWithOptions);
        });
      } else {
        // This is a new quiz, create a new entry
        addNewQuizEntry(score, answersWithOptions);
      }

      if (isSoundEnabled) {
        const audio = new Audio('/sounds/level-up.mp3');
        audio.play();
      }

      const scorePercentage = (score / quiz.questions.length) * 100;

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
  }, [showSummary, answers, attempt, quiz, isSoundEnabled, quizDb]);

  // Helper function to add a new quiz entry
  const addNewQuizEntry = async (score: number, answersWithOptions: Array<Answer & { incorrectAnswers: string[] }>) => {
    // Get previous quiz result for the same topic if it exists
    const history = await quizDb.getQuizHistory();
    const lastQuiz = history.find(q => q.topic === quiz?.topic && q.difficulty === quiz?.difficulty);
    
    quizDb.addQuizResult({
      timestamp: Date.now(),
      topic: quiz?.topic || 'Unknown',
      difficulty: quiz?.difficulty || 'standard',
      score,
      lastScore: lastQuiz?.score,
      totalQuestions: quiz?.questions.length || 0,
      answers: answersWithOptions,
      attempt
    });
  };

  // Update clear data functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clearAllData = async () => {
    await quizDb.deleteAllHistory();
    localStorage.clear();
  };

  const handleViewQuiz = (quizAnswers: Answer[]) => {
    setAnswers(quizAnswers);
    setSavedQuiz(null);
    setShowSummary(true);
    setPreviousScores([]);
  };

  const handlePlayQuiz = (entry: { 
    id?: number,
    topic: string, 
    difficulty: string, 
    answers: {
      question: string,
      correctAnswer: string,
      incorrectAnswers: string[],
      userAnswer: string | null,
      isCorrect: boolean,
      skipped: boolean,
      attempt: number
    }[],
    totalQuestions: number,
    score: number
  }) => {
    // Store the quiz ID if it exists
    const quizId = entry.id;
    
    // Reconstruct quiz from history entry using stored incorrect answers
    const questions: Question[] = entry.answers.map(answer => ({
      question: answer.question,
      correctAnswer: answer.correctAnswer,
      incorrectAnswers: answer.incorrectAnswers
    }));

    const reconstructedQuiz: Quiz = {
      questions,
      topic: entry.topic,
      difficulty: entry.difficulty
    };

    // Set up quiz state with previous score
    setQuiz(reconstructedQuiz);
    setSavedQuiz(reconstructedQuiz);
    setAnswers([]);
    setShowSummary(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setPreviousScores([entry.score]); // Set the previous score
    setAttempt(1);
    
    // Store the original quiz ID to update it later
    if (quizId) {
      localStorage.setItem('currentQuizId', quizId.toString());
    }
    
    // Set up first question's shuffled answers
    if (reconstructedQuiz.questions[0]) {
      setShuffledAnswers(
        reconstructedQuiz.questions[0].incorrectAnswers
          .concat(reconstructedQuiz.questions[0].correctAnswer)
          .sort(() => Math.random() - 0.5)
      );
    }
  };

  return (
    <>
      <TopBar 
        onViewQuiz={handleViewQuiz} 
        onPlayQuiz={handlePlayQuiz} 
        onHomeClick={startNewQuiz} 
      />
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-black relative">
          <div className="text-center space-y-4 p-8 rounded-xl">
            <p className="text-4xl text-white font-bold">Generating your quiz...</p>
            <div className="w-80 h-80 mx-auto">
              <Lottie animationData={loaderAnimation} loop={true} />
            </div>
          </div>
        </div>
      ) : showSummary ? (
        <>
          <QuizSummary
            answers={answers}
            numQuestions={quiz ? quiz.questions.length : answers.length}
            previousScores={previousScores}
            attempt={attempt}
            onRetry={retryQuiz}
            onNewQuiz={startNewQuiz}
            quizTopic={quiz?.topic || 'Unknown'}
            quizDifficulty={quiz?.difficulty}
          />
        </>
      ) : !quiz ? (
        <>
          <QuizForm onSubmit={generateQuiz} loading={loading} config={config} />
        </>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative">
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
      )}
    </>
  );
}
