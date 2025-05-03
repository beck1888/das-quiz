import { Answer, Question } from '@/types/quiz';

interface QuizHistoryEntry {
  id?: number;
  timestamp: number;
  topic: string;
  difficulty: string;
  score: number;
  lastScore?: number;  // Added to track previous attempt's score
  totalQuestions: number;
  answers: {
    question: string;
    userAnswer: string | null;
    correctAnswer: string;
    incorrectAnswers: string[];  // Added to store original incorrect answers
    isCorrect: boolean;
    skipped: boolean;
    attempt: number;
  }[];
  attempt: number;
}

export class QuizDatabase {
  private readonly DB_NAME = 'QuizHistoryDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'quizHistory';

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          
          // Create indexes for faster querying
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('topic', 'topic');
          store.createIndex('score', 'score');
        }
      };
    });
  }

  async addQuizResult(quiz: Omit<QuizHistoryEntry, 'id'>): Promise<number> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.add(quiz);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateQuizResult(id: number, quiz: Partial<Omit<QuizHistoryEntry, 'id'>>): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      // First get the existing quiz
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error(`Quiz with id ${id} not found`));
          return;
        }
        
        // Merge existing quiz with new data
        const updatedQuiz = {
          ...getRequest.result,
          ...quiz,
          id // Ensure ID is preserved
        };
        
        // Update the quiz
        const updateRequest = store.put(updatedQuiz);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getQuizHistory(): Promise<QuizHistoryEntry[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getQuizByTopicAndDifficulty(topic: string, difficulty: string): Promise<QuizHistoryEntry | null> {
    const quizzes = await this.getQuizHistory();
    return quizzes.find(quiz => quiz.topic === topic && quiz.difficulty === difficulty) || null;
  }

  async deleteAllHistory(): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteQuiz(id: number): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}