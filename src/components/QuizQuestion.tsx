import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Question } from '@/types/quiz';
import InfoBox from './InfoBox';

interface QuizQuestionProps {
  question: Question;
  currentQuestion: number;
  numQuestions: number;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  showAnswer: boolean;
  selectedAnswer: string | null;
  shuffledAnswers: string[];
}

export default function QuizQuestion({
  question,
  currentQuestion,
  numQuestions,
  onAnswer,
  onNext,
  showAnswer,
  selectedAnswer,
  shuffledAnswers,
}: QuizQuestionProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  // Reset hint and explanation when question changes
  useEffect(() => {
    setHint(null);
    setExplanation(null);
  }, [question]);

  const getExplanation = async () => {
    setLoadingExplanation(true);
    setExplanation('');
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          correctAnswer: question.correctAnswer,
          userAnswer: selectedAnswer,
        }),
      });

      if (!response.ok) throw new Error('Failed to get explanation');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setExplanation(prev => (prev || '') + text);
      }
    } catch (error) {
      console.error('Failed to get explanation:', error);
    }
    setLoadingExplanation(false);
  };

  const getHint = async () => {
    setLoadingHint(true);
    setHint('');
    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          correctAnswer: question.correctAnswer,
        }),
      });

      if (!response.ok) throw new Error('Failed to get hint');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setHint(prev => (prev || '') + text);
      }
    } catch (error) {
      console.error('Failed to get hint:', error);
    }
    setLoadingHint(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && showAnswer) {
        onNext();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [showAnswer, onNext]);

  return (
    <div className="w-full max-w-2xl space-y-6 border border-white/20 rounded p-8">
      <div className={`content-shift ${(hint && !showAnswer) || (showAnswer && explanation) ? 'shifted' : ''}`}>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Question {currentQuestion + 1}/{numQuestions}</h2>
          <p className="text-xl mb-6 select-text">{question.question}</p>
          <div className="grid grid-cols-2 gap-3 unselectable">
            {shuffledAnswers.map((answer, index) => (
              <button
                key={index}
                onClick={() => onAnswer(answer)}
                disabled={showAnswer}
                className={`p-4 text-left rounded transition-colors border ${
                  showAnswer
                    ? answer === question.correctAnswer
                      ? 'bg-green-900/20 border-green-500 text-green-100 cursor-not-allowed'
                      : answer === selectedAnswer
                      ? 'bg-red-900/20 border-red-500 text-red-100 cursor-not-allowed'
                      : 'border-white/20 opacity-50 bg-black cursor-not-allowed'
                    : 'bg-black border-white/20 hover:bg-gray-800 active:bg-gray-700'
                }`}
              >
                {answer}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={showAnswer ? getExplanation : getHint}
              disabled={showAnswer ? (loadingExplanation || !!explanation) : (loadingHint || !!hint)}
              className={`h-9 px-4 rounded border border-white/20 flex items-center justify-center gap-2 transition-all min-w-[100px] ${
                (!showAnswer && (!!hint || loadingHint)) || (showAnswer && (!!explanation || loadingExplanation))
                  ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  : 'hover:bg-white/5'
              }`}
              title={showAnswer ? "Get explanation" : "Get a hint"}
            >
              {showAnswer ? (
                loadingExplanation ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Image
                      src="/icons/outline/question-circle.svg"
                      alt="Explain"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">Explain</span>
                  </>
                )
              ) : (
                loadingHint ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Image
                      src="/icons/outline/lightbulb.svg"
                      alt="Hint"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">Hint</span>
                  </>
                )
              )}
            </button>
            <button
              onClick={onNext}
              className={`h-9 px-4 rounded flex items-center justify-center gap-2 transition-all ml-auto min-w-[100px] ${
                showAnswer 
                  ? 'bg-white text-black hover:opacity-90' 
                  : 'border border-white/40 hover:bg-white/10'
              }`}
              title={showAnswer ? "Next question" : "Skip question"}
            >
              <Image
                src={`/icons/${showAnswer ? 'outline/check-square' : 'outline/x-square'}.svg`}
                alt={showAnswer ? "Next" : "Skip"}
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">{showAnswer ? 'Next' : 'Skip'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="-mt-4">
        {hint && !showAnswer && (
          <div className="slide-up-enter">
            <InfoBox title="Hint" className="border-yellow-800/50 bg-yellow-950/10">
              {hint}
            </InfoBox>
          </div>
        )}
        
        {showAnswer && explanation && (
          <div className="slide-up-enter">
            <InfoBox title="Explanation" className="border-blue-800/50 bg-blue-950/10">
              {explanation}
            </InfoBox>
          </div>
        )}
      </div>
    </div>
  );
}