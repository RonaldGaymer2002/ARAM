/**
 * Data Transfer Objects for the extraction module.
 *
 * DTOs define the exact shape of data crossing the HTTP boundary:
 *   - Request DTOs  — what the controller accepts from the client
 *   - Response DTOs — what the controller returns to the client
 *
 * Internal domain types (ExtractionAnalysis, InvocationCost, …) live in
 * `identification.types.ts` and never leave the service layer.
 */

import type { ExtractionConfidence, InputType, Material } from './identification.types';

// ── Request DTOs ──────────────────────────────────────────────────────────────

export interface ExtractTextRequestDto {
  /** Plain text message from the collector to analyse. */
  message: string;
}

export interface PresignRequestDto {
  /** MIME type of the file the client intends to upload (image or video). */
  mimeType: string;
}

export interface ExtractMediaRequestDto {
  /** Session token returned by POST /extract/presign. */
  sessionId: string;
  /** Whether the uploaded file is an image or a video. */
  type: 'image' | 'video';
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export interface PresignResponseDto {
  sessionId: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface MaterialDto {
  type: string;
  quantity: number | null;
  unit: 'kg' | 'unit' | null;
}

export interface ExtractionDataDto {
  company: string | null;
  date: string | null;
  materials: MaterialDto[];
  notes: string | null;
}

export interface ExtractionUsageDto {
  inputTokens: number;
  outputTokens: number;
  /** USD cost for this invocation, rounded to 8 decimal places. */
  costUsd: number;
  /** The Bedrock model ID that was actually used. */
  modelId: string;
}

export interface ExtractionResultDto {
  sessionId: string;
  inputType: InputType;
  confidence: ExtractionConfidence;
  extracted: ExtractionDataDto | null;
  rejectedReasons?: string[];
  usage: ExtractionUsageDto;
}

// ── Error ─────────────────────────────────────────────────────────────────────
// Error responses use IApiErrorResponse from common/interfaces — not defined here.

// Ensure Material and MaterialDto stay in sync.
type _MaterialCheck = Material extends MaterialDto ? true : never;
const _: _MaterialCheck = true;
void _;
