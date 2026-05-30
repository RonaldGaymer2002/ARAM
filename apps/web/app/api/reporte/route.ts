import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db, empresas, recolecciones } from '@fundares/db';
import { generarReportePDF } from '@/lib/pdf';
import { requireSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error || !session) return error;

  const empresaId = req.nextUrl.searchParams.get('empresa_id') ?? session.user.empresaId;
  const anio = parseInt(req.nextUrl.searchParams.get('anio') ?? String(new Date().getFullYear()), 10);

  if (!empresaId) return NextResponse.json({ error: 'empresa_id required' }, { status: 400 });
  if (session.user.rol === 'empresa' && session.user.empresaId !== empresaId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [empresaRow] = await db()
    .select()
    .from(empresas)
    .where(eq(empresas.id, empresaId))
    .limit(1);

  const recoleccionesRows = await db()
    .select()
    .from(recolecciones)
    .where(
      and(
        eq(recolecciones.empresaId, empresaId),
        gte(recolecciones.fechaRecoleccion, `${anio}-01-01`),
        lte(recolecciones.fechaRecoleccion, `${anio}-12-31`)
      )
    );

  if (!empresaRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const empresa = {
    id: empresaRow.id,
    nombre: empresaRow.nombre,
    logo_url: empresaRow.logoUrl,
    contacto_email: empresaRow.contactoEmail,
    created_at: empresaRow.createdAt?.toISOString() ?? '',
  };

  const recoleccionesData = recoleccionesRows.map((row) => ({
    id: row.id,
    extraccion_id: row.extraccionId,
    empresa_id: row.empresaId,
    tipo_material: row.tipoMaterial,
    cantidad_kg: Number(row.cantidadKg),
    fecha_recoleccion: row.fechaRecoleccion,
    validado_por: row.validadoPor,
    validado_at: row.validadoAt?.toISOString() ?? '',
  }));

  const pdfBytes = await generarReportePDF(empresa, recoleccionesData, anio);

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${empresa.nombre}-${anio}.pdf"`,
    },
  });
}
