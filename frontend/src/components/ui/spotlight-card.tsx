import React, { useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'white' | 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

const glowColorMap = {
  white: { base: 0, spread: 0, saturation: 0, lightness: 85 },
  blue: { base: 220, spread: 200, saturation: 100, lightness: 70 },
  purple: { base: 280, spread: 300, saturation: 100, lightness: 70 },
  green: { base: 120, spread: 200, saturation: 100, lightness: 70 },
  red: { base: 0, spread: 200, saturation: 100, lightness: 70 },
  orange: { base: 30, spread: 200, saturation: 100, lightness: 70 },
};

// Inject global styles once
let stylesInjected = false;
function injectGlowStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    [data-glow] {
      --glow-opacity: 0;
      transition: --glow-opacity 0.3s ease;
    }

    [data-glow]:hover {
      --glow-opacity: 1;
    }

    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
      opacity: var(--glow-opacity, 0);
      transition: opacity 0.3s ease;
    }

    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 0) calc(var(--saturation, 0) * 1%) calc(var(--lightness, 85) * 1%) / var(--border-spot-opacity, 1)),
        transparent 100%
      );
      filter: brightness(2);
    }

    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 0% 100% / var(--border-light-opacity, 1)),
        transparent 100%
      );
    }

    [data-glow] [data-glow] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }

    [data-glow]:hover > [data-glow] {
      opacity: var(--outer, 1);
    }

    [data-glow] > [data-glow] {
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    [data-glow] > [data-glow]::before {
      inset: -10px;
      border-width: 10px;
    }

    [data-glow]:hover {
      background-image: radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 0) calc(var(--saturation, 0) * 1%) calc(var(--lightness, 85) * 1%) / 0.12),
        transparent
      );
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-position: 50% 50%;
      background-attachment: fixed;
    }
  `;
  document.head.appendChild(style);
}

// Shared pointer tracker
let pointerListenerAttached = false;
const glowElements = new Set<HTMLDivElement>();

function attachPointerListener() {
  if (pointerListenerAttached) return;
  pointerListenerAttached = true;

  document.addEventListener('pointermove', (e: PointerEvent) => {
    const { clientX: x, clientY: y } = e;
    glowElements.forEach((el) => {
      el.style.setProperty('--x', x.toFixed(2));
      el.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
      el.style.setProperty('--y', y.toFixed(2));
      el.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
    });
  });
}

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'white',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectGlowStyles();
    attachPointerListener();

    const el = cardRef.current;
    if (el) {
      glowElements.add(el);
      return () => { glowElements.delete(el); };
    }
  }, []);

  const { base, spread, saturation, lightness } = glowColorMap[glowColor];

  return (
    <div
      ref={cardRef}
      data-glow
      style={{
        '--base': base,
        '--spread': spread,
        '--saturation': saturation,
        '--lightness': lightness,
        '--radius': '16',
        '--border': '1',
        '--backdrop': 'transparent',
        '--backup-border': 'transparent',
        '--size': '200',
        '--outer': '1',
        '--border-size': 'calc(var(--border, 1) * 1px)',
        '--spotlight-size': 'calc(var(--size, 200) * 1px)',
        '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
        '--border-spot-opacity': '1',
        '--border-light-opacity': '0.6',
        '--bg-spot-opacity': '0',
        position: 'relative',
        touchAction: 'none',
      } as React.CSSProperties}
      className={cn('rounded-2xl relative group/glow', className)}
    >
      <div data-glow></div>
      {children}
    </div>
  );
};

export { GlowCard };
