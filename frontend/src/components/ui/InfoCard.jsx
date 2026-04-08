import React from 'react';
import { motion as Motion } from 'framer-motion';
import { MapPin, Clock, Phone, X } from 'lucide-react';

const EASE = [0.33, 1, 0.68, 1];

export const InfoCard = ({ titulo, categoria, direccion, onClose }) => {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.98 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative w-full rounded-dime-2xl border border-border bg-surface p-6 shadow-dime-lg"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-surface-muted p-2 text-fg-subtle transition-colors hover:bg-border hover:text-fg"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-3 inline-block rounded-full bg-dime-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-dime-700">
        {categoria}
      </div>

      <h3 className="mb-4 pr-8 text-2xl font-bold leading-tight text-fg">{titulo}</h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3 text-fg-muted">
          <div className="shrink-0 rounded-full bg-surface-muted p-1.5">
            <MapPin className="h-4 w-4 text-dime-600" />
          </div>
          <p className="mt-0.5 text-sm leading-snug">
            {direccion || 'Dirección no disponible en el registro.'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-fg-muted">
          <div className="shrink-0 rounded-full bg-surface-muted p-1.5">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <p className="text-sm">08:00 AM - 04:00 PM</p>
        </div>
      </div>

      <a
        href="tel:+573001234567"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-dime-xl bg-dime-600 py-3 font-semibold text-fg-on-dime no-underline shadow-dime-sm transition-[transform,background-color] hover:bg-dime-700 active:scale-[0.99]"
        onClick={(e) => {
          window.location.href = 'tel:+573001234567';
          e.preventDefault();
        }}
      >
        <Phone className="h-4 w-4" />
        Contactar
      </a>
    </Motion.div>
  );
};
