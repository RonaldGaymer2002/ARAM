# Extraction API — Request & Response Reference

Base URL: `https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com/api/v1`

All responses are wrapped in `{ "data": T }`.  
All errors are wrapped in `{ "error": { "code": string, "message": string } }`.

---

## POST `/extract/text`

Extract recycling data from a plain text message.

### Request

```json
{
  "message": "Empresa ABC entregó 80kg de cartón y 45 botellas PET el 15/06/2026"
}
```

| Field     | Type     | Required | Description                        |
|-----------|----------|----------|------------------------------------|
| `message` | `string` | yes      | Raw text from the collector        |

### Response `200` — data extracted

```json
{
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "inputType": "text",
    "confidence": "high",
    "extracted": {
      "company": "Empresa ABC",
      "date": "2026-06-15",
      "materials": [
        { "type": "cartón", "quantity": 80, "unit": "kg" },
        { "type": "botellas PET", "quantity": 45, "unit": "unit" }
      ],
      "notes": null
    },
    "usage": {
      "inputTokens": 398,
      "outputTokens": 81,
      "costUsd": 0.00005698,
      "modelId": "us.amazon.nova-2-lite-v1:0"
    }
  }
}
```

### Response `422` — could not extract

```json
{
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "inputType": "text",
    "confidence": "low",
    "extracted": null,
    "rejectedReasons": ["no_collection_data"],
    "usage": {
      "inputTokens": 210,
      "outputTokens": 18,
      "costUsd": 0.00000928,
      "modelId": "us.amazon.nova-2-lite-v1:0"
    }
  }
}
```

---

## POST `/extract/presign`

Get a presigned S3 URL to upload a file directly from the browser.

### Request

```json
{
  "mimeType": "image/png"
}
```

| Field      | Type     | Required | Accepted values                                                      |
|------------|----------|----------|----------------------------------------------------------------------|
| `mimeType` | `string` | yes      | `image/jpeg` · `image/png` · `image/webp` · `video/mp4` · `video/quicktime` · `video/avi` · `video/x-matroska` |

### Response `200`

```json
{
  "data": {
    "sessionId": "f9f3b2dc-9bb4-4aa5-83b0-e277f25c6b9f",
    "uploadUrl": "https://fundares-prod-verification.s3.us-east-1.amazonaws.com/sessions/f9f3b2dc-.../media?X-Amz-...",
    "expiresIn": 300
  }
}
```

| Field       | Type     | Description                                               |
|-------------|----------|-----------------------------------------------------------|
| `sessionId` | `string` | Token to pass to `/extract/media` after uploading         |
| `uploadUrl` | `string` | Presigned S3 PUT URL — valid for `expiresIn` seconds      |
| `expiresIn` | `number` | Seconds until the URL expires (300 = 5 minutes)           |

### Upload the file (browser)

```typescript
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file,
});
```

> Do NOT add Authorization headers or extra params — S3 rejects them.

---

## POST `/extract/media`

Extract recycling data from an uploaded image or video.  
Call this **after** the S3 upload returns `200`.

### Request

```json
{
  "sessionId": "f9f3b2dc-9bb4-4aa5-83b0-e277f25c6b9f",
  "type": "image",
  "notes": "Empresa Verdesur, retiro del 15/06/2026. El remito está incompleto."
}
```

| Field       | Type                   | Required | Description                                                                 |
|-------------|------------------------|----------|-----------------------------------------------------------------------------|
| `sessionId` | `string`               | yes      | Value from `/extract/presign` response                                      |
| `type`      | `"image"` \| `"video"` | yes      | Must match what was uploaded                                                |
| `notes`     | `string`               | no       | Extra context from the user — injected into the extraction prompt. Use when the image/video doesn't clearly show company, date, or quantities. |

> `notes` is injected **after** the model's visual description (step 1) and before the structured extraction (step 2). It does not appear in the response.

### Response `200` — data extracted (image with document)

