import { put } from '@vercel/blob';

function twilioAuthHeader() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return undefined;
  return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

export async function mirrorRemoteFileToBlob(sourceUrl: string, pathname: string) {
  const headers: HeadersInit = {};
  const auth = twilioAuthHeader();
  if (auth && sourceUrl.includes('twilio.com')) {
    headers.Authorization = auth;
  }

  const response = await fetch(sourceUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const buffer = Buffer.from(await response.arrayBuffer());

  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

export async function mirrorManyToBlob(urls: string[], prefix: string) {
  return Promise.all(
    urls.map(async (url, index) => {
      try {
        const ext = url.split('.').pop()?.split('?')[0] ?? 'jpg';
        return await mirrorRemoteFileToBlob(url, `${prefix}/${Date.now()}-${index}.${ext}`);
      } catch (error) {
        console.error('Blob upload failed for', url, error);
        return url;
      }
    })
  );
}
