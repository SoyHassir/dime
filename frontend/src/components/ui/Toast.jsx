import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const ICON_BY_VARIANT = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
};

const STYLES_BY_VARIANT = {
  info: {
    wrap: 'bg-surface text-fg',
    icon: 'text-dime-600',
  },
  success: {
    wrap: 'bg-success-muted text-fg',
    icon: 'text-success',
  },
  warning: {
    wrap: 'bg-warning-muted text-fg',
    icon: 'text-warning',
  },
  error: {
    wrap: 'bg-danger-muted text-fg',
    icon: 'text-danger',
  },
};

const EASE = [0.33, 1, 0.68, 1];

export function Toast({ open, variant = 'info', message, onClose, autoHideMs = 4500 }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    if (!autoHideMs) return;
    const t = setTimeout(() => onClose?.(), autoHideMs);
    return () => clearTimeout(t);
  }, [open, autoHideMs, onClose]);

  const Icon = ICON_BY_VARIANT[variant] ?? Info;
  const styles = STYLES_BY_VARIANT[variant] ?? STYLES_BY_VARIANT.info;

  // Misma cáscara que el navbar (HomePage): inset-x-4 top-4 + flex justify-center + hijo w-full → mismo ancho y centrado en el área útil (#root + safe-area).
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-[5001] flex justify-center">
      <div className="w-full min-w-0">
        <AnimatePresence>
          {open && (
            <Motion.div
              key="dime-toast"
              initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      y: -6,
                      transition: { duration: 0.18, ease: EASE },
                    }
              }
              transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: EASE }}
              style={{ width: '100%', maxWidth: '100%' }}
              className={`pointer-events-auto box-border flex min-h-14 w-full min-w-0 max-w-none flex-nowrap items-start gap-3 overflow-hidden rounded-dime-2xl border border-border/80 px-4 py-3 shadow-dime-md backdrop-blur-md sm:px-5 ${styles.wrap}`}
              role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
              aria-live={variant === 'error' || variant === 'warning' ? 'assertive' : 'polite'}
            >
            <div className="mt-0.5 shrink-0">
              <Icon className={`h-5 w-5 ${styles.icon}`} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 whitespace-pre-line break-words text-sm font-medium leading-snug">
              {message}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 self-start rounded-full bg-surface/70 p-1 text-fg-subtle transition-colors hover:text-fg"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