```json
{
  "data": {
    "sessionId": "f9f3b2dc-9bb4-4aa5-83b0-e277f25c6b9f",
    "inputType": "image",
    "confidence": "high",
    "extracted": {
      "company": "Recicladora del Sur S.R.L.",
      "date": "2026-06-15",
      "materials": [
        { "type": "papel", "quantity": 80, "unit": "kg" },
        { "type": "vidrio", "quantity": 30, "unit": "kg" }
      ],
      "notes": "Sello RECIBIDO visible"
    },
    "description": "The image shows a delivery receipt from Recicladora del Sur S.R.L. dated 15/06/2026, listing 80kg of papel and 30kg of vidrio. A RECIBIDO stamp is visible at the bottom.",
    "usage": {
      "inputTokens": 1104,
      "outputTokens": 95,
      "costUsd": 0.00014816,
      "modelId": "us.amazon.nova-2-lite-v1:0"
    }
  }
}
```

### Response `200` — data extracted (photo of products, no document)

Fields not visible in the photo are returned as `null` — never guessed.

```json
{
  "data": {
    "sessionId": "f9f3b2dc-9bb4-4aa5-83b0-e277f25c6b9f",
    "inputType": "image",
    "confidence": "medium",
    "extracted": {
      "company": null,
      "date": null,
      "materials": [
        { "type": "cartón", "quantity": null, "unit": null },
        { "type": "botellas PET", "quantity": null, "unit": null },
        { "type": "vidrio", "quantity": null, "unit": null }
      ],
      "notes": null
    },
    "description": "The image shows a pile of recyclable materials on a warehouse floor: flattened cardboard boxes, crushed PET bottles, and glass bottles separated into groups.",
    "usage": {
      "inputTokens": 987,
      "outputTokens": 72,
      "costUsd": 0.00012726,
      "modelId": "us.amazon.nova-2-lite-v1:0"
    }
  }
}
```

### Response `422` — could not extract

```json
{
  "data": {
    "sessionId": "f9f3b2dc-9bb4-4aa5-83b0-e277f25c6b9f",
    "inputType": "image",
    "confidence": "low",
    "extracted": null,
    "rejectedReasons": ["no_collection_data"],
    "description": "The image shows a landscape photograph with mountains and trees. No recycling materials or collection documents are visible.",
    "usage": {
      "inputTokens": 820,
      "outputTokens": 40,
      "costUsd": 0.00009800,
      "modelId": "us.amazon.nova-2-lite-v1:0"
    }
  }
}
```

---

## Confidence levels

| Value      | Meaning                                                      |
|------------|--------------------------------------------------------------|
| `"high"`   | Model confidence ≥ 0.75 — all key fields found              |
| `"medium"` | Model confidence 0.45–0.74 — some fields may be null        |
| `"low"`    | Model confidence < 0.45 — `extracted` is always `null`      |

---

## Rejected reasons

| Code                        | When it appears                                          |
|-----------------------------|----------------------------------------------------------|
| `no_collection_data`        | Input has no recycling materials or collection data      |
| `low_confidence`            | Model returned confidence below threshold, no reason set |
| `not_a_collection_document` | Image is a document but unrelated to recycling           |

---

## Error responses

### `400` Bad Request

```json
{
  "error": {
    "code": "MISSING_MESSAGE",
    "message": "\"message\" is required."
  }
}
```

### `415` Unsupported Media Type

```json
{
  "error": {
    "code": "UNSUPPORTED_MIME_TYPE",
    "message": "Unsupported mimeType \"image/gif\". Accepted: image/jpeg, image/png, image/webp, video/mp4, ..."
  }
}
```

### `500` Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

---

## Complete flow (TypeScript)

```typescript
const API = 'https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com/api/v1';

// ── Text ──────────────────────────────────────────────────────────────────────
async function extractFromText(message: string) {
  const res  = await fetch(`${API}/extract/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok && res.status !== 422) throw new Error(await res.text());
  const { data } = await res.json();
  return data; // ExtractionResult
}

// ── Image / Video ─────────────────────────────────────────────────────────────
async function extractFromFile(file: File, notes?: string) {
  const type = file.type.startsWith('video/') ? 'video' : 'image';

  // 1. Presign
  const presignRes = await fetch(`${API}/extract/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType: file.type }),
  });
  if (!presignRes.ok) throw new Error(await presignRes.text());
  const { data: presign } = await presignRes.json();

  // 2. Upload directly to S3
  const uploadRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`);

  // 3. Extract — pass notes only if provided
  const extractRes = await fetch(`${API}/extract/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: presign.sessionId,
      type,
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
    }),
  });
  if (!extractRes.ok && extractRes.status !== 422) throw new Error(await extractRes.text());
  const { data } = await extractRes.json();
  return data; // ExtractionResult
}
```
