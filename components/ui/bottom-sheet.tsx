"use client";

import * as React from "react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
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
    <>
      <div
        className="bottom-sheet__backdrop"
        onClick={onClose}
        role="button"
        aria-label="Close"
      />
      <div
        className="bottom-sheet"
        role="dialog"
        aria-modal
        aria-labelledby="bottom-sheet-title"
      >
        <div className="bottom-sheet__header">
          <h2 id="bottom-sheet-title" className="bottom-sheet__title">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bottom-sheet__close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="bottom-sheet__content">{children}</div>
      </div>
    </>
  );
}
