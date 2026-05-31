import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { DoodleBackground } from '@/components/DoodleBackground';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');
  if (session.user.rol !== 'admin') redirect('/empresa/dashboard');

  return (
    <div className="flex min-h-screen">
      <Sidebar rol="admin" />
      <main className="relative flex-1 overflow-auto">
        <DoodleBackground />
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}
