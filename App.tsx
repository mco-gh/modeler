
import React, { useState, useCallback, useEffect } from 'react';
import { StageCard } from './components/StageCard';
import { InputSection } from './components/InputSection';
import { SculptureStage, StageStatus } from './types';
import { generateStageImage } from './services/geminiService';
import { Palette, Loader2, Key, ExternalLink, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

// Initial state for the 4 stages
const INITIAL_STAGES: SculptureStage[] = [
  {
    id: 1,
    label: "Masse Initiale",
    description: "La forme brute émergeant du bloc d'argile.",
    status: StageStatus.IDLE
  },
  {
    id: 2,
    label: "Structure",
    description: "Division en sous-blocs et orientation des volumes.",
    status: StageStatus.IDLE
  },
  {
    id: 3,
    label: "Émergence",
    description: "Les détails commencent à apparaître sur la surface.",
    status: StageStatus.IDLE
  },
  {
    id: 4,
    label: "Œuvre Finale",
    description: "La sculpture terminée avec tous ses détails.",
    status: StageStatus.IDLE
  }
];

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [stages, setStages] = useState<SculptureStage[]>(INITIAL_STAGES);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  
  // Gallery Overlay State
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);

  // Check for API Key on mount
  useEffect(() => {
    async function checkKey() {
      try {
        const envApiKey = process.env.API_KEY;
        let hasKey = false;

        if (window.aistudio) {
          hasKey = await window.aistudio.hasSelectedApiKey();
        } else {
          hasKey = !!envApiKey; 
        }
        console.log("API Key present:", hasKey);
        setApiKeyReady(hasKey);
      } catch (e) {
        console.error("Error checking API key:", e);
        setApiKeyReady(false);
      } finally {
        setCheckingKey(false);
      }
    }
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setApiKeyReady(true);
    } catch (e) {
      console.error("Key selection failed:", e);
      setApiKeyReady(false);
    }
  };

  const handleGenerate = useCallback(async (inputImageBase64?: string) => {
    if (isGenerating) return;
    // If no text prompt and no image, return
    if (!inputImageBase64 && !prompt.trim()) return;

    setIsGenerating(true);

    // Reset all stages to loading
    setStages(prev => prev.map(stage => ({
      ...stage,
      status: StageStatus.LOADING,
      imageUrl: undefined 
    })));

    try {
      // STEP 1: Generate the Final Product (Stage 4) first
      let finalImageBase64: string;
      try {
        finalImageBase64 = await generateStageImage(prompt, 4, undefined, inputImageBase64);
        
        setStages(currentStages => 
          currentStages.map(s => 
            s.id === 4 
              ? { ...s, status: StageStatus.SUCCESS, imageUrl: finalImageBase64 } 
              : s
          )
        );
      } catch (error) {
        // If stage 4 fails, everything fails
        setStages(currentStages => 
          currentStages.map(s => ({ ...s, status: StageStatus.ERROR }))
        );
        setIsGenerating(false);
        return;
      }

      // STEP 2: Generate Stages 1, 2, 3 using Stage 4 as reference
      const previousStageIds = [1, 2, 3];
      const stagePromises = previousStageIds.map(async (id) => {
        try {
          // Pass the GENERATED final image as reference for the previous stages
          const image = await generateStageImage(prompt, id, finalImageBase64);
          
          setStages(currentStages => 
            currentStages.map(s => 
              s.id === id 
                ? { ...s, status: StageStatus.SUCCESS, imageUrl: image } 
                : s
            )
          );
        } catch (error) {
          setStages(currentStages => 
            currentStages.map(s => 
              s.id === id 
                ? { ...s, status: StageStatus.ERROR } 
                : s
            )
          );
        }
      });

      await Promise.all(stagePromises);

    } catch (error) {
      console.error("Global generation error", error);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating]);

  // Navigation Logic
  const nextStage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedStageId(prev => (prev !== null && prev < 4 ? prev + 1 : prev));
  }, []);

  const prevStage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedStageId(prev => (prev !== null && prev > 1 ? prev - 1 : prev));
  }, []);

  const closeExpanded = useCallback(() => {
    setExpandedStageId(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (expandedStageId === null) return;
      
      switch (e.key) {
        case 'ArrowRight':
          nextStage();
          break;
        case 'ArrowLeft':
          prevStage();
          break;
        case 'Escape':
          closeExpanded();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedStageId, nextStage, prevStage, closeExpanded]);

  // Find the currently active stage for the overlay
  const activeExpandedStage = expandedStageId ? stages.find(s => s.id === expandedStageId) : null;

  if (checkingKey) {
    return (
      <div className="min-h-screen bg-[#f9f7f5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-clay-500 animate-spin" />
      </div>
    );
  }

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-[#f9f7f5] flex flex-col items-center justify-center p-6 text-clay-900">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-clay-200 text-center">
          <div className="w-16 h-16 bg-clay-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-clay-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold mb-4">Authentification Requise</h1>
          <p className="text-clay-600 mb-8 leading-relaxed">
            Pour utiliser le modèle haute qualité <strong>Gemini 3 Pro Image</strong>, vous devez sélectionner une clé API valide associée à un projet facturé.
          </p>
          
          <button
            onClick={handleSelectKey}
            className="w-full bg-clay-800 text-white font-medium py-3 px-6 rounded-xl hover:bg-clay-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            Sélectionner une clé API
          </button>

          <div className="mt-6 pt-6 border-t border-clay-100">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-clay-400 hover:text-clay-600 flex items-center justify-center gap-1 transition-colors"
            >
              En savoir plus sur la facturation <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f5] text-clay-900 pb-20">
      
      <header className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6 border border-clay-100">
          <Palette className="w-6 h-6 text-clay-600 mr-2" />
          <span className="font-serif italic text-clay-500">L'atelier virtuel</span>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-clay-900 mb-4 tracking-tight">
          Modélisateur
        </h1>
        <p className="text-clay-600 max-w-lg mx-auto leading-relaxed text-lg">
          Transformez vos idées en sculpture. Visualisez le processus créatif de l'argile brute à l'œuvre d'art.
        </p>
      </header>

      <div className="px-6 mb-12 sticky top-6 z-40">
        <InputSection 
          prompt={prompt} 
          setPrompt={setPrompt} 
          onGenerate={handleGenerate} 
          isGenerating={isGenerating}
        />
      </div>

      <main className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stages.map((stage) => (
            <StageCard 
              key={stage.id} 
              stage={stage} 
              onExpand={() => setExpandedStageId(stage.id)}
            />
          ))}
        </div>
      </main>

      <footer className="mt-20 text-center text-clay-400 text-sm pb-8 px-6">
        <p>Les images sont générées par IA (Gemini 3 Pro Image). Le processus commence par l'œuvre finale, puis déduit les étapes antérieures pour assurer la cohérence.</p>
        <p className="mt-2 opacity-50">
          &copy; 2025, 2026 <a href="https://mco.dev" target="_blank" rel="noopener noreferrer" className="hover:text-clay-600 transition-colors">Marc Cohen</a>. Tous droits réservés.
        </p>
      </footer>

      {/* Full Screen Overlay */}
      {activeExpandedStage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-clay-900/95 backdrop-blur-md animate-in fade-in duration-300"
          onClick={closeExpanded}
        >
          {/* Close Button */}
          <button 
            onClick={closeExpanded}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors backdrop-blur-sm z-20"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Navigation Arrow */}
          {activeExpandedStage.id > 1 && (
            <button
              onClick={prevStage}
              className="absolute left-4 md:left-8 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm z-20 hover:scale-110"
              aria-label="Previous Stage"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Right Navigation Arrow */}
          {activeExpandedStage.id < 4 && (
            <button
              onClick={nextStage}
              className="absolute right-4 md:right-8 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm z-20 hover:scale-110"
              aria-label="Next Stage"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Content Area */}
          <div 
            className="relative max-w-full max-h-full flex flex-col items-center justify-center p-4 sm:p-12"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
          >
            {activeExpandedStage.status === StageStatus.SUCCESS && activeExpandedStage.imageUrl ? (
              <img
                src={activeExpandedStage.imageUrl}
                alt={activeExpandedStage.label}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              />
            ) : activeExpandedStage.status === StageStatus.LOADING ? (
              <div className="flex flex-col items-center justify-center text-white/80">
                <Loader2 className="w-16 h-16 animate-spin mb-4" />
                <p className="text-xl font-light tracking-wide">Sculpture en cours...</p>
              </div>
            ) : activeExpandedStage.status === StageStatus.ERROR ? (
              <div className="flex flex-col items-center justify-center text-red-200">
                <AlertCircle className="w-16 h-16 mb-4 opacity-80" />
                <p className="text-xl font-light">Image non disponible</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-white/50">
                <Palette className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-xl font-light">En attente...</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-2 backdrop-blur-sm">
                Étape {activeExpandedStage.id} / 4
              </div>
              <h2 className="text-white text-2xl font-serif font-medium tracking-wide">
                {activeExpandedStage.label}
              </h2>
              <p className="text-white/60 mt-1 max-w-lg mx-auto text-sm">
                {activeExpandedStage.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
