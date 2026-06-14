import { useEffect, useState, useCallback, useRef } from "react";

const IDLE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
const WARNING_THRESHOLD_MS = IDLE_LIMIT_MS - 30 * 1000; // 9.5 minutes (30s warning)
const STORAGE_KEY = "centrika_last_activity";

export function useIdleTimeout(isAuthenticated: boolean, logout: () => void) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const lastUpdateRef = useRef<number>(0);

  // Function to register activity
  const registerActivity = useCallback(() => {
    if (!isAuthenticated) return;
    const now = Date.now();
    // Throttle writes to localStorage to once every 2 seconds to avoid overhead
    if (now - lastUpdateRef.current > 2000) {
      localStorage.setItem(STORAGE_KEY, now.toString());
      lastUpdateRef.current = now;
      setShowWarning(false);
    }
  }, [isAuthenticated]);

  // Handle local click on "Keep working"
  const keepWorking = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShowWarning(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    // Set initial activity time on mount if not present
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    // Add activity listeners
    const activityEvents = ["mousedown", "click", "keypress", "scroll", "touchstart"];
    const handleActivity = () => {
      registerActivity();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Run interval to check idle status every second
    const interval = setInterval(() => {
      const lastActivityStr = localStorage.getItem(STORAGE_KEY);
      const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
      const idleDuration = Date.now() - lastActivity;

      if (idleDuration >= IDLE_LIMIT_MS) {
        clearInterval(interval);
        logout();
        window.location.href = "/login";
      } else if (idleDuration >= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        const remainingSeconds = Math.max(0, Math.ceil((IDLE_LIMIT_MS - idleDuration) / 1000));
        setSecondsLeft(remainingSeconds);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated, logout, registerActivity]);

  return { showWarning, secondsLeft, keepWorking };
}
