import { NextRequest, NextResponse } from 'next/server';
import { eq, ilike } from 'drizzle-orm';
import { db, empresas, extracciones, mensajesRecolector } from '@fundares/db';
import { extraerDatosDeTexto } from '@/lib/claude';
import { extraerTextoDeImagenes } from '@/lib/ocr';
import { z } from 'zod';

const ExtraerSchema = z.object({
  mensaje_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { mensaje_id } = ExtraerSchema.parse(body);
    const database = db();

    const [mensaje] = await database
      .select()
      .from(mensajesRecolector)
      .where(eq(mensajesRecolector.id, mensaje_id))
      .limit(1);

    if (!mensaje) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    await database
      .update(mensajesRecolector)
      .set({ estado: 'procesando' })
      .where(eq(mensajesRecolector.id, mensaje_id));

    const textoOcr = await extraerTextoDeImagenes(mensaje.fotosUrls ?? []);
    const extraccion = await extraerDatosDeTexto(
      mensaje.contenidoTexto ?? '',
      textoOcr || undefined
    );

    let empresaId: string | null = null;
    if (extraccion.empresa) {
      const [emp] = await database
        .select({ id: empresas.id })
        .from(empresas)
        .where(ilike(empresas.nombre, `%${extraccion.empresa}%`))
        .limit(1);
      empresaId = emp?.id ?? null;
    }

    const [savedExtraccion] = await database
      .insert(extracciones)
      .values({
        mensajeId: mensaje_id,
        empresaId,
        tipoMaterial: extraccion.tipo_material ?? 'desconocido',
        cantidadKg: String(extraccion.cantidad_kg ?? 0),
        fechaRecoleccion:
          extraccion.fecha ?? new Date().toISOString().split('T')[0],
        confianzaIa: String(extraccion.confianza),
        datosRaw: extraccion as unknown as Record<string, unknown>,
        estado: 'pendiente',
      })
      .returning();

    await database
      .update(mensajesRecolector)
      .set({ estado: 'extraido' })
      .where(eq(mensajesRecolector.id, mensaje_id));

    return NextResponse.json({
      extraccion: savedExtraccion
        ? {
            id: savedExtraccion.id,
            mensaje_id: savedExtraccion.mensajeId,
            empresa_id: savedExtraccion.empresaId,
            tipo_material: savedExtraccion.tipoMaterial,
            cantidad_kg: Number(savedExtraccion.cantidadKg),
            fecha_recoleccion: savedExtraccion.fechaRecoleccion,
            confianza_ia: savedExtraccion.confianzaIa
              ? Number(savedExtraccion.confianzaIa)
              : null,
            datos_raw: savedExtraccion.datosRaw,
            estado: savedExtraccion.estado,
            created_at: savedExtraccion.createdAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
