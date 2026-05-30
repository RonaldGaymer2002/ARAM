import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db, recolecciones } from '@fundares/db';
import {
  calcularImpactoTotal,
  calcularKgPorMes,
  calcularPorMaterial,
} from '@/lib/metricas';
import { requireSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error || !session) return error;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') ?? new Date().getFullYear().toString();
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

  const rows = await db()
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

  const recoleccionesData = rows.map((row) => ({
    tipo_material: row.tipo_material,
    cantidad_kg: Number(row.cantidad_kg),
    fecha_recoleccion: row.fecha_recoleccion,
  }));

  const impacto = calcularImpactoTotal(recoleccionesData);
  const kgPorMes = calcularKgPorMes(recoleccionesData);
  const porMaterial = calcularPorMaterial(recoleccionesData);
  const totalKg = recoleccionesData.reduce((sum, r) => sum + r.cantidad_kg, 0);

  return NextResponse.json({
    totalKg: +totalKg.toFixed(1),
    impacto,
    kgPorMes,
    porMaterial,
    year,
  });
}
