import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (val: number) => string;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 350,
  formatFn,
  className = '',
  suffix = '',
  prefix = ''
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const prevValueRef = useRef<number>(value);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    
    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    setIsUpdating(true);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutCubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);
      
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
        setTimeout(() => setIsUpdating(false), 150);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = formatFn 
    ? formatFn(displayValue) 
    : displayValue.toLocaleString('pl-PL');

  return (
    <span 
      className={`inline-block transition-transform duration-200 font-mono ${isUpdating ? 'scale-[1.03] text-white' : ''} ${className}`}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
};
