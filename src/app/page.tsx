'use client';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, Question } from '@/types/quiz';
import Select from '@/components/Select';
import Lottie from 'lottie-react';
import loaderAnimation from '../../public/animations/loader.json';

interface Answer {
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  skipped: boolean;
  attempt: number;  // Add attempt number
}

export default function Home() {
  const [config, setConfig] = useState<any>(null);
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
  const [showConfetti, setShowConfetti] = useState(false);

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
    setAnswers(prev => [...prev, {
      question: currentQ.question,
      userAnswer: answer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect: answer === currentQ.correctAnswer,
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
      const score = answers.filter(a => a.isCorrect && a.attempt === attempt).length;
      const totalAnswered = answers.filter(a => !a.skipped && a.attempt === attempt).length;
      const scorePercentage = totalAnswered > 0 ? (score/totalAnswered) * 100 : 0;
      
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4 glass p-8 rounded-xl">
          <div className="w-64 h-64 mx-auto">
            <Lottie animationData={loaderAnimation} loop={true} />
          </div>
          <p className="text-xl">Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const score = answers.filter(a => a.isCorrect && a.attempt === attempt).length;
    const totalAnswered = answers.filter(a => !a.skipped && a.attempt === attempt).length;
    const previousScore = previousScores.length > 0 ? previousScores[previousScores.length - 1] : null;
    const scorePercentage = totalAnswered > 0 ? (score/totalAnswered) * 100 : 0;
    const showConfetti = scorePercentage >= 75;
    const filteredAnswers = answers.filter(answer => {
      const matchesAttempt = answer.attempt === attempt;
      if (!matchesAttempt) return false;
      if (filter === 'correct') return answer.isCorrect;
      if (filter === 'incorrect') return !answer.isCorrect && !answer.skipped;
      if (filter === 'skipped') return answer.skipped;
      return true;
    });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="w-full max-w-2xl space-y-6 glass p-8 rounded-xl">
          <h2 className="text-3xl font-bold text-center mb-6">Quiz Summary</h2>
          <div className="text-xl text-center mb-6 hide-selection">
            <div>Attempt #{attempt}</div>
            <div>Current Score: {score}/{totalAnswered} ({totalAnswered > 0 ? Math.round((score/totalAnswered) * 100) : 0}%)</div>
            {previousScore !== null && (
              <div className="text-sm text-gray-600 mt-1">
                Previous Score: {previousScore}/{totalAnswered} ({Math.round((previousScore/totalAnswered) * 100)}%)
                <span className={previousScore < score ? " text-green-600" : previousScore > score ? " text-red-600" : ""}>
                  {previousScore < score ? " ↑" : previousScore > score ? " ↓" : " ="}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mb-6 flex-wrap hide-selection">
            <button
              onClick={() => setFilter('all')}
              className={`glass-tag px-4 py-2 rounded-full ${filter === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`glass-tag px-4 py-2 rounded-full ${filter === 'correct' ? 'active' : ''}`}
            >
              Correct ({answers.filter(a => a.isCorrect).length})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`glass-tag px-4 py-2 rounded-full ${filter === 'incorrect' ? 'active' : ''}`}
            >
              Incorrect ({answers.filter(a => !a.isCorrect && !a.skipped).length})
            </button>
            <button
              onClick={() => setFilter('skipped')}
              className={`glass-tag px-4 py-2 rounded-full ${filter === 'skipped' ? 'active' : ''}`}
            >
              Skipped ({answers.filter(a => a.skipped).length})
            </button>
          </div>

          <div className="space-y-4">
            {filteredAnswers.length > 0 ? (
              filteredAnswers.map((answer, index) => (
                <div key={index} className="glass p-6 rounded-lg">
                  <p className="font-semibold select-text">{index + 1}. {answer.question}</p>
                  {answer.skipped ? (
                    <p className="text-gray-600 mt-2 unselectable">Skipped</p>
                  ) : (
                    <p className="mt-2">
                      <strong className="unselectable">You said: </strong>
                      <span className="select-text">{answer.userAnswer}</span>
                    </p>
                  )}
                  {(!answer.isCorrect || answer.skipped) && (
                    <p className="mt-1">
                      <strong className="unselectable">Answer: </strong>
                      <span className="select-text">{answer.correctAnswer}</span>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                {filter === 'correct' && 'No correct answers to show'}
                {filter === 'incorrect' && 'Horray! No incorrect answers to show.'}
                {filter === 'skipped' && 'You didn\'t skip any questions.'}
                {filter === 'all' && 'No answers available.'}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={retryQuiz}
              className="flex-1 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <img
                src="/icons/static/redo.svg"
                alt="Retry"
                className="w-5 h-5"
              />
              Try Again
            </button>
            <button
              onClick={startNewQuiz}
              className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <img
                src="/icons/static/plus.svg"
                alt="New Quiz"
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md glass p-8 rounded-xl">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic..."
            className="w-full p-3 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 select-none"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
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
            <Select
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
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
            disabled={loading || !topic || !config}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 unselectable">
      <div className="w-full max-w-2xl glass p-8 rounded-xl space-y-6">
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
                  className={`p-4 text-left rounded-lg transition-colors border-2 h-full ${
                    showAnswer
                      ? answer === quiz.questions[currentQuestion].correctAnswer
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : answer === selectedAnswer
                        ? 'bg-red-100 border-red-500 text-red-700'
                        : 'border-gray-300 opacity-50'
                      : 'glass-tag border-gray-300 hover:bg-white/40 hover:border-gray-400 active:bg-white/50'
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

        {(
          <div className="flex justify-between">
            <button
              onClick={showAnswer ? getExplanation : getHint}
              disabled={showAnswer ? (loadingExplanation || !!explanation) : (loadingHint || !!hint)}
              className="h-9 px-4 rounded-lg border-2 border-black flex items-center justify-center gap-2 hover:bg-black/5 transition-all group"
              title={showAnswer ? "Get explanation" : "Get a hint"}
            >
              {showAnswer ? (
                loadingExplanation ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <img
                      src="/icons/outline/question-circle.svg"
                      alt="Explain"
                      className="w-5 h-5 group-hover:hidden"
                    />
                    <img
                      src="/icons/fill/question-circle.svg"
                      alt="Explain"
                      className="w-5 h-5 hidden group-hover:block"
                    />
                    <span className="text-sm font-medium">Explain</span>
                  </>
                )
              ) : (
                loadingHint ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <img
                      src="/icons/outline/lightbulb.svg"
                      alt="Hint"
                      className="w-5 h-5 group-hover:hidden"
                    />
                    <img
                      src="/icons/fill/lightbulb.svg"
                      alt="Hint"
                      className="w-5 h-5 hidden group-hover:block"
                    />
                    <span className="text-sm font-medium">Hint</span>
                  </>
                )
              )}
            </button>
            <button
              onClick={handleNext}
              className={`h-9 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all group ml-auto ${
                showAnswer 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white border-transparent' 
                  : 'border-black hover:bg-black/5'
              }`}
              title={showAnswer ? "Next question" : "Skip question"}
            >
              <img
                src={`/icons/${showAnswer ? 'outline/check-square' : 'outline/x-square'}.svg`}
                alt={showAnswer ? "Next" : "Skip"}
                className="w-5 h-5 group-hover:hidden"
              />
              <img
                src={`/icons/${showAnswer ? 'fill/check-square' : 'fill/x-square'}.svg`}
                alt={showAnswer ? "Next" : "Skip"}
                className="w-5 h-5 hidden group-hover:block"
              />
              <span className="text-sm font-medium">{showAnswer ? 'Next' : 'Skip'}</span>
            </button>
          </div>
        )}

        {hint && !showAnswer && (
          <div className="glass p-4 rounded-lg mt-4">
            <h3 className="font-bold mb-2">Hint:</h3>
            <p>{hint}</p>
          </div>
        )}
        
        {showAnswer && (
          <div className="space-y-4 mt-6">
            {explanation ? (
              <div className="glass p-4 rounded-lg mb-3">
                <h3 className="font-bold mb-2">Explanation:</h3>
                <p>{explanation}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
