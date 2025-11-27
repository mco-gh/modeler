export enum StageStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface SculptureStage {
  id: number;
  label: string;
  description: string;
  imageUrl?: string;
  status: StageStatus;
}

export interface GenerationRequest {
  prompt: string;
}