import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  db,
  extracciones,
  mensajesRecolector,
  recolecciones,
} from '@fundares/db';
import { requireAdmin } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const body = await req.json() as {
    extraccion_id: string;
    accion: 'aprobar' | 'rechazar' | 'corregir';
    empresa_id?: string;
    tipo_material?: string;
    cantidad_kg?: number;
    fecha_recoleccion?: string;
  };

  const database = db();

  if (body.accion === 'rechazar') {
    const [ext] = await database
      .select({ mensajeId: extracciones.mensajeId })
      .from(extracciones)
      .where(eq(extracciones.id, body.extraccion_id))
      .limit(1);

    await database
      .update(extracciones)
      .set({ estado: 'rechazado', corregidoPor: session.user.id })
      .where(eq(extracciones.id, body.extraccion_id));

    if (ext?.mensajeId) {
      await database
        .update(mensajesRecolector)
        .set({ estado: 'rechazado' })
        .where(eq(mensajesRecolector.id, ext.mensajeId));
    }

    return NextResponse.json({ ok: true });
  }

  const [ext] = await database
    .select()
    .from(extracciones)
    .where(eq(extracciones.id, body.extraccion_id))
    .limit(1);

  if (!ext) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tipoMaterial = body.tipo_material ?? ext.tipoMaterial;
  const cantidadKg = body.cantidad_kg ?? Number(ext.cantidadKg);
  const fechaRecoleccion = body.fecha_recoleccion ?? ext.fechaRecoleccion;
  const empresaId = body.empresa_id ?? ext.empresaId;
  const estado = body.accion === 'corregir' ? 'corregido' : 'aprobado';

  await database
    .update(extracciones)
    .set({
      estado,
      tipoMaterial,
      cantidadKg: String(cantidadKg),
      fechaRecoleccion,
      empresaId,
      corregidoPor: session.user.id,
    })
    .where(eq(extracciones.id, body.extraccion_id));

  if (empresaId) {
    await database.insert(recolecciones).values({
      extraccionId: body.extraccion_id,
      empresaId,
      tipoMaterial,
      cantidadKg: String(cantidadKg),
      fechaRecoleccion,
      validadoPor: session.user.id,
    });
  }

  if (ext.mensajeId) {
    await database
      .update(mensajesRecolector)
      .set({ estado: 'validado' })
      .where(eq(mensajesRecolector.id, ext.mensajeId));
  }

  return NextResponse.json({ ok: true });
}
