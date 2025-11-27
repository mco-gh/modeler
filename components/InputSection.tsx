
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Type, Upload, X, Clipboard } from 'lucide-react';

interface InputSectionProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onGenerate: (image?: string) => void;
  isGenerating: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  prompt, 
  setPrompt, 
  onGenerate, 
  isGenerating 
}) => {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (mode !== 'image') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [mode]);

  const handleClipboardRead = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      let imageFound = false;
      for (const clipboardItem of clipboardItems) {
        const imageType = clipboardItem.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await clipboardItem.getType(imageType);
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(blob);
          imageFound = true;
          break;
        }
      }
      if (!imageFound) {
        alert("Aucune image trouvée dans le presse-papiers.");
      }
    } catch (err) {
      console.error("Erreur lors de la lecture du presse-papiers:", err);
      alert("Impossible d'accéder au presse-papiers. Vérifiez les permissions de votre navigateur.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateClick();
    }
  };

  const handleGenerateClick = () => {
    if (mode === 'text') {
      if (prompt.trim()) onGenerate();
    } else {
      if (selectedImage) onGenerate(selectedImage);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-4 rounded-2xl shadow-lg border border-clay-200 sticky top-4 z-50 transition-all duration-300">
      
      {/* Mode Toggle */}
      <div className="flex space-x-4 mb-4 border-b border-clay-100 pb-2">
        <button
          onClick={() => setMode('text')}
          className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors ${
            mode === 'text' 
              ? 'text-clay-800 border-b-2 border-clay-800 -mb-2.5' 
              : 'text-clay-400 hover:text-clay-600'
          }`}
        >
          <Type className="w-4 h-4" /> Description Texte
        </button>
        <button
          onClick={() => setMode('image')}
          className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors ${
            mode === 'image' 
              ? 'text-clay-800 border-b-2 border-clay-800 -mb-2.5' 
              : 'text-clay-400 hover:text-clay-600'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Image de Référence
        </button>
      </div>

      {mode === 'text' ? (
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez votre sculpture ici (ex: un cheval au galop, un buste ancien...)"
            className="w-full pl-4 pr-14 py-4 bg-clay-50/50 text-clay-900 placeholder-clay-400 text-lg resize-none focus:outline-none focus:bg-clay-50 min-h-[80px] max-h-[160px] rounded-xl border border-transparent focus:border-clay-200 transition-all"
            rows={2}
            disabled={isGenerating}
          />
          <div className="absolute right-2 bottom-2">
            <button
              onClick={handleGenerateClick}
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
      ) : (
        <div className="relative">
          {!selectedImage ? (
            <div 
              className="border-2 border-dashed border-clay-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-clay-400 hover:bg-clay-50 transition-all group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 bg-clay-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-clay-500" />
              </div>
              <p className="text-clay-600 font-medium">Cliquez pour ajouter une image</p>
              <p className="text-clay-400 text-xs mt-1 mb-4">JPG, PNG supportés</p>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClipboardRead();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-clay-200 rounded-lg text-sm text-clay-600 hover:bg-clay-50 hover:text-clay-900 transition-colors shadow-sm"
              >
                <Clipboard className="w-4 h-4" />
                Coller du presse-papiers
              </button>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-clay-50 border border-clay-200">
              <img 
                src={selectedImage} 
                alt="Reference" 
                className="w-full max-h-[300px] object-contain mx-auto"
              />
              <button 
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 right-4">
                 <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className={`
                    flex items-center justify-center p-3 rounded-xl transition-all duration-300
                    ${isGenerating 
                      ? 'bg-clay-100 text-clay-400 cursor-not-allowed' 
                      : 'bg-clay-800 text-white hover:bg-clay-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
                    }
                  `}
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-medium pr-1">Sculpter</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
