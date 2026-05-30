import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import {
  db,
  empresas,
  extracciones,
  mensajesRecolector,
} from '@fundares/db';
import { requireAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const estado = req.nextUrl.searchParams.get('estado') ?? 'pendiente';

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
      empresas: row.empresa_nombre ? { nombre: row.empresa_nombre } : undefined,
      mensajes_recolector: {
        contenido_texto: row.contenido_texto,
        fotos_urls: row.fotos_urls,
      },
    })),
  });
}
