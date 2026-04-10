import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const ICON_BY_VARIANT = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
};

const STYLES_BY_VARIANT = {
  info: {
    wrap: 'bg-surface border-border text-fg',
    icon: 'text-dime-600',
  },
  success: {
    wrap: 'bg-success-muted border-border text-fg',
    icon: 'text-success',
  },
  warning: {
    wrap: 'bg-warning-muted border-border text-fg',
    icon: 'text-warning',
  },
  error: {
    wrap: 'bg-danger-muted border-border text-fg',
    icon: 'text-danger',
  },
};

export function Toast({ open, variant = 'info', message, onClose, autoHideMs = 4500 }) {
  useEffect(() => {
    if (!open) return;
    if (!autoHideMs) return;
    const t = setTimeout(() => onClose?.(), autoHideMs);
    return () => clearTimeout(t);
  }, [open, autoHideMs, onClose]);

  if (!open) return null;

  const Icon = ICON_BY_VARIANT[variant] ?? Info;
  const styles = STYLES_BY_VARIANT[variant] ?? STYLES_BY_VARIANT.info;

  // absolute como el header: respeta el padding de #root (safe-area); fixed usaría el viewport entero.
  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-[5001]">
      <div
        className={`pointer-events-auto flex w-full min-h-14 items-start gap-3 rounded-dime-2xl border px-4 py-3 shadow-dime-lg backdrop-blur-sm sm:px-5 ${styles.wrap}`}
        role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
        aria-live={variant === 'error' || variant === 'warning' ? 'assertive' : 'polite'}
      >
        <div className="mt-0.5 shrink-0">
          <Icon className={`h-5 w-5 ${styles.icon}`} aria-hidden />
        </div>
        <div className="flex-1 text-sm font-medium leading-snug">{message}</div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full bg-surface/70 p-1 text-fg-subtle transition-colors hover:text-fg"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

