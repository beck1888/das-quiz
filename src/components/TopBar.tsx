'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSettings } from '@/stores/settings';
import { QuizDatabase } from '@/services/QuizDatabase';

// Reuse the HistoryEntry interface from the History component
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
    incorrectAnswers: string[];
    isCorrect: boolean;
    skipped: boolean;
    attempt: number;
  }[];
  attempt: number;
}

interface TopBarProps {
  onViewQuiz: (answers: HistoryEntry['answers'], numQuestions: number) => void;
  onPlayQuiz: (entry: HistoryEntry) => void;
  onHomeClick: () => void;
}

export default function TopBar({ onViewQuiz, onPlayQuiz, onHomeClick }: TopBarProps) {
  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { isSoundEnabled, setIsSoundEnabled, forceEnglish, setForceEnglish } = useSettings();
  const settingsModalRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  // History state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<HistoryEntry | null>(null);
  const historyModalRef = useRef<HTMLDivElement>(null);
  const quizDb = new QuizDatabase();

  // Load history when history modal is opened
  useEffect(() => {
    if (isHistoryOpen) {
      loadHistory();
    }
  }, [isHistoryOpen]);

  const loadHistory = async () => {
    const quizHistory = await quizDb.getQuizHistory();
    setHistory(quizHistory.sort((a, b) => b.timestamp - a.timestamp));
  };

  // Handle clicks outside the settings modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsModalRef.current && !settingsModalRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isSettingsOpen]);

  // Handle clicks outside the history modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyModalRef.current && !historyModalRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHistoryOpen(false);
      }
    };

    if (isHistoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isHistoryOpen]);

  // Settings functions
  const clearAllData = async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear IndexedDB
    const databases = await window.indexedDB.databases();
    databases.forEach(db => {
      if (db.name) {
        window.indexedDB.deleteDatabase(db.name);
      }
    });
  };

  const playSound = () => {
    if (isSoundEnabled) {
      const audio = new Audio('/sounds/alert.mp3');
      audio.play();
    }
  };

  // History functions
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return `Made ${seconds}s ago`;
    if (minutes < 60) return `Made ${minutes}m ago`;
    if (hours < 24) return `Made ${hours}h ago`;
    if (days < 7) return `Made ${days}d ago`;
    if (weeks < 4) return `Made ${weeks}w ago`;
    if (months < 12) return `Made ${months}mo ago`;
    return `Made ${years}y ago`;
  };

  const handleView = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    onViewQuiz(entry.answers, entry.totalQuestions);
    setIsHistoryOpen(false);
  };

  const handlePlay = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayQuiz({
      ...entry,
      id: entry.id // Make sure we preserve the quiz ID
    });
    setIsHistoryOpen(false);
  };

  const handleDelete = async (entry: HistoryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.id) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this quiz?');
    if (!confirmed) return;
    
    try {
      await quizDb.deleteQuiz(entry.id);
      await loadHistory(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  // Confirmation dialog component for settings
  const ConfirmDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div ref={confirmRef} className="bg-gray-900 p-6 rounded-xl max-w-md w-full border border-gray-700 shadow-xl">
        <h3 className="text-xl font-bold text-gray-100 mb-4">Confirm Deletion</h3>
        <p className="text-gray-300 mb-6">Are you sure you want to erase all data? This action cannot be undone.</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(false);
              setIsSettingsOpen(false);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await clearAllData();
              window.location.reload();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Top bar with buttons stacked vertically inside a rectangle */}
      <div className="fixed top-4 left-4 z-10">
        <div className="flex flex-col space-y-2 bg-gray-900/70 px-2 py-3 rounded-lg border border-gray-700">
          <button
            onClick={onHomeClick}
            className="w-10 h-10 flex items-center justify-center outline-none rounded hover:bg-blue-600/70 transition-colors"
          >
            <Image
              src="/icons/static/home.svg"
              alt="Home"
              width={24}
              height={24}
              className="text-white hover:opacity-100 transition-opacity"
            />
          </button>
          
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-10 h-10 flex items-center justify-center outline-none rounded hover:bg-blue-600/70 transition-colors"
          >
            <Image
              src="/icons/static/history.svg"
              alt="History"
              width={24}
              height={24}
              className="text-white hover:opacity-100 transition-opacity"
            />
          </button>
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 flex items-center justify-center outline-none rounded hover:bg-blue-600/70 transition-colors"
          >
            <Image
              src="/icons/static/gear.svg"
              alt="Settings"
              width={24}
              height={24}
              className="text-white hover:opacity-100 transition-opacity"
            />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showConfirm && <ConfirmDialog />}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div ref={settingsModalRef} className="bg-gray-900 p-6 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-100">Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-800"
              >
                <Image
                  src="/icons/static/close.svg"
                  alt="Close"
                  width={38}
                  height={38}
                />
              </button>
            </div>
            <br />
            <div className="space-y-6 overflow-y-auto flex-1 pr-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-200">
                  Sound
                </span>
                <button
                  id="sound"
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className={`relative inline-flex h-8 w-16 items-center rounded transition-colors duration-200 ease-in-out ${
                    isSoundEnabled ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <span className="absolute text-[10px] font-bold text-white left-2">
                    {isSoundEnabled ? 'ON' : ''}
                  </span>
                  <span className="absolute text-[10px] font-bold text-white right-2">
                    {!isSoundEnabled ? 'OFF' : ''}
                  </span>
                  <span
                    className={`inline-block h-6 w-6 transform rounded bg-white shadow transition-transform duration-200 ease-in-out ${
                      isSoundEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-200">
                    Force English Response
                    <span className="ml-2 text-xs text-blue-400">(Coming Soon)</span>
                  </span>
                  <button
                    id="force-english"
                    onClick={() => setForceEnglish(!forceEnglish)}
                    disabled
                    className={`relative inline-flex h-8 w-16 items-center rounded transition-colors duration-200 ease-in-out ${
                      forceEnglish ? 'bg-green-500' : 'bg-red-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="absolute text-[10px] font-bold text-white left-2">
                      {forceEnglish ? 'ON' : ''}
                    </span>
                    <span className="absolute text-[10px] font-bold text-white right-2">
                      {!forceEnglish ? 'OFF' : ''}
                    </span>
                    <span
                      className={`inline-block h-6 w-6 transform rounded bg-white shadow transition-transform duration-200 ease-in-out ${
                        forceEnglish ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Enable this setting to force English responses regardless of the prompt language.
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-gray-700">
                <h3 className="text-lg font-medium text-red-500 mb-4">Danger Zone</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-200">
                      Erase All Data 
                      <span className="ml-2 text-xs text-blue-400">(Coming Soon)</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      This will permanently delete all data. 
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      playSound();
                      setShowConfirm(true);
                    }}
                    disabled
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                  >
                    Erase
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div ref={historyModalRef} className="bg-gray-900 p-6 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-100">Quiz History</h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
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
                          <p className="text-sm text-gray-400">{formatRelativeTime(entry.timestamp)}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Score: {entry.score}/{entry.totalQuestions}
                            <span className="mx-2">•</span>
                            Difficulty: {entry.difficulty}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleDelete(entry, e)}
                            className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                            title="Delete Quiz"
                          >
                            <Image
                              src="/icons/static/trash.svg"
                              alt="Delete"
                              width={20}
                              height={20}
                            />
                          </button>
                          <button
                            onClick={(e) => handleView(entry, e)}
                            className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                            title="View Quiz Details"
                          >
                            <Image
                              src="/icons/static/binoculars.svg"
                              alt="View"
                              width={20}
                              height={20}
                            />
                          </button>
                          <button
                            onClick={(e) => handlePlay(entry, e)}
                            className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                            title="Play Quiz Again"
                          >
                            <Image
                              src="/icons/static/play.svg"
                              alt="Play"
                              width={20}
                              height={20}
                            />
                          </button>
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