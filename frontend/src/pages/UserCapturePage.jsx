/**
 * Pantalla inicial de captura de usuario (friccion cero).
 * Pide nombre opcional o genera ID anonimo al continuar.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';
import dimeIcon from '../assets/dime-icon.png';
import { initUserSession } from '../services/userService';
import { trackEvent } from '../services/analyticsService';

export function UserCapturePage({ onComplete }) {
  const [nombre, setNombre] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleContinuar = () => {
    const { id, name } = initUserSession(nombre || null);
    trackEvent('user_captured', { has_name: !!nombre, user_id: id });
    setSubmitted(true);
    onComplete();
  };

  const handleSkip = () => {
    initUserSession(null);
    trackEvent('user_captured', { has_name: false });
    setSubmitted(true);
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[5000] bg-white flex flex-col items-center justify-center p-6 font-sans"
    >
      <div className="w-full max-w-sm text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex justify-center mb-6"
        >
          <img src={dimeIcon} alt="DIME" className="w-20 h-20 object-contain" />
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-2xl font-bold text-gray-800 mb-2"
          style={{ color: '#1c528b' }}
        >
          Bienvenido a DIME
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-gray-500 text-sm mb-6"
        >
          ¿Cómo te llamas?
        </motion.p>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="space-y-4"
        >
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleContinuar()}
              placeholder="Tu nombre"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-gray-700 placeholder-gray-400"
              maxLength={50}
              autoFocus
            />
          </div>

          <button
            onClick={handleContinuar}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors active:scale-[0.98]"
          >
            Continuar
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkip}
            className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
          >
            Omitir y continuar como invitado
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
