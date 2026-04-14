import React, { useState, useEffect } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import dimeIcon from '../../assets/dime-icon.png';
import { PRELOADER_MIN_MS } from '../../constants/uiTiming';

export const Preloader = () => {
  const [mensaje, setMensaje] = useState('Iniciando DIME...');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const mensajes = [
      'Conectando con Santiago de Tolú...',
      'Cargando directorio público...',
      'Preparando el mapa...',
      '¡Todo listo!',
    ];

    let i = 0;
    const interval = setInterval(() => {
      setMensaje(mensajes[i]);
      i = (i + 1) % mensajes.length;
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const duracionBarraS = PRELOADER_MIN_MS / 1000;

  return (
    <Motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
      className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-surface font-sans"
    >
      <Motion.div
        animate={
          prefersReducedMotion
            ? { opacity: 1, scale: 1 }
            : {
                scale: [1, 1.06, 1],
                opacity: [1, 0.92, 1],
              }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                repeat: Infinity,
                duration: 2,
                ease: [0.45, 0, 0.55, 1],
              }
        }
        className="mb-3 rounded-full bg-dime-50 p-6 shadow-dime-md"
      >
        <img src={dimeIcon} alt="DIME" className="h-16 w-16 object-contain" />
      </Motion.div>

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-dime-600">D I M E</h1>

      <p
        className={`text-sm font-medium text-fg-muted ${prefersReducedMotion ? '' : 'animate-pulse'}`}
      >
        {mensaje}
      </p>

      <div className="mt-8 h-1 w-36 overflow-hidden rounded-full bg-surface-muted">
        <Motion.div
          className="h-full rounded-full bg-dime-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: duracionBarraS, ease: [0.45, 0, 0.55, 1] }}
        />
      </div>

      <div className="absolute bottom-8 max-w-xs text-center text-xs text-fg-subtle">
        Conectando a Tolú con tecnología
      </div>
    </Motion.div>
  );
};
