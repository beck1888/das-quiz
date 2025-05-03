import { useState } from 'react';
import { Answer } from '@/types/quiz';

interface QuizSummaryProps {
  answers: Answer[];
  numQuestions: number;
  previousScores: number[];
  attempt: number;
  onRetry: () => void;
  onNewQuiz: () => void;
  quizTopic?: string; // Added to display quiz name
  quizDifficulty?: string; // Added to display quiz difficulty
}

export default function QuizSummary({ 
  answers, 
  numQuestions, 
  previousScores, 
  attempt,
  quizTopic = 'Quiz', // Default value
  quizDifficulty
}: QuizSummaryProps) {
  const score = answers.filter(a => a.isCorrect && a.attempt === attempt).length;
  const previousScore = previousScores.length > 0 ? previousScores[previousScores.length - 1] : null;
  const scorePercentage = (score / numQuestions) * 100;
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

  const formattedTopic = quizTopic.charAt(0).toUpperCase() + quizTopic.slice(1);
  const quizTitle = quizDifficulty 
    ? `${formattedTopic} (${quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1)})`
    : formattedTopic;
  const showTitle = quizTopic !== 'Unknown';

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 p-4 bg-black relative">
      <div className="w-full max-w-4xl space-y-8 card p-10 rounded-xl"> {/* Increased width from 3xl to 4xl */}
        <div>
          <h2 className="text-4xl font-bold text-center mb-2">Quiz Summary</h2> {/* Increased font size */}
          {showTitle && <h3 className="text-xl text-center text-blue-400 mb-8">{quizTitle}</h3>} {/* Only show when not Unknown */}
        </div>
        
        <div className="flex items-center justify-between mb-8 hide-selection"> {/* Increased margin */}
          {/* Score Ring */}
          <div className="relative w-40 h-40"> {/* Increased size */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="74"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                className="text-gray-800"
              />
              <circle
                cx="80"
                cy="80"
                r="74"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 74}`}
                strokeDashoffset={`${2 * Math.PI * 74 * (1 - scorePercentage / 100)}`}
                className="text-blue-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{Math.round(scorePercentage)}%</span> {/* Increased font size */}
            </div>
          </div>

          {/* Score History */}
          <div className="flex-1 ml-10"> {/* Increased margin */}
            <div className="text-2xl"> {/* Increased font size */}
              <div>Score: {score}/{numQuestions}</div>
              <div className="text-base text-gray-400 mt-3"> {/* Increased size */}
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

        <div className="flex w-full border-b border-gray-800 mb-8 hide-selection"> {/* Increased margin */}
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
      </div>
    </div>
  );
}