/**
 * Extraction controller — HTTP boundary for the extraction module.
 *
 * Responsibilities:
 *   - Validate request shape
 *   - Throw typed HttpExceptions for invalid input
 *   - Delegate to IdentificationService
 *   - Wrap successful results in IApiResponse<T>
 *   - Forward all errors to handleException()
 *
 * No business logic lives here.
 * Route registration lives in identification.module.ts.
 */

import type { Context } from 'hono';
import {
  BadRequestException,
  UnsupportedMediaException,
  handleException,
} from '../../common/exceptions';
import type { IApiResponse } from '../../common/interfaces';
import type {
  ExtractionResultDto,
  PresignResponseDto,
} from './identification.dto';
import type { IdentificationService } from './identification.service';
import { ALLOWED_MIME_TYPES } from './identification.types';

export class IdentificationController {
  constructor(private readonly service: IdentificationService) {}

  // ── POST /text ────────────────────────────────────────────────────────────
  async extractText(c: Context): Promise<Response> {
    try {
      const body = await c.req.json<{ message?: string }>();

      if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
        throw new BadRequestException('"message" is required.', 'MISSING_MESSAGE');
      }

      const result = await this.service.extractText(body.message.trim());
      const status = result.extracted ? 200 : 422;
      return c.json<IApiResponse<ExtractionResultDto>>({ data: result }, status);
    } catch (err) {
      return handleException(err, c);
    }
  }

  // ── POST /presign ─────────────────────────────────────────────────────────
  async presign(c: Context): Promise<Response> {
    try {
      const body = await c.req.json<{ mimeType?: string }>();

      if (!body.mimeType) {
        throw new BadRequestException('"mimeType" is required.', 'MISSING_MIME_TYPE');
      }

      if (!ALLOWED_MIME_TYPES.includes(body.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
        throw new UnsupportedMediaException(
          `Unsupported mimeType "${body.mimeType}". Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
          'UNSUPPORTED_MIME_TYPE',
        );
      }

      const result = await this.service.presign(body.mimeType as (typeof ALLOWED_MIME_TYPES)[number]);
      return c.json<IApiResponse<PresignResponseDto>>({ data: result }, 200);
    } catch (err) {
      return handleException(err, c);
    }
  }

  // ── POST /media ───────────────────────────────────────────────────────────
  async extractMedia(c: Context): Promise<Response> {
    try {
      const body = await c.req.json<{ sessionId?: string; type?: string; notes?: string }>();

      if (!body.sessionId || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
        throw new BadRequestException('"sessionId" is required.', 'MISSING_SESSION_ID');
      }

      if (!body.type || !['image', 'video'].includes(body.type)) {
        throw new BadRequestException(
          '"type" must be "image" or "video".',
          'INVALID_TYPE',
        );
      }

      const notes = typeof body.notes === 'string' && body.notes.trim()
        ? body.notes.trim()
        : undefined;

      const result = await this.service.extractMedia(
        body.sessionId.trim(),
        body.type as 'image' | 'video',
        notes,
      );

      const status = result.extracted ? 200 : 422;
      return c.json<IApiResponse<ExtractionResultDto>>({ data: result }, status);
    } catch (err) {
      return handleException(err, c);
    }
  }
}
