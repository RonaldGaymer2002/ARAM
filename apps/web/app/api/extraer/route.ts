import { NextRequest, NextResponse } from 'next/server';
import { eq, ilike } from 'drizzle-orm';
import { db, empresas, extracciones, mensajesRecolector } from '@fundares/db';
import { extraerDatosReciclaje } from '@/lib/claude';
import { extraerTextoMultiplesImagenes } from '@/lib/ocr';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mensaje_id } = await req.json() as { mensaje_id: string };
  const database = db();

  await database
    .update(mensajesRecolector)
    .set({ estado: 'procesando' })
    .where(eq(mensajesRecolector.id, mensaje_id));

  const [mensaje] = await database
    .select()
    .from(mensajesRecolector)
    .where(eq(mensajesRecolector.id, mensaje_id))
    .limit(1);

  if (!mensaje) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  try {
    let textoOcr = '';
    if (mensaje.fotosUrls?.length) {
      textoOcr = await extraerTextoMultiplesImagenes(mensaje.fotosUrls);
    }

    const texto = mensaje.contenidoTexto ?? '';
    const { datos, confianza } = await extraerDatosReciclaje(texto, textoOcr || undefined);

    let empresaId: string | null = null;
    if (datos.empresa) {
      const [emp] = await database
        .select({ id: empresas.id })
        .from(empresas)
        .where(ilike(empresas.nombre, `%${datos.empresa}%`))
        .limit(1);
      empresaId = emp?.id ?? null;
    }

    if (datos.tipo_material && datos.cantidad_kg && datos.fecha) {
      await database.insert(extracciones).values({
        mensajeId: mensaje_id,
        empresaId,
        tipoMaterial: datos.tipo_material,
        cantidadKg: String(datos.cantidad_kg),
        fechaRecoleccion: datos.fecha,
        confianzaIa: String(confianza),
        datosRaw: datos as unknown as Record<string, unknown>,
        estado: 'pendiente',
      });
    }

    await database
      .update(mensajesRecolector)
      .set({ estado: 'extraido' })
      .where(eq(mensajesRecolector.id, mensaje_id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Extraction error:', err);
    await database
      .update(mensajesRecolector)
      .set({ estado: 'rechazado' })
      .where(eq(mensajesRecolector.id, mensaje_id));
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
