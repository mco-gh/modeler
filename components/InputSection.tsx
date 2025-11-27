import React from 'react';
import { Sparkles } from 'lucide-react';

interface InputSectionProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  prompt, 
  setPrompt, 
  onGenerate, 
  isGenerating 
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-lg border border-clay-200 sticky top-4 z-50">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Décrivez votre sculpture ici (ex: un cheval au galop, un buste ancien...)"
          className="w-full pl-4 pr-14 py-4 bg-transparent text-clay-900 placeholder-clay-400 text-lg resize-none focus:outline-none min-h-[60px] max-h-[120px] rounded-xl"
          rows={1}
          disabled={isGenerating}
        />
        <div className="absolute right-2 bottom-2">
          <button
            onClick={onGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`
              flex items-center justify-center p-3 rounded-xl transition-all duration-300
              ${!prompt.trim() || isGenerating 
                ? 'bg-clay-100 text-clay-400 cursor-not-allowed' 
                : 'bg-clay-800 text-white hover:bg-clay-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
            aria-label="Générer"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
