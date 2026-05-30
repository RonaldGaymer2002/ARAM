import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { Rol } from '@/lib/database.types';

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireRole(rol: Rol) {
  const { session, error } = await requireSession();
  if (error || !session) {
    return { session: null, error: error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (session.user.rol !== rol) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  return requireRole('admin');
}
