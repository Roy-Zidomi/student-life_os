import { useState, useEffect, useCallback, useRef } from "react";
import { POMODORO_FOCUS_MINUTES, POMODORO_BREAK_MINUTES } from "@/lib/constants";

type TimerMode = "focus" | "break";

export function usePomodoro() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(POMODORO_FOCUS_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = mode === "focus" ? POMODORO_FOCUS_MINUTES * 60 : POMODORO_BREAK_MINUTES * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(newMode === "focus" ? POMODORO_FOCUS_MINUTES * 60 : POMODORO_BREAK_MINUTES * 60);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      if (mode === "focus") {
        setSessionsCompleted((prev) => prev + 1);
        // Play notification sound
        try {
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
        } catch {
          // Audio not available
        }
        switchMode("break");
      } else {
        switchMode("focus");
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode, switchMode]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? POMODORO_FOCUS_MINUTES * 60 : POMODORO_BREAK_MINUTES * 60);
  };

  return {
    mode,
    timeLeft,
    isRunning,
    progress,
    displayTime,
    minutes,
    seconds,
    sessionsCompleted,
    start,
    pause,
    reset,
    switchMode,
  };
}
