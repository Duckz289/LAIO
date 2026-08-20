'use client';

import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import { type PointerEvent, useEffect, useRef, useState } from 'react';

import HeroMascot from './HeroMascot';

export default function HeroParallax() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFinePointer(query.matches);
    const onChange = () => setFinePointer(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 120, damping: 20, mass: 0.4 });
  const springY = useSpring(pointerY, { stiffness: 120, damping: 20, mass: 0.4 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!finePointer) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: 1200 }}
    >
      <motion.div style={{ rotateX, rotateY, y: parallaxY }}>
        <HeroMascot />
      </motion.div>
    </div>
  );
}
