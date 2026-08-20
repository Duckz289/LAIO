import type { Variants } from 'motion/react';

// Stagger a list's children on mount without restaggering on every re-render:
// pair with AnimatePresence + `layout` on each child so added/removed items
// animate too, while unrelated state updates don't replay the stagger.
export const listContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};
