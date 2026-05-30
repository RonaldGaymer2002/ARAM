import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db, empresas } from '@fundares/db';
import { requireAdmin, requireSession } from '@/lib/session';

export async function GET() {
  const { session, error } = await requireSession();
  if (error || !session) return error;

  const rows = await db()
    .select()
    .from(empresas)
    .orderBy(asc(empresas.nombre));

  return NextResponse.json({
    data: rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      logo_url: row.logoUrl,
      contacto_email: row.contactoEmail,
      created_at: row.createdAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const body = await req.json() as { nombre: string; contacto_email?: string };
  const [row] = await db()
    .insert(empresas)
    .values({
      nombre: body.nombre,
      contactoEmail: body.contacto_email ?? null,
    })
    .returning();

  return NextResponse.json(
    {
      data: {
        id: row.id,
        nombre: row.nombre,
        logo_url: row.logoUrl,
        contacto_email: row.contactoEmail,
        created_at: row.createdAt?.toISOString() ?? null,
      },
    },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error || !session) return error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await db().delete(empresas).where(eq(empresas.id, id));
  return NextResponse.json({ ok: true });
}
