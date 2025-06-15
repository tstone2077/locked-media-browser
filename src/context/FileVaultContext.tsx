
import React, { createContext, useContext, useState, ReactNode } from "react";

export type FileEntry = {
  name: string;
  type: "image" | "text" | "folder";
  encrypted: string; // Ciphertext as base64
  decrypted?: string; // Decrypted text/dataurl
  liked?: boolean;
  parent?: string; // The name of parent folder, or undefined/root
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
  return (
    <FileVaultContext.Provider value={{ filesPerSource, setFilesPerSource }}>
      {children}
    </FileVaultContext.Provider>
  );
}
