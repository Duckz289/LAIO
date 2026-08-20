'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ReactNode } from 'react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
  labelledBy?: string;
  closeDisabled?: boolean;
  panelClassName?: string;
  overlayClassName?: string;
}

const panelTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };
const backdropTransition = { duration: 0.18 };

export default function AnimatedModal({
  isOpen,
  onClose,
  closeLabel,
  children,
  labelledBy,
  closeDisabled,
  panelClassName = 'max-w-lg',
  overlayClassName = 'fixed inset-0 z-50 flex items-center justify-center p-4',
}: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={overlayClassName} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
          <motion.button
            type="button"
            className="absolute inset-0 bg-[#0d2b24]/60"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label={closeLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          />
          <motion.div
            className={`relative z-10 w-full ${panelClassName}`}
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={panelTransition}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
