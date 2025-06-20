
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getFilesPerSourceFromIDB, setFilesPerSourceInIDB } from "@/lib/indexeddb";

export type FileEntry = {
  name: string;
  type: "image" | "text" | "folder" | "video";
  encrypted: string; // Ciphertext as base64
  decrypted?: string; // Decrypted text/dataurl
  thumbnail?: string; // Video thumbnail URL
  liked?: boolean;
  parent?: string; // The name of parent folder, or undefined/root
  tags?: string[]; // Array of tags for the file
};

type FileVaultContextType = {
  filesPerSource: Record<number, FileEntry[]>;
  setFilesPerSource: React.Dispatch<React.SetStateAction<Record<number, FileEntry[]>>>;
};

const FileVaultContext = createContext<FileVaultContextType | undefined>(undefined);

export function useFileVault() {
  const ctx = useContext(FileVaultContext);
  if (!ctx) throw new Error("useFileVault must be used within FileVaultProvider");
  return ctx;
}

export function FileVaultProvider({ children }: { children: ReactNode }) {
  const [filesPerSource, setFilesPerSource] = useState<Record<number, FileEntry[]>>({});

  // Load filesPerSource from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    getFilesPerSourceFromIDB().then(data => {
      if (mounted && data) {
        setFilesPerSource(data);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Save to IndexedDB on change
  useEffect(() => {
    setFilesPerSourceInIDB(filesPerSource);
  }, [filesPerSource]);

  return (
    <FileVaultContext.Provider value={{ filesPerSource, setFilesPerSource }}>
      {children}
    </FileVaultContext.Provider>
  );
}
