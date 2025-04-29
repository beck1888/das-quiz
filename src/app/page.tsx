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
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  const generateQuiz = async () => {
    setAnswers([]);
    setShowSummary(false);
    setLoading(true);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      setQuiz(data.quiz);
      setCurrentQuestion(0);
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
    setAnswers(prev => [...prev, {
      question: currentQ.question,
      userAnswer: answer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect: answer === currentQ.correctAnswer
    }]);
    setSelectedAnswer(answer);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentQuestion < 2) {
      setCurrentQuestion(curr => curr + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
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
            Your Score: {score}/3 ({Math.round((score/3) * 100)}%)
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
        <div className="space-y-4 w-full max-w-md glass p-8 rounded-xl">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic..."
            className="w-full p-3 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={generateQuiz}
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
            disabled={loading || !topic}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-2xl glass p-8 rounded-xl space-y-6">
        <h2 className="text-2xl font-bold text-center">Question {currentQuestion + 1}/3</h2>
        {quiz.questions && quiz.questions[currentQuestion] ? (
          <>
            <p className="text-xl mb-6">{quiz.questions[currentQuestion].question}</p>
            <div className="space-y-3">
              {shuffleAnswers(quiz.questions[currentQuestion]).map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(answer)}
                  disabled={showAnswer}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    showAnswer
                      ? answer === quiz.questions[currentQuestion].correctAnswer
                        ? 'bg-green-100 border-green-500'
                        : answer === selectedAnswer
                        ? 'bg-red-100 border-red-500'
                        : 'opacity-50'
                      : 'glass-tag hover:bg-opacity-40'
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
        {showAnswer && (
          <div className="space-y-4 mt-6">
            <p className={`text-lg font-semibold ${
              selectedAnswer === quiz.questions[currentQuestion].correctAnswer
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {selectedAnswer === quiz.questions[currentQuestion].correctAnswer
                ? 'Correct!'
                : 'Incorrect! The correct answer was: ' + quiz.questions[currentQuestion].correctAnswer}
            </p>
            <button
              onClick={handleNext}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {currentQuestion < 2 ? 'Next Question' : 'Show Summary'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
