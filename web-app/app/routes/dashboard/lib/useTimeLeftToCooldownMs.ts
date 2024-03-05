import { useEffect, useState } from 'react';

const INTERVAL_TO_RUN_TIMER_MS = 1000;

export default function useTimeLeftToCooldownMs(cooldownAtMs: number) {
  const [timeLeftToCooldownMs, setTimeLeftToCooldownMs]
    = useState(cooldownAtMs - new Date().getTime());

  useEffect(() => {
    const intervalRef = setInterval(() => {
      setTimeLeftToCooldownMs((oldVal) => {
        const newVal = oldVal - INTERVAL_TO_RUN_TIMER_MS;
        if (newVal < 0) clearInterval(intervalRef);
        return newVal;
      });
    }, INTERVAL_TO_RUN_TIMER_MS);

    return () => clearInterval(intervalRef);
  }, []);

  return timeLeftToCooldownMs;
}
