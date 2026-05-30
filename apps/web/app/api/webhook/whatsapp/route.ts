import { NextRequest, NextResponse } from 'next/server';
import { db, mensajesRecolector } from '@fundares/db';
import { mirrorManyToBlob } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.formData().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const texto = (body.get('Body') as string | null) ?? '';
  const numMedia = parseInt((body.get('NumMedia') as string | null) ?? '0', 10);
  const twilioUrls: string[] = [];

  for (let i = 0; i < numMedia; i++) {
    const url = body.get(`MediaUrl${i}`) as string | null;
    if (url) twilioUrls.push(url);
  }

  const fotosUrls = twilioUrls.length
    ? await mirrorManyToBlob(twilioUrls, `whatsapp/${Date.now()}`)
    : [];

  const [mensaje] = await db()
    .insert(mensajesRecolector)
    .values({
      contenidoTexto: texto,
      fotosUrls,
      estado: 'pendiente',
    })
    .returning({ id: mensajesRecolector.id });

  if (!mensaje) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/extraer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.WEBHOOK_SECRET!,
    },
    body: JSON.stringify({ mensaje_id: mensaje.id }),
  }).catch(console.error);

  return new NextResponse('<?xml version="1.0"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}
