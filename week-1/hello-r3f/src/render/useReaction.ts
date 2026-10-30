import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

// A reaction to a click: after `trigger()`, `apply(elapsed)` runs every frame with the
// seconds since the click, until `duration` has passed. The last call is at or past
// the duration, so the reaction can settle exactly. `elapsed()` is the seconds so far,
// or null when nothing is happening.
export const useReaction = (
  duration: number,
  apply: (elapsed: number) => void,
  onDone?: () => void,
) => {
  const clock = useThree((state) => state.clock);
  const startedAt = useRef<number | null>(null);

  useFrame(({ clock: frameClock }) => {
    if (startedAt.current === null) return;
    const elapsed = frameClock.elapsedTime - startedAt.current;
    apply(elapsed);
    if (elapsed >= duration) {
      startedAt.current = null;
      onDone?.();
    }
  });

  return {
    trigger: () => {
      startedAt.current = clock.elapsedTime;
    },
    elapsed: () => (startedAt.current === null ? null : clock.elapsedTime - startedAt.current),
  };
};
