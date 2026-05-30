import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');
  if (session.user.rol !== 'admin') redirect('/empresa/dashboard');

  return (
    <div className="flex min-h-screen">
      <Sidebar rol="admin" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
