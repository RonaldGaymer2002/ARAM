/**
 * Types for the extraction module.
 *
 * Flow:
 *   Text   — POST /extract/text   { message }              → ExtractionResult
 *   Presign — POST /extract/presign { mimeType }           → { sessionId, uploadUrl }
 *   Media  — POST /extract/media  { sessionId, type }      → ExtractionResult
 */

// ── Upload constraints ────────────────────────────────────────────────────────

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/avi',
  'video/x-matroska',
] as const;
export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Presigned URL validity window (seconds). */
export const PRESIGN_EXPIRES_IN = 300;

// ── Presign response ──────────────────────────────────────────────────────────

export interface PresignResponse {
  /** Opaque token — pass back in POST /extract/media. */
  sessionId: string;
  /** Presigned S3 PUT URL valid for `expiresIn` seconds. */
  uploadUrl: string;
  /** Seconds until the presigned URL expires. */
  expiresIn: number;
}

// ── Extraction domain types ───────────────────────────────────────────────────

export interface Material {
  type: string;
  quantity: number | null;
  unit: 'kg' | 'unit' | null;
}

export interface ExtractionData {
  company: string | null;
  date: string | null; // YYYY-MM-DD
  materials: Material[];
  notes: string | null;
}

export type ExtractionConfidence = 'high' | 'medium' | 'low';
export type InputType = 'text' | 'image' | 'video';

export interface ExtractionResult {
  sessionId: string;
  inputType: InputType;
  confidence: ExtractionConfidence;
  extracted: ExtractionData | null;
  rejectedReasons?: string[];
}

// ── Internal Bedrock response shape ──────────────────────────────────────────

export interface ExtractionAnalysis {
  company: string | null;
  date: string | null;
  materials: Material[];
  notes: string | null;
  /** Model confidence 0.0–1.0 — mapped to ExtractionConfidence by the service. */
  confidence: number;
  rejected: boolean;
  rejectedReasons: string[];
}

// ── Cost attribution (used by pricing.ts) ─────────────────────────────────────

export interface InvocationCost {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}
