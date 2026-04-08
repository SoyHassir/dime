/**
 * Pantalla inicial de captura de usuario (friccion cero).
 * Pide nombre opcional o genera ID anonimo al continuar.
 */

import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';
import dimeIcon from '../assets/dime-icon.png';
import { initUserSession } from '../services/userService';
import { trackEvent } from '../services/analyticsService';

export function UserCapturePage({ onComplete }) {
  const [nombre, setNombre] = useState('');

  const handleContinuar = () => {
    const { id } = initUserSession(nombre || null);
    trackEvent('user_captured', { has_name: !!nombre, user_id: id });
    onComplete();
  };

  const handleSkip = () => {
    initUserSession(null);
    trackEvent('user_captured', { has_name: false });
    onComplete();
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-surface p-6 font-sans"
    >
      <div className="w-full max-w-sm text-center">
        <Motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          className="mb-6 flex justify-center"
        >
          <div className="rounded-dime-2xl bg-dime-50 p-5 shadow-dime-sm">
            <img src={dimeIcon} alt="DIME" className="h-16 w-16 object-contain" />
          </div>
        </Motion.div>

        <Motion.h1
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.14, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          className="mb-2 text-2xl font-bold text-dime-600"
        >
          Bienvenido a DIME
        </Motion.h1>

        <Motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          className="mb-6 text-sm text-fg-muted"
        >
          ¿Cómo te llamas?
        </Motion.p>

        <Motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          className="space-y-4"
        >
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-subtle" />
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleContinuar()}
              placeholder="Tu nombre"
              className="w-full rounded-dime-xl border border-border bg-surface py-3 pl-12 pr-4 text-fg outline-none transition-[box-shadow,border-color] placeholder:text-fg-subtle focus:border-dime-500 focus:ring-2 focus:ring-dime-100"
              maxLength={50}
              autoFocus
              aria-label="Tu nombre"
            />
          </div>

          <button
            type="button"
            onClick={handleContinuar}
            className="flex w-full items-center justify-center gap-2 rounded-dime-xl bg-dime-600 py-3 font-semibold text-fg-on-dime shadow-dime-sm transition-[transform,background-color] hover:bg-dime-700 active:scale-[0.99]"
          >
            Continuar
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-2 text-sm text-fg-subtle transition-colors hover:text-fg-muted"
          >
            Omitir y continuar como invitado
          </button>
        </Motion.div>
      </div>
    </Motion.div>
  );
}
