import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { QuizDatabase } from '@/services/QuizDatabase';
import { Quiz } from '@/types/quiz';

interface HistoryEntry {
  id?: number;
  timestamp: number;
  topic: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  answers: {
    question: string;
    userAnswer: string | null;
    correctAnswer: string;
    incorrectAnswers: string[];  // Added to match QuizDatabase interface
    isCorrect: boolean;
    skipped: boolean;
    attempt: number;
  }[];
  attempt: number;
}

interface HistoryProps {
  onViewQuiz: (answers: HistoryEntry['answers'], numQuestions: number) => void;
  onPlayQuiz: (entry: HistoryEntry) => void;
}

export default function History({ onViewQuiz, onPlayQuiz }: HistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<HistoryEntry | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const quizDb = new QuizDatabase();

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    const quizHistory = await quizDb.getQuizHistory();
    setHistory(quizHistory.sort((a, b) => b.timestamp - a.timestamp));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + 
           new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleView = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    onViewQuiz(entry.answers, entry.totalQuestions);
    setIsOpen(false);
  };

  const handlePlay = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayQuiz(entry);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-16 z-10 w-10 h-10 flex items-center justify-center outline-none"
      >
        <Image
          src="/icons/static/history.svg"
          alt="History"
          width={24}
          height={24}
          className="text-white hover:opacity-80 transition-opacity"
        />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-gray-900 p-6 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-100">Quiz History</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-800"
              >
                <Image
                  src="/icons/static/close.svg"
                  alt="Close"
                  width={24}
                  height={24}
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                      onClick={() => setSelectedQuiz(selectedQuiz?.id === entry.id ? null : entry)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-200">{entry.topic}</h3>
                          <p className="text-sm text-gray-400">{formatDate(entry.timestamp)}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => handleView(entry, e)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                            >
                              <Image
                                src="/icons/outline/question-circle.svg"
                                alt="View"
                                width={16}
                                height={16}
                              />
                              View
                            </button>
                            <button
                              onClick={(e) => handlePlay(entry, e)}
                              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                            >
                              <Image
                                src="/icons/outline/check-square.svg"
                                alt="Play"
                                width={16}
                                height={16}
                              />
                              Play
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-200">
                            {entry.score}/{entry.totalQuestions}
                            <span className="text-sm text-gray-400 ml-2">
                              ({Math.round((entry.score / entry.totalQuestions) * 100)}%)
                            </span>
                          </p>
                          <p className="text-sm text-gray-400">Difficulty: {entry.difficulty}</p>
                        </div>
                      </div>

                      {selectedQuiz?.id === entry.id && (
                        <div className="mt-4 space-y-3">
                          {entry.answers.map((answer, idx) => (
                            <div key={idx} className="border border-gray-700 rounded p-3 bg-gray-800/30">
                              <p className="font-medium text-gray-200">{answer.question}</p>
                              {answer.skipped ? (
                                <p className="text-yellow-500 mt-2">⚠ Skipped</p>
                              ) : (
                                <p className={`mt-2 ${answer.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                  {answer.isCorrect ? '✓' : '✗'} {answer.userAnswer}
                                </p>
                              )}
                              {(!answer.isCorrect || answer.skipped) && (
                                <p className="mt-1 text-green-500">✓ {answer.correctAnswer}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No quiz history available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}