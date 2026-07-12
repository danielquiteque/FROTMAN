import { useEffect, useState } from "react";

/** Anima um número de 0 até `target` sempre que `target` mudar. */
export function useCountUp(target: number, durationSteps = 24) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.round(target / durationSteps));
    let frame: number;

    const tick = () => {
      current = Math.min(target, current + step);
      setValue(current);
      if (current < target) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, durationSteps]);

  return value;
}
