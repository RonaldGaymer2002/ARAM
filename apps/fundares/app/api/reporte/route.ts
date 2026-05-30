import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db, empresas, recolecciones } from '@fundares/db';
import { calcularImpactoTotal } from '@/lib/metricas';
import { requireSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error || !session) return error;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') ?? new Date().getFullYear().toString();
  const prevYear = (parseInt(year, 10) - 1).toString();
  let empresaId = searchParams.get('empresa_id');

  if (session.user.rol === 'empresa') {
    if (!session.user.empresaId) {
      return NextResponse.json({ error: 'Empresa no asignada' }, { status: 400 });
    }
    empresaId = session.user.empresaId;
  }

  if (!empresaId) {
    return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 });
  }

  if (session.user.rol === 'empresa' && session.user.empresaId !== empresaId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [empresaRow] = await db()
    .select()
    .from(empresas)
    .where(eq(empresas.id, empresaId))
    .limit(1);

  if (!empresaRow) {
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
  }

  const recoleccionesRows = await db()
    .select({
      tipo_material: recolecciones.tipoMaterial,
      cantidad_kg: recolecciones.cantidadKg,
      fecha_recoleccion: recolecciones.fechaRecoleccion,
    })
    .from(recolecciones)
    .where(
      and(
        eq(recolecciones.empresaId, empresaId),
        gte(recolecciones.fechaRecoleccion, `${year}-01-01`),
        lte(recolecciones.fechaRecoleccion, `${year}-12-31`)
      )
    )
    .orderBy(recolecciones.fechaRecoleccion);

  const recoleccionesPrevRows = await db()
    .select({
      tipo_material: recolecciones.tipoMaterial,
      cantidad_kg: recolecciones.cantidadKg,
      fecha_recoleccion: recolecciones.fechaRecoleccion,
    })
    .from(recolecciones)
    .where(
      and(
        eq(recolecciones.empresaId, empresaId),
        gte(recolecciones.fechaRecoleccion, `${prevYear}-01-01`),
        lte(recolecciones.fechaRecoleccion, `${prevYear}-12-31`)
      )
    );

  const lista = recoleccionesRows.map((row) => ({
    tipo_material: row.tipo_material,
    cantidad_kg: Number(row.cantidad_kg),
    fecha_recoleccion: row.fecha_recoleccion,
  }));

  const listaPrev = recoleccionesPrevRows.map((row) => ({
    tipo_material: row.tipo_material,
    cantidad_kg: Number(row.cantidad_kg),
    fecha_recoleccion: row.fecha_recoleccion,
  }));

  const totalKg = lista.reduce((s, r) => s + r.cantidad_kg, 0);
  const totalKgPrev = listaPrev.reduce((s, r) => s + r.cantidad_kg, 0);
  const impacto = calcularImpactoTotal(lista);

  const porMes: Record<string, Record<string, number>> = {};
  for (const r of lista) {
    const mes = r.fecha_recoleccion.slice(0, 7);
    if (!porMes[mes]) porMes[mes] = {};
    porMes[mes][r.tipo_material] = (porMes[mes][r.tipo_material] ?? 0) + r.cantidad_kg;
  }

  const porMaterial: Record<string, number> = {};
  for (const r of lista) {
    porMaterial[r.tipo_material] = (porMaterial[r.tipo_material] ?? 0) + r.cantidad_kg;
  }

  const empresa = {
    id: empresaRow.id,
    nombre: empresaRow.nombre,
    logo_url: empresaRow.logoUrl,
    contacto_email: empresaRow.contactoEmail,
    created_at: empresaRow.createdAt?.toISOString() ?? null,
  };

  return NextResponse.json({
    empresa,
    year,
    totalKg: +totalKg.toFixed(1),
    totalKgPrevYear: +totalKgPrev.toFixed(1),
    variacionPct:
      totalKgPrev > 0
        ? +(((totalKg - totalKgPrev) / totalKgPrev) * 100).toFixed(1)
        : null,
    impacto,
    porMes,
    porMaterial,
    recolecciones: lista,
  });
}
