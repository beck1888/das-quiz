import { useState } from 'react';
import Image from 'next/image';
import Select from './Select';

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

interface QuizFormProps {
  onSubmit: (topic: string, numQuestions: number, difficulty: string) => void;
  loading: boolean;
  config: Config | null;
}

export default function QuizForm({ onSubmit, loading, config }: QuizFormProps) {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(config?.settings.questions.default || 3);
  const [difficulty, setDifficulty] = useState(config?.settings.defaults.difficulty || 'standard');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(topic, numQuestions, difficulty);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative">
      <Image
        src="/icons/static/header.png"
        alt="Header"
        width={150}
        height={50}
        className="fixed top-4 left-4 z-50"
      />
      <span className="fixed top-4 right-4 z-50 text-xs text-gray-500 select-none border border-gray-800 px-3 py-1 rounded-md bg-black/50">
        AI generated. For reference only.
      </span>
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 rounded-lg border border-white/30 bg-black/90 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <h2 className="text-2xl font-bold text-center mb-8">Create Quiz</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-400 select-none">
              Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic..."
              className="w-full p-3 bg-black border border-white/30 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary hover:border-white/50 transition-colors placeholder:text-gray-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-400 select-none">
                Number of Questions
              </label>
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
            </div>
            <div className="space-y-2">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-400 select-none">
                Difficulty
              </label>
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
          </div>
          <button
            type="submit"
            className="w-full bg-white text-black p-3 rounded disabled:opacity-30 hover:opacity-90 transition-colors font-medium"
            disabled={loading || !topic || !config}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}