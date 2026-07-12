import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Rest timer driven by wall-clock timestamps, not accumulated intervals:
 * the end time is fixed when the timer starts and remaining time is derived
 * from Date.now() on each tick, so JS-interval drift or a backgrounded app
 * cannot make the countdown wrong. The interval only refreshes the display.
 */

export interface RestTimer {
  running: boolean;
  /** Seconds remaining, rounded up. 0 when idle. */
  remaining: number;
  totalSeconds: number;
  start: (seconds: number) => void;
  addSeconds: (delta: number) => void;
  skip: () => void;
}

export function useRestTimer(onFinish?: () => void): RestTimer {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const firedRef = useRef(false);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, [endsAt]);

  useEffect(() => {
    if (endsAt === null || firedRef.current) return;
    if (Date.now() >= endsAt) {
      firedRef.current = true;
      setEndsAt(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      finishRef.current?.();
    }
  }, [now, endsAt]);

  const start = useCallback((seconds: number) => {
    const safe = Math.max(5, Math.round(seconds));
    firedRef.current = false;
    setTotalSeconds(safe);
    setEndsAt(Date.now() + safe * 1000);
    setNow(Date.now());
  }, []);

  const addSeconds = useCallback((delta: number) => {
    setEndsAt((prev) => {
      if (prev === null) return prev;
      const next = Math.max(Date.now() + 1000, prev + delta * 1000);
      return next;
    });
    setTotalSeconds((prev) => Math.max(5, prev + delta));
  }, []);

  const skip = useCallback(() => {
    firedRef.current = true;
    setEndsAt(null);
  }, []);

  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));

  return { running: endsAt !== null, remaining, totalSeconds, start, addSeconds, skip };
}
