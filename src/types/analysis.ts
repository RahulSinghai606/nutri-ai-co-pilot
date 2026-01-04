export interface Ingredient {
  commonName: string;
  scientificName?: string;
  safety: 'safe' | 'moderate' | 'concern' | 'unknown';
  explanation: string;
  detailedInfo?: string;
}

export interface IngredientCategory {
  name: string;
  icon: string;
  ingredients: Ingredient[];
  aiNote?: string;
}

export interface Tradeoff {
  ingredient: string;
  why: string;
  concern: string;
  reality: string;
}

export interface AnalysisResult {
  id: string;
  productName?: string;
  verdict: 'safe' | 'caution' | 'concern';
  confidence: number;
  healthScore: number; // 0-100
  summary: string;
  quickAdvice: string[]; // Short actionable tips
  categories: IngredientCategory[];
  tradeoffs: Tradeoff[];
  contextNote: string;
  detectedContext?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type AnalysisStage = 'none' | 'reading' | 'analyzing' | 'reasoning' | 'complete';
export type InputMode = 'idle' | 'focused' | 'processing' | 'complete';
