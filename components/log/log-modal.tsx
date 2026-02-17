"use client";

import * as React from "react";

export interface LogModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function LogModal({ open, onClose, title, children }: LogModalProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-labelledby="log-modal-title"
    >
      <div
        className="w-full max-h-[90vh] overflow-y-auto bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="log-modal-title" className="font-display text-xl tracking-wide text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-white p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
