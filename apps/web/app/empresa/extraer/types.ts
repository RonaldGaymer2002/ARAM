export type TabId = 'texto' | 'imagen' | 'video';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface MaterialItem {
  material: string;
  cantidad: number;
  unidad: string;
}

export interface ExtractionResult {
  confidence: ConfidenceLevel;
  empresa?: string;
  fecha?: string;
  notas?: string | null;
  materiales?: MaterialItem[];
  reasons?: string[];
}
