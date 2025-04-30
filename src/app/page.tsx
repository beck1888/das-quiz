'use client';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, Question } from '@/types/quiz';
import Select from '@/components/Select';
import Lottie from 'lottie-react';
import loaderAnimation from '../../public/animations/loader.json';
import Image from 'next/image';

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
  attempt: number;  // Add attempt number
}

export default function Home() {
  const [config, setConfig] = useState<Config | null>(null);
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState('medium');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [previousScores, setPreviousScores] = useState<number[]>([]);
  const [savedQuiz, setSavedQuiz] = useState<Quiz | null>(null);
  // Removed unused showConfetti state

  useEffect(() => {
    // Load configuration when component mounts
    fetch('/data/configs.json')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setNumQuestions(data.settings.questions.default);
        setDifficulty(data.settings.defaults.difficulty);
      });
  }, []);

  const generateQuiz = async () => {
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
      setSavedQuiz(data.quiz); // Save the quiz for retries
      setCurrentQuestion(0);
      // Shuffle answers for the first question
      if (data.quiz?.questions[0]) {
        setShuffledAnswers(shuffleAnswers(data.quiz.questions[0]));
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateQuiz();
  };

  const shuffleAnswers = (question: Question) => {
    const answers = [...question.incorrectAnswers, question.correctAnswer];
    return answers.sort(() => Math.random() - 0.5);
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQ = quiz!.questions[currentQuestion];
    const isCorrect = answer === currentQ.correctAnswer;

    // Load and play sound dynamically
    const audio = new Audio(isCorrect ? '/sounds/right.mp3' : '/sounds/wrong.mp3');
    audio.play();

    setAnswers(prev => [...prev, {
      question: currentQ.question,
      userAnswer: answer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      skipped: false,
      attempt: attempt  // Add attempt number
    }]);
    setSelectedAnswer(answer);
    setShowAnswer(true);
  };

  const getExplanation = async () => {
    setLoadingExplanation(true);
    try {
      const currentQ = quiz!.questions[currentQuestion];
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          correctAnswer: currentQ.correctAnswer,
          userAnswer: selectedAnswer,
        }),
      });
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Failed to get explanation:', error);
    }
    setLoadingExplanation(false);
  };

  const getHint = async () => {
    setLoadingHint(true);
    try {
      const currentQ = quiz!.questions[currentQuestion];
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          correctAnswer: currentQ.correctAnswer,
        }),
      });
      const data = await response.json();
      setHint(data.hint);
    } catch (error) {
      console.error('Failed to get hint:', error);
    }
    setLoadingHint(false);
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      // If no answer selected, mark as skipped
      const currentQ = quiz!.questions[currentQuestion];
      setAnswers(prev => [...prev, {
        question: currentQ.question,
        userAnswer: null,
        correctAnswer: currentQ.correctAnswer,
        isCorrect: false,
        skipped: true,
        attempt: attempt  // Add attempt number
      }]);
    }
    if (currentQuestion < numQuestions - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      // Shuffle answers for the next question
      setShuffledAnswers(shuffleAnswers(quiz!.questions[nextQuestion]));
      setSelectedAnswer(null);
      setShowAnswer(false);
      setExplanation(null);
      setHint(null);
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
    setExplanation(null);
    setHint(null);
    setAttempt(prev => prev + 1);
    // Shuffle answers for the first question
    if (savedQuiz?.questions[0]) {
      setShuffledAnswers(shuffleAnswers(savedQuiz.questions[0]));
    }
  };

  const startNewQuiz = () => {
    setQuiz(null);
    setTopic('');
    setSelectedAnswer(null);
    setShowAnswer(false);
    setShowSummary(false);
    setAnswers([]);
    setCurrentQuestion(0);
    setFilter('all');
    setAttempt(1);
    setPreviousScores([]);
    setSavedQuiz(null);
  };

  useEffect(() => {
    if (showSummary) {
      // Play level-up sound
      const audio = new Audio('/sounds/level-up.mp3');
      audio.play();

      const score = answers.filter(a => a.isCorrect && a.attempt === attempt).length;
      const totalQuestions = numQuestions;  // Changed from totalAnswered
      const scorePercentage = (score / totalQuestions) * 100;  // Use totalQuestions instead

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
  }, [showSummary, answers, attempt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4 p-8 rounded-xl">
          <div className="w-64 h-64 mx-auto">
            <Lottie animationData={loaderAnimation} loop={true} />
          </div>
          <p className="text-xl text-white">Generating your quiz...</p>
          <p className="text-gray-400">Please stay on this page.</p>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const score = answers.filter(a => a.isCorrect && a.attempt === attempt).length;
    const totalQuestions = numQuestions;  // Changed from totalAnswered
    const previousScore = previousScores.length > 0 ? previousScores[previousScores.length - 1] : null;
    const scorePercentage = (score / totalQuestions) * 100;  // Use totalQuestions instead

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black">
        <div className="w-full max-w-2xl space-y-6 card p-8 rounded-xl">
          <h2 className="text-3xl font-bold text-center mb-6">Quiz Summary</h2>
          
          <div className="flex items-center justify-between mb-6 hide-selection">
            {/* Score Ring */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-gray-800"
                />
                {/* Score circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 58}`}
                  strokeDashoffset={`${2 * Math.PI * 58 * (1 - scorePercentage / 100)}`}
                  className="text-blue-500 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(scorePercentage)}%</span>
              </div>
            </div>

            {/* Score History */}
            <div className="flex-1 ml-8">
              <div className="text-xl">
                <div>Score: {score}/{totalQuestions}</div>
                <div className="text-sm text-gray-400 mt-2">
                  {previousScore !== null ? (
                    <>
                      Previous: {previousScore}/{totalQuestions}
                      <span className={`ml-2 ${
                        previousScore < score ? "text-green-400" : 
                        previousScore > score ? "text-red-400" : 
                        previousScore === score ? "text-yellow-400" :
                        "text-gray-400"
                      }`}>
                        {previousScore < score ? "↑" : previousScore > score ? "↓" : "="}
                      </span>
                    </>
                  ) : (
                    "First Attempt"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rest of the existing summary content */}
          <div className="flex w-full border-b border-gray-800 mb-6 hide-selection">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium relative transition-colors duration-200 ${
                filter === 'all' 
                  ? 'text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400 after:transition-all after:duration-200' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-4 py-2 text-sm font-medium relative transition-colors duration-200 ${
                filter === 'correct'
                  ? 'text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Correct ({answers.filter(a => a.isCorrect).length})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-4 py-2 text-sm font-medium relative transition-colors duration-200 ${
                filter === 'incorrect'
                  ? 'text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Incorrect ({answers.filter(a => !a.isCorrect && !a.skipped).length})
            </button>
            <button
              onClick={() => setFilter('skipped')}
              className={`px-4 py-2 text-sm font-medium relative transition-colors duration-200 ${
                filter === 'skipped'
                  ? 'text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Skipped ({answers.filter(a => a.skipped).length})
            </button>
          </div>

          <div className="space-y-4">
            {(answers.filter(answer => {
              if (filter === 'all') return true;
              if (filter === 'correct') return answer.isCorrect;
              if (filter === 'incorrect') return !answer.isCorrect && !answer.skipped;
              if (filter === 'skipped') return answer.skipped;
              return false;
            }).length > 0) ? (
              answers.filter(answer => {
                if (filter === 'all') return true;
                if (filter === 'correct') return answer.isCorrect;
                if (filter === 'incorrect') return !answer.isCorrect && !answer.skipped;
                if (filter === 'skipped') return answer.skipped;
                return false;
              }).map((answer, index) => (
                <div 
                  key={index} 
                  className="card p-6 rounded-lg transition-all duration-200 transform motion-safe:animate-fadeIn"
                  style={{
                    animationFillMode: 'both',
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <p className="font-semibold select-text">{answer.question}</p>
                  {answer.skipped ? (
                    <p className="text-yellow-500 mt-2 unselectable">⚠︎ Skipped</p>
                  ) : (
                    <p className={`mt-2 ${answer.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                      {answer.isCorrect ? '✓' : '✗'}
                      <span className="select-text"> {answer.userAnswer}</span>
                    </p>
                  )}
                  {(!answer.isCorrect || answer.skipped) && (
                    <p className="mt-1 text-green-500">
                        <span className="unselectable">✓ </span>
                      <span className="select-text">{answer.correctAnswer}</span>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8 motion-safe:animate-fadeIn">
                {filter === 'correct' && 'No correct answers to show'}
                {filter === 'incorrect' && 'Hooray! No incorrect answers to show.'}
                {filter === 'skipped' && 'You didn\'t skip any questions.'}
                {filter === 'all' && 'No answers available.'}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={retryQuiz}
              className="flex-1 bg-primary text-white p-3 rounded transition-colors flex items-center justify-center gap-2 border border-white hover:bg-gray-600"
            >
              <Image
                src="/icons/static/redo.svg"
                alt="Retry"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              Try Again
            </button>
            <button
              onClick={startNewQuiz}
              className="flex-1 bg-white text-black p-3 rounded hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <Image
                src="/icons/static/plus.svg"
                alt="New Quiz"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              Make New Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black">
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md card p-8 rounded">
          <div className="space-y-2">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-400">
              Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic..."
              className="w-full p-3 bg-black border border-gray-800 rounded text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-400">
                Number of Questions
              </label>
              <Select
                // id="numQuestions"
                value={numQuestions}
                onChange={(value) => setNumQuestions(Number(value))}
                options={
                  config
                    ? [...Array(config.settings.questions.max - config.settings.questions.min + 1)].map((_, i) => ({
                        value: i + config.settings.questions.min,
                        label: `${i + config.settings.questions.min} Questions`
                      }))
                    : []
                }
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-400">
                Difficulty
              </label>
              <Select
                // id="difficulty"
                value={difficulty}
                onChange={(value) => setDifficulty(value)}
                options={
                  config?.settings.difficulties.map((level: { id: string, label: string }) => ({
                    value: level.id,
                    label: level.label
                  })) || []
                }
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black p-3 rounded disabled:opacity-30 hover:opacity-90 transition-colors font-medium"
            disabled={loading || !topic || !config}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black unselectable">
      <div className="w-full max-w-2xl space-y-6 border border-white/20 rounded p-8">
        <h2 className="text-2xl font-bold text-center">Question {currentQuestion + 1}/{numQuestions}</h2>
        {quiz.questions && quiz.questions[currentQuestion] ? (
          <>
            <p className="text-xl mb-6 select-text">{quiz.questions[currentQuestion].question}</p>
            <div className="grid grid-cols-2 gap-3 unselectable">
              {shuffledAnswers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(answer)}
                  disabled={showAnswer}
                  className={`p-4 text-left rounded transition-colors border ${
                    showAnswer
                      ? answer === quiz.questions[currentQuestion].correctAnswer
                        ? 'bg-green-900/20 border-green-500 text-green-100 cursor-not-allowed'
                        : answer === selectedAnswer
                        ? 'bg-red-900/20 border-red-500 text-red-100 cursor-not-allowed'
                        : 'border-white/20 opacity-50 bg-black cursor-not-allowed'
                      : 'bg-black border-white/20 hover:bg-gray-800 active:bg-gray-700'
                  }`}
                >
                  {answer}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>Error loading question</p>
        )}

        <div className="flex justify-between">
          <button
            onClick={showAnswer ? getExplanation : getHint}
            disabled={showAnswer ? (loadingExplanation || !!explanation) : (loadingHint || !!hint)}
            className={`h-9 px-4 rounded border border-white/20 flex items-center justify-center gap-2 transition-all min-w-[100px] ${
              (!showAnswer && (!!hint || loadingHint)) || (showAnswer && (!!explanation || loadingExplanation))
                ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
                : 'hover:bg-white/5'
            }`}
            title={showAnswer ? "Get explanation" : "Get a hint"}
          >
            {showAnswer ? (
              loadingExplanation ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Image
                    src="/icons/outline/question-circle.svg"
                    alt="Explain"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">Explain</span>
                </>
              )
            ) : (
              loadingHint ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Image
                    src="/icons/outline/lightbulb.svg"
                    alt="Hint"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">Hint</span>
                </>
              )
            )}
          </button>
          <button
            onClick={handleNext}
            className={`h-9 px-4 rounded flex items-center justify-center gap-2 transition-all ml-auto min-w-[100px] ${
              showAnswer 
                ? 'bg-white text-black hover:opacity-90' 
                : 'border border-white/40 hover:bg-white/10'
            }`}
            title={showAnswer ? "Next question" : "Skip question"}
          >
            <Image
              src={`/icons/${showAnswer ? 'outline/check-square' : 'outline/x-square'}.svg`}
              alt={showAnswer ? "Next" : "Skip"}
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">{showAnswer ? 'Next' : 'Skip'}</span>
          </button>
        </div>

        {hint && !showAnswer && (
          <div className="card p-4 rounded mt-4 border border-white/60 shadow-[0_0_15px_-3px_rgba(255,255,255,0.1)]">
            <h3 className="font-medium text-sm text-gray-300 mb-2"><b>Hint</b></h3>
            <p className="text-sm text-gray-100">{hint}</p>
          </div>
        )}
        
        {showAnswer && (
          <div className="mt-4">
            {explanation ? (
              <div className="card p-4 rounded border border-white/60 shadow-[0_0_15px_-3px_rgba(255,255,255,0.1)]">
                <h3 className="font-medium text-sm text-gray-300 mb-2">Explanation</h3>
                <p className="text-sm text-gray-100">{explanation}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
