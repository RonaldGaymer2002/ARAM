import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import {
  db,
  empresas,
  extracciones,
  mensajesRecolector,
  recolecciones,
} from '@fundares/db';
import { requireAdmin } from '@/lib/session';
import { z } from 'zod';

const ValidarSchema = z.object({
  extraccion_id: z.string().uuid(),
  accion: z.enum(['aprobar', 'rechazar', 'corregir']),
  correcciones: z
    .object({
      empresa_id: z.string().uuid().optional(),
      tipo_material: z.string().optional(),
      cantidad_kg: z.number().positive().optional(),
      fecha_recoleccion: z.string().optional(),
    })
    .optional(),
  validado_por: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  try {
    const body = await request.json();
    const { extraccion_id, accion, correcciones } = ValidarSchema.parse(body);
    const validadoPor = session.user.id;
    const database = db();

    const [extraccion] = await database
      .select()
      .from(extracciones)
      .where(eq(extracciones.id, extraccion_id))
      .limit(1);

    if (!extraccion) {
      return NextResponse.json({ error: 'Extracción no encontrada' }, { status: 404 });
    }

    if (accion === 'rechazar') {
      await database
        .update(extracciones)
        .set({ estado: 'rechazado', corregidoPor: validadoPor })
        .where(eq(extracciones.id, extraccion_id));

      if (extraccion.mensajeId) {
        await database
          .update(mensajesRecolector)
          .set({ estado: 'rechazado' })
          .where(eq(mensajesRecolector.id, extraccion.mensajeId));
      }

      return NextResponse.json({ ok: true, accion: 'rechazado' });
    }

    const datosFinales = {
      empresa_id: correcciones?.empresa_id ?? extraccion.empresaId,
      tipo_material: correcciones?.tipo_material ?? extraccion.tipoMaterial,
      cantidad_kg: correcciones?.cantidad_kg ?? Number(extraccion.cantidadKg),
      fecha_recoleccion: correcciones?.fecha_recoleccion ?? extraccion.fechaRecoleccion,
    };

    if (!datosFinales.empresa_id) {
      return NextResponse.json(
        { error: 'Se requiere empresa_id para aprobar' },
        { status: 400 }
      );
    }

    const [recoleccion] = await database
      .insert(recolecciones)
      .values({
        extraccionId: extraccion_id,
        empresaId: datosFinales.empresa_id,
        tipoMaterial: datosFinales.tipo_material,
        cantidadKg: String(datosFinales.cantidad_kg),
        fechaRecoleccion: datosFinales.fecha_recoleccion,
        validadoPor,
      })
      .returning();

    await database
      .update(extracciones)
      .set({
        estado: accion === 'corregir' ? 'corregido' : 'aprobado',
        empresaId: datosFinales.empresa_id,
        tipoMaterial: datosFinales.tipo_material,
        cantidadKg: String(datosFinales.cantidad_kg),
        fechaRecoleccion: datosFinales.fecha_recoleccion,
        corregidoPor: validadoPor,
      })
      .where(eq(extracciones.id, extraccion_id));

    if (extraccion.mensajeId) {
      await database
        .update(mensajesRecolector)
        .set({ estado: 'validado' })
        .where(eq(mensajesRecolector.id, extraccion.mensajeId));
    }

    return NextResponse.json({
      ok: true,
      recoleccion: recoleccion
        ? {
            id: recoleccion.id,
            extraccion_id: recoleccion.extraccionId,
            empresa_id: recoleccion.empresaId,
            tipo_material: recoleccion.tipoMaterial,
            cantidad_kg: Number(recoleccion.cantidadKg),
            fecha_recoleccion: recoleccion.fechaRecoleccion,
            validado_por: recoleccion.validadoPor,
            validado_at: recoleccion.validadoAt?.toISOString() ?? null,
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

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const rawEstado = searchParams.get('estado') ?? 'pendiente';
  const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'corregido'] as const;
  const estado = estadosValidos.includes(rawEstado as (typeof estadosValidos)[number])
    ? (rawEstado as (typeof estadosValidos)[number])
    : 'pendiente';

  const rows = await db()
    .select({
      id: extracciones.id,
      mensaje_id: extracciones.mensajeId,
      empresa_id: extracciones.empresaId,
      tipo_material: extracciones.tipoMaterial,
      cantidad_kg: extracciones.cantidadKg,
      fecha_recoleccion: extracciones.fechaRecoleccion,
      confianza_ia: extracciones.confianzaIa,
      datos_raw: extracciones.datosRaw,
      estado: extracciones.estado,
      corregido_por: extracciones.corregidoPor,
      created_at: extracciones.createdAt,
      empresa_nombre: empresas.nombre,
      contenido_texto: mensajesRecolector.contenidoTexto,
      fotos_urls: mensajesRecolector.fotosUrls,
      recibido_at: mensajesRecolector.recibidoAt,
    })
    .from(extracciones)
    .leftJoin(empresas, eq(extracciones.empresaId, empresas.id))
    .leftJoin(mensajesRecolector, eq(extracciones.mensajeId, mensajesRecolector.id))
    .where(eq(extracciones.estado, estado))
    .orderBy(desc(extracciones.createdAt));

  return NextResponse.json({
    data: rows.map((row) => ({
      id: row.id,
      mensaje_id: row.mensaje_id,
      empresa_id: row.empresa_id,
      tipo_material: row.tipo_material,
      cantidad_kg: Number(row.cantidad_kg),
      fecha_recoleccion: row.fecha_recoleccion,
      confianza_ia: row.confianza_ia ? Number(row.confianza_ia) : null,
      datos_raw: row.datos_raw,
      estado: row.estado,
      corregido_por: row.corregido_por,
      created_at: row.created_at?.toISOString() ?? null,
      empresas: row.empresa_nombre ? { nombre: row.empresa_nombre } : null,
      mensajes_recolector: {
        contenido_texto: row.contenido_texto,
        fotos_urls: row.fotos_urls,
        recibido_at: row.recibido_at?.toISOString() ?? null,
      },
    })),
  });
}
