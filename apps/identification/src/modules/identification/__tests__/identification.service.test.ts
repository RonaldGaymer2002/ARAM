/**
 * Unit tests for IdentificationService (extraction).
 *
 * All AWS dependencies (BedrockService, S3Service) are replaced with
 * lightweight jest mocks so no network calls are made.
 *
 * Coverage goals
 * ──────────────
 * computeCost()      – correct USD math for every model family
 * extractText()      – happy path (extracted), rejection (no collection data)
 * presign()          – generates sessionId and uploadUrl
 * extractMedia()     – image happy path, rejection, S3 cleanup always runs
 *                    – video path uses headObject + getObjectUri
 */

import type { BedrockService } from '../../../common/services/bedrock.service';
import type { S3Service } from '../../../common/services/s3.service';
import type { BedrockInvokeOutput } from '../../../common/adapters/bedrock/bedrock-adapter.interface';
import { IdentificationService } from '../identification.service';
import { computeCost } from '../pricing';
import type { ExtractionAnalysis } from '../identification.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MODEL_HAIKU = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
const MODEL_NOVA  = 'amazon.nova-lite-v1:0';

const USAGE_SMALL = { inputTokens: 300, outputTokens: 60 };
const USAGE_LARGE = { inputTokens: 950, outputTokens: 80 };

function bedrockOutput(text: string, modelId = MODEL_HAIKU, usage = USAGE_SMALL): BedrockInvokeOutput {
  return { text, usage, modelId };
}

function analysisJson(overrides: Partial<ExtractionAnalysis> = {}): string {
  const defaults: ExtractionAnalysis = {
    company:         'Empresa ABC',
    date:            '2024-03-10',
    materials:       [{ type: 'papel', quantity: 50, unit: 'kg' }],
    notes:           null,
    confidence:      0.92,
    rejected:        false,
    rejectedReasons: [],
    ...overrides,
  };
  return JSON.stringify(defaults);
}

function rejectedJson(reasons: string[] = ['no_collection_data']): string {
  return JSON.stringify({
    company: null, date: null, materials: [], notes: null,
    confidence: 0, rejected: true, rejectedReasons: reasons,
  } satisfies ExtractionAnalysis);
}

// ─── Mock factories ───────────────────────────────────────────────────────────

type S3Mock = jest.Mocked<Pick<S3Service,
  'getObjectData' | 'getPresignedUploadUrl' | 'deleteObject' | 'headObject' | 'getObjectUri'
>>;

function makeS3(deleteResolves = true): S3Mock {
  return {
    getObjectData:         jest.fn().mockResolvedValue({ base64: 'abc==', mimeType: 'image/jpeg' }),
    getPresignedUploadUrl: jest.fn().mockResolvedValue('https://s3.example.com/upload'),
    deleteObject:          jest.fn().mockImplementation(() =>
      deleteResolves ? Promise.resolve() : Promise.reject(new Error('S3 delete failed')),
    ),
    headObject:   jest.fn().mockResolvedValue({ mimeType: 'video/mp4' }),
    getObjectUri: jest.fn().mockReturnValue('s3://bucket/sessions/test-id/media'),
  };
}

function makeBedrock(...outputs: BedrockInvokeOutput[]): jest.Mocked<Pick<BedrockService, 'invoke'>> {
  const invoke = jest.fn();
  outputs.forEach((o) => invoke.mockResolvedValueOnce(o));
  return { invoke };
}

function makeService(
  bedrock: jest.Mocked<Pick<BedrockService, 'invoke'>>,
  s3: S3Mock,
  config: { modelId?: string } = {},
): IdentificationService {
  return new IdentificationService(
    s3 as unknown as S3Service,
    bedrock as unknown as BedrockService,
    config,
  );
}

// ─── computeCost() ────────────────────────────────────────────────────────────

