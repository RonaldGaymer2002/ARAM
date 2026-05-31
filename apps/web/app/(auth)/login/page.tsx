'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error || !result?.ok) {
      toast.error('Credenciales incorrectas');
      setLoading(false);
      return;
    }

    const sessionRes = await fetch('/api/auth/session');
    const session    = await sessionRes.json();
    const rol        = session?.user?.rol;

    router.push(rol === 'admin' ? '/admin/dashboard' : '/empresa/dashboard');
    router.refresh();
  }

  return (
    <>
      {/* ── Left panel: form (1/3) ─────────────────── */}
      <div className="w-full lg:w-1/3 flex items-center justify-center min-h-screen bg-white px-8 py-12 relative z-10">
        <div className="w-full max-w-sm">

          {/* Logo + brand (mobile only) */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-[9px] bg-[#4BAF47] grid place-items-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20c0-9 7-15 16-15 0 9-6 15-15 15-1 0-1 0-1 0z"/>
                <path d="M4 20c4-6 8-9 12-11"/>
              </svg>
            </div>
            <div>
              <div className="font-extrabold text-[18px] text-[#1A1A18] leading-none">Fundares</div>
              <div className="text-[13px] text-[#6B6A62] font-semibold mt-0.5">Empresas</div>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-[#1A1A18] tracking-tight mb-1">Iniciar sesión</h1>
          <p className="text-sm text-[#6B6A62] mb-8">Ingresá con tu cuenta para continuar.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#E4E3DC] rounded-[9px] text-sm text-[#1A1A18] placeholder:text-[#B9B8B1] outline-none focus:border-[#4BAF47] focus:ring-1 focus:ring-[#4BAF47] transition-colors bg-white"
                placeholder="admin@fundares.org"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#E4E3DC] rounded-[9px] text-sm text-[#1A1A18] placeholder:text-[#B9B8B1] outline-none focus:border-[#4BAF47] focus:ring-1 focus:ring-[#4BAF47] transition-colors bg-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4BAF47] hover:bg-[#3d9a3a] text-white font-bold rounded-[9px] text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-xs text-[#B9B8B1] text-center mt-10">
            Fundación para el Reciclaje · Santa Cruz
          </p>
        </div>
      </div>

      {/* ── Right panel: branding + doodle (2/3, desktop only) ─── */}
      <div className="hidden lg:flex lg:w-2/3 relative overflow-hidden bg-[#4BAF47] items-center justify-center">

        {/* Doodle SVG background */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <symbol id="lp-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20c0-9 7-15 16-15 0 9-6 15-15 15-1 0-1 0-1 0z"/>
              <path d="M4 20c4-6 8-9 12-11"/>
            </symbol>
            <symbol id="lp-recycle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <polyline points="23 20 23 14 17 14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </symbol>
            <symbol id="lp-bottle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2h6M8 4l-1 3v13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7l-1-3"/>
              <line x1="7" y1="10" x2="17" y2="10"/>
            </symbol>
            <symbol id="lp-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </symbol>
            <symbol id="lp-paper" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="13" y2="17"/>
            </symbol>

            <pattern id="lp-tile-a" x="0" y="0" width="96" height="88" patternUnits="userSpaceOnUse">
              <g color="#fff" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <g transform="translate(14,16) rotate(-15)"><use href="#lp-leaf"    width="18" height="18" x="-9"  y="-9"/></g>
                <g transform="translate(66,9)  rotate(22)"> <use href="#lp-recycle" width="16" height="16" x="-8"  y="-8"/></g>
                <g transform="translate(84,50) rotate(-10)"><use href="#lp-bottle"  width="14" height="14" x="-7"  y="-7"/></g>
                <g transform="translate(30,54) rotate(8)">  <use href="#lp-box"     width="18" height="18" x="-9"  y="-9"/></g>
                <g transform="translate(8,72)  rotate(-20)"><use href="#lp-paper"   width="14" height="14" x="-7"  y="-7"/></g>
                <circle cx="54" cy="34" r="2" fill="currentColor" stroke="none"/>
                <circle cx="78" cy="76" r="2" fill="currentColor" stroke="none"/>
              </g>
            </pattern>

            <pattern id="lp-tile-b" x="48" y="44" width="120" height="108" patternUnits="userSpaceOnUse">
              <g color="#fff" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <g transform="translate(18,20) rotate(12)">  <use href="#lp-paper"   width="16" height="16" x="-8"  y="-8"/></g>
                <g transform="translate(80,12) rotate(-18)"> <use href="#lp-leaf"    width="18" height="18" x="-9"  y="-9"/></g>
                <g transform="translate(106,55) rotate(15)"> <use href="#lp-recycle" width="16" height="16" x="-8"  y="-8"/></g>
                <g transform="translate(44,74) rotate(-8)">  <use href="#lp-bottle"  width="14" height="14" x="-7"  y="-7"/></g>
                <g transform="translate(90,88) rotate(20)">  <use href="#lp-box"     width="16" height="16" x="-8"  y="-8"/></g>
                <circle cx="28" cy="56" r="2" fill="currentColor" stroke="none"/>
                <circle cx="66" cy="38" r="2" fill="currentColor" stroke="none"/>
              </g>
            </pattern>

            <pattern id="lp-tile-c" x="24" y="22" width="72" height="66" patternUnits="userSpaceOnUse">
              <g color="#fff" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <g transform="translate(10,12) rotate(-24)"><use href="#lp-leaf"   width="14" height="14" x="-7" y="-7"/></g>
                <g transform="translate(52,8)  rotate(18)"> <use href="#lp-bottle" width="12" height="12" x="-6" y="-6"/></g>
                <g transform="translate(58,46) rotate(-12)"><use href="#lp-paper"  width="12" height="12" x="-6" y="-6"/></g>
                <circle cx="28" cy="50" r="1.5" fill="currentColor" stroke="none"/>
              </g>
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#lp-tile-a)" opacity="0.18"/>
          <rect width="100%" height="100%" fill="url(#lp-tile-b)" opacity="0.14"/>
          <rect width="100%" height="100%" fill="url(#lp-tile-c)" opacity="0.12"/>
        </svg>

        {/* Branding content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm grid place-items-center mb-8 shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20c0-9 7-15 16-15 0 9-6 15-15 15-1 0-1 0-1 0z"/>
              <path d="M4 20c4-6 8-9 12-11"/>
            </svg>
          </div>
          <h2 className="text-5xl font-extrabold text-white tracking-tight leading-none mb-3">
            Fundares
          </h2>
          <p className="text-white/80 font-semibold text-lg mb-6 tracking-wide">
            Empresas
          </p>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Plataforma de gestión de recolección de materiales reciclables para empresas asociadas a la Fundación para el Reciclaje.
          </p>
        </div>
      </div>
    </>
  );
}
