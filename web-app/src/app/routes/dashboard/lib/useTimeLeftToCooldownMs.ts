import { useEffect, useState } from 'react';

const INTERVAL_TO_RUN_TIMER_MS = 1000;

export default function useTimeLeftToCooldownMs(
  cooldownAtMs: number = -Infinity, // assume we are not cooling down
) {
  const [timeLeftToCooldownMs, setTimeLeftToCooldownMs]
    = useState(() => getTimeFromNowToCooldownMs(cooldownAtMs));

  useEffect(() => {
    // update with new timeleft
    setTimeLeftToCooldownMs(getTimeFromNowToCooldownMs(cooldownAtMs));

    // start a timer to update every second until cooled
    const intervalRef = setInterval(() => {
      setTimeLeftToCooldownMs((oldVal) => {
        const newVal = oldVal - INTERVAL_TO_RUN_TIMER_MS;
        if (newVal < 0) clearInterval(intervalRef);
        return newVal;
      });
    }, INTERVAL_TO_RUN_TIMER_MS);

    return () => clearInterval(intervalRef);
  }, [cooldownAtMs]);

  return timeLeftToCooldownMs;
}

function getTimeFromNowToCooldownMs(cooldownAtMs: number): number {
  const nowMs = new Date().getTime();
  return cooldownAtMs - nowMs;
}
