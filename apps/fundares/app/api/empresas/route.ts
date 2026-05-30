import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db, empresas } from '@fundares/db';
import { requireAdmin } from '@/lib/session';
import { z } from 'zod';

const EmpresaSchema = z.object({
  nombre: z.string().min(1),
  logo_url: z.string().url().optional(),
  contacto_email: z.string().email().optional(),
});

function mapEmpresa(row: typeof empresas.$inferSelect) {
  return {
    id: row.id,
    nombre: row.nombre,
    logo_url: row.logoUrl,
    contacto_email: row.contactoEmail,
    created_at: row.createdAt?.toISOString() ?? null,
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await db().select().from(empresas).orderBy(asc(empresas.nombre));
  return NextResponse.json({ data: rows.map(mapEmpresa) });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = EmpresaSchema.parse(body);
    const [row] = await db()
      .insert(empresas)
      .values({
        nombre: parsed.nombre,
        logoUrl: parsed.logo_url ?? null,
        contactoEmail: parsed.contacto_email ?? null,
      })
      .returning();

    return NextResponse.json({ data: mapEmpresa(row) }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  try {
    const body = await request.json();
    const parsed = EmpresaSchema.partial().parse(body);
    const [row] = await db()
      .update(empresas)
      .set({
        nombre: parsed.nombre,
        logoUrl: parsed.logo_url,
        contactoEmail: parsed.contacto_email,
      })
      .where(eq(empresas.id, id))
      .returning();

    return NextResponse.json({ data: mapEmpresa(row) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  await db().delete(empresas).where(eq(empresas.id, id));
  return NextResponse.json({ ok: true });
}
