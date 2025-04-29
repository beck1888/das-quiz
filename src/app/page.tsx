'use client';
import { useState } from 'react';
import { Quiz, Question } from '@/types/quiz';

interface Answer {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function Home() {
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
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

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
      isCorrect: answer === currentQ.correctAnswer
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

  const startNewQuiz = () => {
    setQuiz(null);
    setTopic('');
    setSelectedAnswer(null);
    setShowAnswer(false);
    setShowSummary(false);
    setAnswers([]);
    setCurrentQuestion(0);
    setFilter('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4 glass p-8 rounded-xl">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl">Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const score = answers.filter(a => a.isCorrect).length;
    const filteredAnswers = answers.filter(answer => {
      if (filter === 'correct') return answer.isCorrect;
      if (filter === 'incorrect') return !answer.isCorrect;
      return true;
    });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="w-full max-w-2xl space-y-6 glass p-8 rounded-xl">
          <h2 className="text-3xl font-bold text-center mb-6">Quiz Summary</h2>
          <div className="text-xl text-center mb-6">
            Your Score: {score}/{numQuestions} ({Math.round((score/numQuestions) * 100)}%)
          </div>
          
          <div className="flex gap-3 mb-6">
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
              Incorrect ({answers.filter(a => !a.isCorrect).length})
            </button>
          </div>

          <div className="space-y-4">
            {filteredAnswers.map((answer, index) => (
              <div key={index} className="glass p-6 rounded-lg">
                <p className="font-semibold">{index + 1}. {answer.question}</p>
                <p className={`mt-2 ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  Your answer: {answer.userAnswer}
                </p>
                {!answer.isCorrect && (
                  <p className="text-green-600 mt-1">
                    Correct answer: {answer.correctAnswer}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={startNewQuiz}
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 mt-6 transition-colors"
          >
            Start New Quiz
          </button>
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
            className="w-full p-3 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full p-3 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num} Questions</option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-3 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['easy', 'medium', 'hard', 'expert'].map(level => (
                <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
            disabled={loading || !topic}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-2xl glass p-8 rounded-xl space-y-6">
        <h2 className="text-2xl font-bold text-center">Question {currentQuestion + 1}/{numQuestions}</h2>
        {quiz.questions && quiz.questions[currentQuestion] ? (
          <>
            <p className="text-xl mb-6">{quiz.questions[currentQuestion].question}</p>
            <div className="grid grid-cols-2 gap-3">
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

        {!showAnswer && !hint && (
          <button
            onClick={getHint}
            disabled={loadingHint}
            className="h-9 px-4 rounded-lg border-2 border-black flex items-center justify-center gap-2 hover:bg-black/5 transition-all group"
            title="Get a hint"
          >
            {loadingHint ? (
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
            )}
          </button>
        )}

        {hint && !showAnswer && (
          <div className="glass p-4 rounded-lg">
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
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={getExplanation}
                disabled={loadingExplanation || !!explanation}
                className="bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {loadingExplanation ? 'Getting Explanation...' : 'Explain Answer'}
              </button>
              <button
                onClick={handleNext}
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {currentQuestion < numQuestions - 1 ? 'Next Question' : 'Show Summary'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
