"use client";

import * as React from "react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const DRAG_CLOSE_THRESHOLD = 100;

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [startY, setStartY] = React.useState(0);
  const [currentY, setCurrentY] = React.useState(0);
  const currentYRef = React.useRef(0);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const handleAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    currentYRef.current = currentY;
  }, [currentY]);

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

  const getClientY = (e: React.PointerEvent) => e.clientY;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setStartY(getClientY(e));
    setCurrentY(0);
    handleAreaRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const y = getClientY(e);
    const delta = y - startY;
    if (delta > 0) {
      setCurrentY(delta);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    handleAreaRef.current?.releasePointerCapture(e.pointerId);
    if (currentYRef.current > DRAG_CLOSE_THRESHOLD) {
      onClose();
    }
    setCurrentY(0);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    handleAreaRef.current?.releasePointerCapture(e.pointerId);
    setCurrentY(0);
  };

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
        ref={sheetRef}
        className="bottom-sheet"
        style={{ transform: currentY > 0 ? `translateY(${currentY}px)` : undefined }}
        role="dialog"
        aria-modal
        aria-labelledby="bottom-sheet-title"
      >
        <div
          ref={handleAreaRef}
          className="bottom-sheet__handle-area"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className="bottom-sheet__handle" />
        </div>
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