describe('computeCost()', () => {
  it('returns $0 for an unknown model and still reports token counts', () => {
    const cost = computeCost({ inputTokens: 500, outputTokens: 50 }, 'unknown.model-x');
    expect(cost.costUsd).toBe(0);
    expect(cost.inputTokens).toBe(500);
    expect(cost.outputTokens).toBe(50);
  });

  it('calculates Claude Haiku 4.5 cost correctly (cross-region prefix)', () => {
    // $0.80/1M in + $4.00/1M out → 1M + 1M = $4.80
    const cost = computeCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, MODEL_HAIKU);
    expect(cost.costUsd).toBeCloseTo(4.80, 6);
  });

  it('calculates Nova Lite cost correctly', () => {
    // $0.06/1M in + $0.24/1M out → 1M + 1M = $0.30
    const cost = computeCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, MODEL_NOVA);
    expect(cost.costUsd).toBeCloseTo(0.30, 6);
  });

  it('calculates Claude Sonnet 4.x cost correctly', () => {
    // $3.00/1M in + $15.00/1M out — 500k each = $9.00
    const cost = computeCost(
      { inputTokens: 500_000, outputTokens: 500_000 },
      'us.anthropic.claude-sonnet-4-6-20250101-v1:0',
    );
    expect(cost.costUsd).toBeCloseTo(9.00, 6);
  });

  it('calculates Nova Pro cost correctly', () => {
    // $0.80/1M in + $3.20/1M out → 1M each = $4.00
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      'amazon.nova-pro-v1:0',
    );
    expect(cost.costUsd).toBeCloseTo(4.00, 6);
  });

  it('calculates Nova 2 Lite cost correctly (cross-region prefix)', () => {
    // $0.10/1M in + $0.40/1M out → 1M each = $0.50
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      'us.amazon.nova-2-lite-v1:0',
    );
    expect(cost.costUsd).toBeCloseTo(0.50, 6);
  });

  it('does NOT match nova-lite prefix for nova-2-lite model', () => {
    const nova2    = computeCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, 'us.amazon.nova-2-lite-v1:0');
    const novaLite = computeCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, 'us.amazon.nova-lite-v1:0');
    expect(nova2.costUsd).not.toBe(novaLite.costUsd);
  });

  it('matches on "anthropic.claude-haiku-4-5" (on-demand prefix, no region)', () => {
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      'anthropic.claude-haiku-4-5-20251001-v1:0',
    );
    expect(cost.costUsd).toBeCloseTo(4.80, 6);
  });
});

// ─── extractText() ────────────────────────────────────────────────────────────

describe('extractText() — happy path', () => {
  it('returns high confidence and extracted data', async () => {
    const bedrock = makeBedrock(bedrockOutput(analysisJson(), MODEL_HAIKU, USAGE_SMALL));
    const result  = await makeService(bedrock, makeS3()).extractText('Empresa ABC entregó 50kg de papel');

    expect(result.confidence).toBe('high');
    expect(result.extracted).not.toBeNull();
    expect(result.extracted?.company).toBe('Empresa ABC');
    expect(result.extracted?.date).toBe('2024-03-10');
    expect(result.extracted?.materials).toHaveLength(1);
  });

  it('includes usage with token counts, costUsd, and modelId', async () => {
    const bedrock = makeBedrock(bedrockOutput(analysisJson(), MODEL_HAIKU, USAGE_SMALL));
    const result  = await makeService(bedrock, makeS3()).extractText('msg');

    expect(result.usage.inputTokens).toBe(USAGE_SMALL.inputTokens);
    expect(result.usage.outputTokens).toBe(USAGE_SMALL.outputTokens);
    expect(result.usage.costUsd).toBeGreaterThan(0);
    expect(result.usage.modelId).toBe(MODEL_HAIKU);
  });

  it('inputType is always "text"', async () => {
    const bedrock = makeBedrock(bedrockOutput(analysisJson(), MODEL_HAIKU));
    const result  = await makeService(bedrock, makeS3()).extractText('some message');
    expect(result.inputType).toBe('text');
  });

  it('generates a unique sessionId per call', async () => {
    const bedrock = makeBedrock(
      bedrockOutput(analysisJson()),
      bedrockOutput(analysisJson()),
    );
    const svc = makeService(bedrock, makeS3());
    const [r1, r2] = await Promise.all([
      svc.extractText('msg 1'),
      svc.extractText('msg 2'),
    ]);
    expect(r1.sessionId).not.toBe(r2.sessionId);
  });
});

describe('extractText() — rejection', () => {
  it('returns null extracted and rejectedReasons when model rejects', async () => {
    const bedrock = makeBedrock(bedrockOutput(rejectedJson(['no_collection_data'])));
    const result  = await makeService(bedrock, makeS3()).extractText('hello world');

    expect(result.extracted).toBeNull();
    expect(result.confidence).toBe('low');
    expect(result.rejectedReasons).toContain('no_collection_data');
  });

  it('sets low confidence when model confidence < 0.45', async () => {
    const bedrock = makeBedrock(bedrockOutput(analysisJson({ confidence: 0.30, rejected: false })));
    const result  = await makeService(bedrock, makeS3()).extractText('vague message');

    expect(result.confidence).toBe('low');
    expect(result.extracted).toBeNull();
  });
});

// ─── presign() ────────────────────────────────────────────────────────────────

describe('presign()', () => {
  it('returns sessionId, uploadUrl, and expiresIn', async () => {
    const s3      = makeS3();
    const bedrock = makeBedrock();
    const result  = await makeService(bedrock, s3).presign('image/jpeg');

    expect(result.sessionId).toBeTruthy();
    expect(result.uploadUrl).toBe('https://s3.example.com/upload');
    expect(result.expiresIn).toBe(300);
  });

  it('calls getPresignedUploadUrl with the given mimeType', async () => {
    const s3 = makeS3();
    await makeService(makeBedrock(), s3).presign('video/mp4');
    expect(s3.getPresignedUploadUrl).toHaveBeenCalledWith(
      expect.stringContaining('sessions/'),
      'video/mp4',
      300,
    );
  });
});

