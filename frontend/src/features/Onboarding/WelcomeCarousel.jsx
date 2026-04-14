import React, { useState } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MapPin, Mic, WifiOff, ArrowRight, Check } from 'lucide-react';

const EASE = [0.33, 1, 0.68, 1];
const DURATION = 0.38;

export const WelcomeCarousel = ({ onComplete }) => {
  const [paso, setPaso] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const slides = [
    {
      id: 1,
      titulo: 'Tolú en tu mano',
      texto:
        'Encuentra colegios, puestos de salud y oficinas públicas en un solo lugar. Todo georreferenciado.',
      Icon: MapPin,
      circleClass: 'bg-dime-100',
      iconClass: 'text-dime-700',
    },
    {
      id: 2,
      titulo: 'Habla con DIME-IA',
      texto:
        '¿No quieres escribir? Presiona el micrófono y DIME-IA te escuchará para guiarte.',
      Icon: Mic,
      circleClass: 'bg-dime-100',
      iconClass: 'text-dime-700',
    },
    {
      id: 3,
      titulo: '¿Sin acceso a Internet?',
      texto:
        'No importa. DIME-IA guarda el directorio en tu celular para que lo consultes en cualquier lugar.',
      Icon: WifiOff,
      circleClass: 'bg-dime-100',
      iconClass: 'text-dime-700',
    },
  ];

  const siguientePaso = () => {
    if (paso < slides.length - 1) {
      setPaso(paso + 1);
    } else {
      onComplete();
    }
  };

  const slideAnim = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { x: 36, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -28, opacity: 0 },
        transition: { duration: DURATION, ease: EASE },
      };

  const iconAnim = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: 0.05 },
      }
    : {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.45, delay: 0.08, ease: EASE },
      };

  const textAnim = (delay) =>
    prefersReducedMotion
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2, delay: delay * 0.3 },
        }
      : {
          initial: { y: 12, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { duration: DURATION, delay, ease: EASE },
        };

  const s = slides[paso];
  const Icon = s.Icon;

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col items-center justify-between bg-surface p-8 font-sans">
      <button
        type="button"
        onClick={onComplete}
        className="self-end text-sm font-medium text-fg-subtle transition-colors hover:text-fg-muted"
      >
        Saltar
      </button>

      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <Motion.div
            key={paso}
            initial={slideAnim.initial}
            animate={slideAnim.animate}
            exit={slideAnim.exit}
            transition={slideAnim.transition}
            className="flex flex-col items-center"
          >
            <Motion.div
              initial={iconAnim.initial}
              animate={iconAnim.animate}
              transition={iconAnim.transition}
              className={`mb-8 rounded-full p-8 shadow-dime-sm ${s.circleClass}`}
            >
              <Icon className={`h-16 w-16 ${s.iconClass}`} strokeWidth={2} aria-hidden />
            </Motion.div>

            <Motion.h2
              initial={textAnim(0.12).initial}
              animate={textAnim(0.12).animate}
              transition={textAnim(0.12).transition}
              className="mb-4 text-2xl font-bold leading-tight text-fg"
            >
              {s.titulo}
            </Motion.h2>
            <Motion.p
              initial={textAnim(0.2).initial}
              animate={textAnim(0.2).animate}
              transition={textAnim(0.2).transition}
              className="leading-relaxed text-fg-muted"
            >
              {s.texto}
            </Motion.p>
          </Motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex w-full max-w-sm items-center justify-between">
        <div className="flex gap-2" aria-label="Pasos del tutorial" role="group">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === paso ? 'w-8 bg-dime-600' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={siguientePaso}
          aria-label={paso === slides.length - 1 ? 'Empezar' : 'Siguiente'}
          className="flex items-center justify-center rounded-full bg-dime-600 p-4 text-fg-on-dime shadow-dime-md transition-[transform,background-color] hover:bg-dime-700 active:scale-[0.96]"
        >
          {paso === slides.length - 1 ? (
            <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
          ) : (
            <ArrowRight className="h-6 w-6" strokeWidth={2.5} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
};
