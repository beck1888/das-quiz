import { useState } from 'react';
import Image from 'next/image';
import { Answer } from '@/types/quiz';

interface QuizSummaryProps {
  answers: Answer[];
  numQuestions: number;
  previousScores: number[];
  attempt: number;
  onRetry: () => void;
  onNewQuiz: () => void;
}

export default function QuizSummary({ 
  answers, 
  numQuestions, 
  previousScores, 
  attempt,
  onRetry, 
  onNewQuiz 
}: QuizSummaryProps) {
  const score = answers.filter(a => a.isCorrect && a.attempt === attempt).length;
  const previousScore = previousScores.length > 0 ? previousScores[previousScores.length - 1] : null;
  const scorePercentage = (score / numQuestions) * 100;
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative">
      <div className="w-full max-w-2xl space-y-6 card p-8 rounded-xl">
        <h2 className="text-3xl font-bold text-center mb-6">Quiz Summary</h2>
        
        <div className="flex items-center justify-between mb-6 hide-selection">
          {/* Score Ring */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-800"
              />
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
              <div>Score: {score}/{numQuestions}</div>
              <div className="text-sm text-gray-400 mt-2">
                {previousScore !== null ? (
                  <>
                    Previous: {previousScore}/{numQuestions}
                    <span className={`ml-2 ${
                      previousScore < score ? "text-green-400" : 
                      previousScore > score ? "text-red-400" : 
                      "text-yellow-400"
                    }`}>
                      {previousScore < score ? "↑" : previousScore > score ? "↓" : "→"}
                    </span>
                  </>
                ) : (
                  "First Attempt"
                )}
              </div>
            </div>
          </div>
        </div>

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
                className="card p-6 rounded-lg transition-all duration-200 transform motion-safe:animate-fadeIn border-[3px] border-white/60"
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
            onClick={onRetry}
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
            onClick={onNewQuiz}
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