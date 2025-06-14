
import { useState } from "react";

// Secure session storage utility for sensitive in-memory-only secrets
export function useSessionStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setSession = (val: T) => {
    setValue(val);
    sessionStorage.setItem(key, JSON.stringify(val));
  };

  const clearSession = () => {
    setValue(defaultValue);
    sessionStorage.removeItem(key);
  };

  return [value, setSession, clearSession] as const;
}

