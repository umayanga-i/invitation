'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="iv-dialog backdrop:bg-[var(--iv-deep)]/60 bg-[var(--iv-ivory)] text-[var(--iv-ink)] border border-[var(--iv-gold-soft)] rounded-[20px] shadow-2xl p-0 max-w-lg w-[calc(100%-32px)] mx-auto"
    >
      <div className="p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--iv-deep)]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-[var(--iv-muted)] hover:text-[var(--iv-deep)] text-xl leading-none min-h-11 min-w-11"
            >
              &times;
            </button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
