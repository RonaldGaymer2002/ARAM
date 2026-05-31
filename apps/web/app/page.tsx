'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Recycle, ArrowRight, Leaf, BarChart3, Users } from 'lucide-react';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.6')
      .from('.hero-cta', { scale: 0.9, opacity: 0, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.4')
      .from('.feature-card', { y: 40, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' }, '-=0.2');
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-bg-page font-sans text-body-text overflow-hidden selection:bg-green-primary/20">
      
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-default/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-primary rounded-lg flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-black-heading text-lg tracking-tight">Fundares</span>
          </div>
          <div>
            <Link 
              href="/login" 
              className="text-sm font-semibold text-black-heading hover:text-green-primary transition-colors flex items-center gap-1"
            >
              Iniciar sesión <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div 
            className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-light border border-green-primary/20 text-green-primary font-medium text-xs uppercase tracking-widest"
            whileHover={{ scale: 1.05 }}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Plataforma de Sostenibilidad</span>
          </motion.div>
          
          <h1 className="hero-title text-5xl md:text-7xl font-extrabold text-black-heading tracking-tight leading-[1.1]">
            El futuro del <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-primary to-green-400">reciclaje</span> corporativo
          </h1>
          
          <p className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Fundares conecta a las empresas con la conservación. Registra recolecciones con IA, mide tu impacto ambiental y valida tu compromiso verde en segundos.
          </p>

          <div className="hero-cta pt-4">
            <Link href="/login">
              <button className="bg-green-primary hover:bg-[image:var(--gradient-brand)] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-green-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 mx-auto">
                Comenzar ahora
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-white border-t border-border-default/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Recycle className="w-6 h-6 text-green-primary" />}
              title="Extracción Inteligente"
              description="Sube comprobantes en texto, imagen o video. Nuestra IA extrae los materiales y cantidades automáticamente."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-accent-blue" />}
              title="Métricas de Impacto"
              description="Visualiza en tiempo real los kilogramos de CO₂ evitados y los litros de agua ahorrados por tu empresa."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-warning-amber" />}
              title="Validación Ágil"
              description="Flujo de aprobación rápido y transparente para certificar el compromiso de tu organización."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-body-text bg-bg-page border-t border-border-default">
        <p>© {new Date().getFullYear()} Fundación Amigos de la Naturaleza (Fundares). Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="feature-card bg-bg-page/50 border border-border-default rounded-2xl p-8 hover:bg-white hover:shadow-card transition-all duration-300 group">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-border-default flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-black-heading mb-3">{title}</h3>
      <p className="text-body-text leading-relaxed text-[15px]">{description}</p>
    </div>
  );
}
