
import { useState, useEffect } from "react";

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

  // Listen to sessionStorage changes (in other tabs/windows/components)
  useEffect(() => {
    function syncValue(e: StorageEvent) {
      if (e.key === key) {
        try {
          setValue(e.newValue ? JSON.parse(e.newValue) : defaultValue);
        } catch {
          setValue(defaultValue);
        }
      }
    }
    window.addEventListener("storage", syncValue);
    return () => window.removeEventListener("storage", syncValue);
  }, [key, defaultValue]);

  // Also listen to changes within the same document (React setSession called elsewhere)
  useEffect(() => {
    function onSessionChange() {
      try {
        const stored = sessionStorage.getItem(key);
        setValue(stored ? JSON.parse(stored) : defaultValue);
      } catch {
        setValue(defaultValue);
      }
    }
    window.addEventListener("__lovable_sessionstoragechange", onSessionChange);
    return () => window.removeEventListener("__lovable_sessionstoragechange", onSessionChange);
  }, [key, defaultValue]);

  const setSession = (val: T) => {
    setValue(val);
    sessionStorage.setItem(key, JSON.stringify(val));
    // Notify same-tab listeners
    window.dispatchEvent(new Event("__lovable_sessionstoragechange"));
  };

  const clearSession = () => {
    setValue(defaultValue);
    sessionStorage.removeItem(key);
    window.dispatchEvent(new Event("__lovable_sessionstoragechange"));
  };

  return [value, setSession, clearSession] as const;
}
