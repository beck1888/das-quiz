import { useState, useEffect } from 'react';
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
  const [numQuestions, setNumQuestions] = useState(config?.settings.questions.default || 5);
  const [difficulty, setDifficulty] = useState(config?.settings.defaults.difficulty || 'standard');
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(topic, numQuestions, difficulty);
  };

  const handleClose = () => setShowTerms(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    if (showTerms) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [showTerms]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 rounded-lg border border-white/30 bg-black/90 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <h2 className="text-4xl font-bold text-center mb-8">Create Quiz</h2>
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
              className="w-full p-3 bg-black border border-white/30 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary hover:border-white/50 transition-colors placeholder:text-gray-500 select-none"
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
            className="w-full bg-white text-black p-3 rounded disabled:opacity-30 hover:opacity-90 transition-colors font-medium mt-5"
            disabled={loading || !topic || !config}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
          <p className="text-xs text-gray-400 text-center flex gap-1 group cursor-pointer" onClick={() => setShowTerms(true)}>
            <span className="mr-1 select-none group-hover:text-white group-hover:underline transition-colors">Please review our AI terms</span>
            <Image
              src="/icons/static/box-arrow-up-right-gray.svg"
              alt="External link"
              width={12}
              height={12}
              className="inline group-hover:hidden"
            />
            <Image
              src="/icons/static/box-arrow-up-right-white.svg"
              alt="External link"
              width={12}
              height={12}
              className="hidden group-hover:inline"
            />
          </p>
        </div>
      </form>

      {showTerms && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-black/90 p-8 rounded-lg border border-white/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">AI Disclaimer</h3>
              <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-white">
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <h4 className="text-lg font-medium mb-4">1. Use of Artificial Intelligence</h4>
              <p>Portions of this website utilize artificial intelligence (AI) technologies to generate content, provide responses, and enhance user interaction. These AI features are integrated throughout the site and may appear in chat interfaces, text explanations, summaries, or other dynamically produced materials.</p>
              
              <h4 className="text-lg font-medium mt-6 mb-4">2. Third-Party AI Provider</h4>
              <p>All AI-generated content on this site is powered by OpenAI&apos;s API. The underlying AI models are developed and maintained by OpenAI, an independent third-party provider.</p>
              
              <h4 className="text-lg font-medium mt-6 mb-4">3. No Endorsement or Guarantee</h4>
              <p>Neither OpenAI nor the owner of this website (referred to hereafter as &quot;we&quot; or &quot;us&quot;) guarantees the accuracy, reliability, completeness, legality, or usefulness of any AI-generated content. All outputs from the AI are automatically generated without human verification, and they do not reflect the opinions or endorsements of OpenAI or this website.</p>
              
              <h4 className="text-lg font-medium mt-6 mb-4">4. Possibility of Errors or Inaccuracies</h4>
              <p>The content generated by the AI may contain factual inaccuracies, outdated information, logical inconsistencies, or misleading interpretations. This includes—but is not limited to—errors involving recent events, scientific data, legal interpretations, technical subjects, and mathematical calculations.</p>
              
              <h4 className="text-lg font-medium mt-6 mb-4">5. Do Not Rely Solely on AI Outputs</h4>
              <p>Users are strongly advised not to rely solely on AI-generated content when making decisions, forming opinions, or taking action. AI-generated content should be treated as informational or illustrative only, and users should always consult trusted, authoritative, or expert sources before making important choices or judgments.</p>
              
              <h4 className="text-lg font-medium mt-6 mb-4">6. No Legal, Medical, Financial, or Professional Advice</h4>
              <p>Any content generated by the AI should not be considered a substitute for professional advice in legal, medical, financial, academic, or any other regulated domain. We do not claim to provide expert guidance, and no AI-generated content should be construed as such.</p>
              
              <h4 className="text-lg font-medium mt-6 mb-4">7. Limitation of Liability</h4>
              <p>To the fullest extent permitted by law, we disclaim all liability for any harm, loss, injury, or damage—whether direct, indirect, incidental, consequential, or otherwise—that may arise from the use of, or reliance on, any content produced by the AI. This includes harm caused by errors, omissions, or misleading statements generated by the AI.</p>
              
              <h4 className="text-lg font-medium mt-6 mb-4">8. AI Is Fallible and Has Known Limitations</h4>
              <p>The AI models used on this website are known to produce inaccurate or nonsensical results. These models are probabilistic, not deterministic, and do not &quot;understand&quot; content in a human sense. They may generate confident-sounding but incorrect or misleading outputs. This is especially common when dealing with:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Current events or time-sensitive information</li>
                <li>Technical or scientific domains</li>
                <li>Mathematical calculations</li>
                <li>Nuanced or sensitive topics</li>
                <li>Any context where real-world consequences are at stake</li>
              </ul>
              
              <h4 className="text-lg font-medium mt-6 mb-4">9. User Acknowledgment and Consent</h4>
              <p>By using this site, you acknowledge that you understand and accept the limitations of AI-generated content, and that you use such content at your own discretion and risk.</p>
            </div>
            <div className="flex mt-8 border-t border-white/10 pt-6">
              <button
                onClick={() => setShowTerms(false)}
                className="w-full p-3 rounded bg-white text-black hover:opacity-90 transition-opacity font-medium"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}