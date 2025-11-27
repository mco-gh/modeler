import React, { useState, useCallback, useEffect } from 'react';
import { StageCard } from './components/StageCard';
import { InputSection } from './components/InputSection';
import { SculptureStage, StageStatus } from './types';
import { generateStageImage } from './services/geminiService';
import { Palette, Loader2, Key, ExternalLink } from 'lucide-react';

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

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    // Reset all stages to loading
    setStages(prev => prev.map(stage => ({
      ...stage,
      status: StageStatus.LOADING,
      imageUrl: undefined 
    })));

    try {
      // STEP 1: Generate the Final Product (Stage 4) first
      // This establishes the "truth" for the sculpture's look
      let finalImageBase64: string;
      try {
        finalImageBase64 = await generateStageImage(prompt, 4);
        
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
      // This ensures consistency in pose and composition
      const previousStageIds = [1, 2, 3];
      const stagePromises = previousStageIds.map(async (id) => {
        try {
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
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </main>

      <footer className="mt-20 text-center text-clay-400 text-sm pb-8 px-6">
        <p>Les images sont générées par IA (Gemini 3 Pro Image). Le processus commence par l'œuvre finale, puis déduit les étapes antérieures pour assurer la cohérence.</p>
        <p className="mt-2 opacity-50">&copy; {new Date().getFullYear()} Modélisateur. Tous droits réservés.</p>
      </footer>
    </div>
  );
}