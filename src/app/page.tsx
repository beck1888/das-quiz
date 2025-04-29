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
      setQuiz(data.quiz); // Update this line to access the quiz property
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl">Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const score = answers.filter(a => a.isCorrect).length;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold text-center mb-6">Quiz Summary</h2>
          <div className="text-xl text-center mb-6">
            Your Score: {score}/3 ({Math.round((score/3) * 100)}%)
          </div>
          <div className="space-y-4">
            {answers.map((answer, index) => (
              <div key={index} className="border rounded p-4">
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
            className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 mt-6"
          >
            Start New Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {!quiz ? (
        <div className="space-y-4 w-full max-w-md">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic..."
            className="w-full p-2 border rounded"
          />
          <button
            onClick={generateQuiz}
            disabled={loading || !topic}
            className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-4">
          <h2 className="text-2xl font-bold">Question {currentQuestion + 1}/3</h2>
          {quiz.questions && quiz.questions[currentQuestion] ? (
            <>
              <p className="text-xl">{quiz.questions[currentQuestion].question}</p>
              <div className="space-y-2">
                {shuffleAnswers(quiz.questions[currentQuestion]).map((answer, index) => (
                  <button
                    key={index}
                    disabled={showAnswer}
                    onClick={() => handleAnswerSelect(answer)}
                    className={`w-full p-2 text-left border rounded ${
                      showAnswer
                        ? answer === quiz.questions[currentQuestion].correctAnswer
                          ? 'bg-green-100 border-green-500'
                          : answer === selectedAnswer
                          ? 'bg-red-100 border-red-500'
                          : 'opacity-50'
                        : 'hover:bg-gray-100'
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
            <div className="space-y-4">
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
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                {currentQuestion < 2 ? 'Next Question' : 'Show Summary'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
