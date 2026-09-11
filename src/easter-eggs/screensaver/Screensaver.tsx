import { useEffect, useRef } from 'react';
import styles from './Screensaver.module.css';

interface ScreensaverProps {
  onDismiss: () => void;
}

interface Star {
  x: number;
  y: number;
  z: number;
}

const STAR_COUNT = 220;
const STAR_SPEED = 8;

export function Screensaver({ onDismiss }: ScreensaverProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = (): void => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnStar = (): Star => ({
      x: (Math.random() - 0.5) * canvas.width,
      y: (Math.random() - 0.5) * canvas.height,
      z: Math.random() * canvas.width,
    });
    const stars: Star[] = Array.from({ length: STAR_COUNT }, spawnStar);

    let rafId = 0;
    const draw = (): void => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.fillStyle = '#ffffff';

      for (const star of stars) {
        star.z -= STAR_SPEED * dpr;
        if (star.z <= 1) {
          const fresh = spawnStar();
          star.x = fresh.x;
          star.y = fresh.y;
          star.z = canvas.width;
        }
        const sx = cx + (star.x / star.z) * canvas.width;
        const sy = cy + (star.y / star.z) * canvas.width;
        if (sx < 0 || sx > canvas.width || sy < 0 || sy > canvas.height) continue;
        const size = (1 - star.z / canvas.width) * 3 * dpr;
        ctx.fillRect(sx, sy, size, size);
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      className={styles.screensaver}
      onMouseMove={onDismiss}
      onMouseDown={onDismiss}
      onKeyDown={onDismiss}
      onTouchStart={onDismiss}
      role="button"
      tabIndex={0}
      aria-label="Screensaver active — move the mouse or press a key to return"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
