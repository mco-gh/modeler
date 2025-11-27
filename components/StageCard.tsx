import React, { useState } from 'react';
import { SculptureStage, StageStatus } from '../types';
import { Loader2, AlertCircle, Maximize2 } from 'lucide-react';

interface StageCardProps {
  stage: SculptureStage;
}

export const StageCard: React.FC<StageCardProps> = ({ stage }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 group">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white shadow-sm border border-clay-200 group-hover:shadow-md transition-shadow duration-300">
          
          {/* State: Idle / Placeholder */}
          {stage.status === StageStatus.IDLE && (
            <div className="absolute inset-0 flex items-center justify-center bg-clay-50 text-clay-400">
              <span className="text-sm font-medium px-8 text-center opacity-60">
                En attente de description...
              </span>
            </div>
          )}

          {/* State: Loading */}
          {stage.status === StageStatus.LOADING && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-clay-50 z-10">
              <Loader2 className="w-8 h-8 text-clay-600 animate-spin mb-2" />
              <span className="text-xs text-clay-500 font-medium uppercase tracking-wider">Sculpture en cours...</span>
            </div>
          )}

          {/* State: Error */}
          {stage.status === StageStatus.ERROR && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-500 p-4 text-center">
              <AlertCircle className="w-8 h-8 mb-2" />
              <span className="text-sm">Erreur de génération</span>
            </div>
          )}

          {/* State: Success */}
          {stage.status === StageStatus.SUCCESS && stage.imageUrl && (
            <div 
              className="relative w-full h-full cursor-zoom-in" 
              onClick={() => setIsExpanded(true)}
            >
              <img 
                src={stage.imageUrl} 
                alt={stage.label}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                 <Maximize2 className="w-8 h-8 text-white drop-shadow-md transform scale-90 group-hover:scale-100 transition-all duration-300" />
              </div>
            </div>
          )}
          
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-clay-800 shadow-sm border border-clay-100 pointer-events-none">
            Étape {stage.id}
          </div>
        </div>

        <div className="px-1">
          <h3 className="font-serif text-lg font-medium text-clay-900 leading-tight">{stage.label}</h3>
          <p className="text-sm text-clay-500 mt-1 leading-relaxed">{stage.description}</p>
        </div>
      </div>

      {/* Expanded View Overlay */}
      {stage.status === StageStatus.SUCCESS && stage.imageUrl && (
        <div 
          className={`
            fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8
            transition-all duration-500 ease-out
            ${isExpanded ? 'bg-clay-900/95 backdrop-blur-md opacity-100 visible' : 'bg-clay-900/0 backdrop-blur-none opacity-0 invisible pointer-events-none'}
          `}
          onClick={() => setIsExpanded(false)}
        >
          <div 
            className={`
              relative max-w-full max-h-full flex flex-col items-center justify-center
              transition-all duration-500 ease-out 
              ${isExpanded ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'}
            `}
          >
            <img
              src={stage.imageUrl}
              alt={stage.label}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl cursor-zoom-out select-none"
            />
            <div className="mt-4 text-white/80 text-lg font-serif font-medium tracking-wide">
              {stage.label}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