// ─── extractMedia() — image ───────────────────────────────────────────────────

describe('extractMedia() — image happy path', () => {
  it('returns extracted data and high confidence', async () => {
    const bedrock = makeBedrock(bedrockOutput(analysisJson(), MODEL_HAIKU, USAGE_LARGE));
    const result  = await makeService(bedrock, makeS3()).extractMedia('session-abc', 'image');

    expect(result.inputType).toBe('image');
    expect(result.confidence).toBe('high');
    expect(result.extracted).not.toBeNull();
  });

  it('includes usage with token counts and costUsd', async () => {
    const bedrock = makeBedrock(bedrockOutput(analysisJson(), MODEL_NOVA, USAGE_LARGE));
    const result  = await makeService(bedrock, makeS3()).extractMedia('session-abc', 'image');

    expect(result.usage.inputTokens).toBe(USAGE_LARGE.inputTokens);
    expect(result.usage.outputTokens).toBe(USAGE_LARGE.outputTokens);
    expect(result.usage.costUsd).toBeGreaterThan(0);
    expect(result.usage.modelId).toBe(MODEL_NOVA);
  });

  it('uses getObjectData (not headObject) for images', async () => {
    const s3      = makeS3();
    const bedrock = makeBedrock(bedrockOutput(analysisJson()));
    await makeService(bedrock, s3).extractMedia('session-abc', 'image');

    expect(s3.getObjectData).toHaveBeenCalledTimes(1);
    expect(s3.headObject).not.toHaveBeenCalled();
    expect(s3.getObjectUri).not.toHaveBeenCalled();
  });

  it('always deletes the S3 object', async () => {
    const s3 = makeS3();
    await makeService(makeBedrock(bedrockOutput(analysisJson())), s3).extractMedia('s1', 'image');
    expect(s3.deleteObject).toHaveBeenCalledTimes(1);
  });

  it('swallows S3 deleteObject errors', async () => {
    const s3 = makeS3(false);
    await expect(
      makeService(makeBedrock(bedrockOutput(analysisJson())), s3).extractMedia('s1', 'image'),
    ).resolves.toBeDefined();
  });
});

describe('extractMedia() — image rejection', () => {
  it('returns null extracted and rejectedReasons when rejected', async () => {
    const bedrock = makeBedrock(bedrockOutput(rejectedJson(['not_a_collection_document'])));
    const result  = await makeService(bedrock, makeS3()).extractMedia('s2', 'image');

    expect(result.extracted).toBeNull();
    expect(result.rejectedReasons).toContain('not_a_collection_document');
  });
});

// ─── extractMedia() — video ───────────────────────────────────────────────────

describe('extractMedia() — video path', () => {
  it('uses headObject and getObjectUri (not getObjectData) for videos', async () => {
    const s3      = makeS3();
    const bedrock = makeBedrock(bedrockOutput(analysisJson()));
    await makeService(bedrock, s3).extractMedia('session-vid', 'video');

    expect(s3.headObject).toHaveBeenCalledTimes(1);
    expect(s3.getObjectUri).toHaveBeenCalledTimes(1);
    expect(s3.getObjectData).not.toHaveBeenCalled();
  });

  it('passes the S3 URI to Bedrock invoke', async () => {
    const s3      = makeS3();
    const bedrock = makeBedrock(bedrockOutput(analysisJson()));
    await makeService(bedrock, s3).extractMedia('session-vid', 'video');

    expect(bedrock.invoke).toHaveBeenCalledWith(
      expect.objectContaining({ video: { s3Uri: 's3://bucket/sessions/test-id/media', format: 'mp4' } }),
      undefined,
    );
  });

  it('inputType is "video"', async () => {
    const bedrock = makeBedrock(bedrockOutput(analysisJson()));
    const result  = await makeService(bedrock, makeS3()).extractMedia('session-vid', 'video');
    expect(result.inputType).toBe('video');
  });

  it('always deletes the S3 object for videos', async () => {
    const s3 = makeS3();
    await makeService(makeBedrock(bedrockOutput(analysisJson())), s3).extractMedia('sv', 'video');
    expect(s3.deleteObject).toHaveBeenCalledTimes(1);
  });
});

// ─── confidence mapping ───────────────────────────────────────────────────────

describe('confidence mapping', () => {
  const cases: Array<[number, 'high' | 'medium' | 'low']> = [
    [0.95, 'high'],
    [0.75, 'high'],
    [0.74, 'medium'],
    [0.45, 'medium'],
    [0.44, 'low'],
    [0.00, 'low'],
  ];

  test.each(cases)('confidence %f → %s', async (raw, expected) => {
    const bedrock = makeBedrock(bedrockOutput(analysisJson({ confidence: raw, rejected: false })));
    const result  = await makeService(bedrock, makeS3()).extractText('msg');
    expect(result.confidence).toBe(expected);
  });
});
