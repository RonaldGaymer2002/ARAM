import { NextRequest, NextResponse } from 'next/server';
import { db, mensajesRecolector } from '@fundares/db';
import { mirrorManyToBlob } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body = formData.get('Body')?.toString() ?? '';
    const numMedia = parseInt(formData.get('NumMedia')?.toString() ?? '0', 10);

    const twilioUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const url = formData.get(`MediaUrl${i}`)?.toString();
      if (url) twilioUrls.push(url);
    }

    const fotosUrls = twilioUrls.length
      ? await mirrorManyToBlob(twilioUrls, `whatsapp/${Date.now()}`)
      : [];

    const [mensaje] = await db()
      .insert(mensajesRecolector)
      .values({
        contenidoTexto: body || null,
        fotosUrls: fotosUrls.length > 0 ? fotosUrls : null,
        estado: 'pendiente',
      })
      .returning({ id: mensajesRecolector.id });

    if (!mensaje) {
      console.error('Error saving message');
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    fetch(`${appUrl}/api/extraer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.WEBHOOK_SECRET!,
      },
      body: JSON.stringify({ mensaje_id: mensaje.id }),
    }).catch(console.error);

    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' }, status: 200 }
    );
  } catch (err) {
    console.error('Webhook error:', err);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' }, status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Webhook active' });
}
