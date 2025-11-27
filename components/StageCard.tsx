import React from 'react';
import { SculptureStage, StageStatus } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

interface StageCardProps {
  stage: SculptureStage;
}

export const StageCard: React.FC<StageCardProps> = ({ stage }) => {
  return (
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
          <img 
            src={stage.imageUrl} 
            alt={stage.label}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
        )}
        
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-clay-800 shadow-sm border border-clay-100">
          Étape {stage.id}
        </div>
      </div>

      <div className="px-1">
        <h3 className="font-serif text-lg font-medium text-clay-900 leading-tight">{stage.label}</h3>
        <p className="text-sm text-clay-500 mt-1 leading-relaxed">{stage.description}</p>
      </div>
    </div>
  );
};
