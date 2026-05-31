'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, CheckSquare, Building2, BarChart3,
  BookOpen, FileText, LogOut, Recycle, PlusCircle,
  Database, MonitorPlay
} from 'lucide-react';

const adminNav = [
  { href: '/admin/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/validacion', label: 'Validación',  icon: CheckSquare },
  { href: '/admin/empresas',   label: 'Empresas',    icon: Building2 },
  { href: '/empresa/extraer',  label: 'Recolectar',  icon: PlusCircle },
  { href: '/empresa/educacion',label: 'Educación',   icon: BookOpen },
  { href: '/admin/reportes',   label: 'Reportes',    icon: BarChart3 },
  { href: '/admin/ingreso-datos', label: 'Ingreso de datos', icon: Database },
  { href: '/admin/demostracion',  label: 'Demostración',     icon: MonitorPlay },
];

const empresaNav = [
  { href: '/empresa/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/empresa/extraer',   label: 'Recolectar', icon: PlusCircle },
  { href: '/empresa/educacion', label: 'Educación',  icon: BookOpen },
  { href: '/empresa/reportes',  label: 'Reportes',   icon: FileText },
  { href: '/empresa/ingreso-datos', label: 'Ingreso de datos', icon: Database },
  { href: '/empresa/demostracion',  label: 'Demostración',     icon: MonitorPlay },
];

export function Sidebar({ rol }: { rol: 'admin' | 'empresa' }) {
  const pathname = usePathname();
  const router   = useRouter();
  const nav      = rol === 'admin' ? adminNav : empresaNav;

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-border-default flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 flex items-center gap-3 border-b border-border-default">
        <div className="w-9 h-9 bg-green-primary rounded-[8px] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
            <path d="M12 22V12M12 12C12 7 7 5 3 7M12 12C12 7 17 5 21 7"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <div>
          <p className="font-extrabold text-[15px] text-black-heading tracking-tight leading-none mb-1">Fundares</p>
          <p className="text-[11px] font-semibold text-body-text uppercase tracking-widest leading-none">{rol}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-[5px] text-sm transition-colors',
              pathname === href
                ? 'bg-green-light text-green-primary font-bold'
                : 'text-body-text font-semibold hover:bg-bg-page hover:text-black-heading',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[5px] text-sm font-semibold text-body-text hover:bg-bg-page hover:text-black-heading w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
