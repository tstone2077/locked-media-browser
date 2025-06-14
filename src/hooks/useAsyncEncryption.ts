
import { useRef, useState, useCallback } from "react";

type EncryptOptions = {
  onProgress?: (percent: number) => void;
};

export function useAsyncEncryption() {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate async encryption, chunking work
  const encrypt = useCallback(async (dataUrl: string, { onProgress }: EncryptOptions = {}) => {
    setIsEncrypting(true);
    setProgress(0);

    // Simulation: process base64 in chunks to not block UI
    const CHUNK_SIZE = 20000; // chars per step
    const total = dataUrl.length;
    let encrypted = "";
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      // Simulate "work"
      const chunk = dataUrl.slice(i, i + CHUNK_SIZE);
      encrypted += btoa(chunk);
      await new Promise(res => setTimeout(res, 15)); // yield to event loop
      const percent = Math.min(100, Math.round((i + CHUNK_SIZE) / total * 100));
      setProgress(percent);
      if (onProgress) onProgress(percent);
    }
    setProgress(100);
    setIsEncrypting(false);
    return encrypted;
  }, []);

  const reset = () => {
    setIsEncrypting(false);
    setProgress(0);
  };

  return { encrypt, isEncrypting, progress, reset };
}
