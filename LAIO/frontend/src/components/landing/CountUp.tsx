'use client';

import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  className?: string;
}

export default function CountUp({ value, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 55, damping: 16, mass: 1 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return spring.on('change', (latest) => setDisplay(Math.round(latest)));
  }, [spring]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
