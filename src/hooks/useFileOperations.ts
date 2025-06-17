
import { useState } from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { useCrypto } from "@/hooks/useCrypto";
import { toast } from "@/hooks/use-toast";

const ENCRYPT_PASS = "vault-password";

export const useFileOperations = (
  files: FileEntry[],
  onDeleteFile: (idx: number) => void,
  onUpdateFile: (idx: number, updated: FileEntry) => void
) => {
  const [selected, setSelected] = useState<number[]>([]);
  const { encryptData } = useCrypto(ENCRYPT_PASS);

  const handleCheck = (idx: number, checked: boolean, e?: React.MouseEvent) => {
    if (e?.shiftKey) {
      // SHIFT-SELECT: select range
      if (!selected.length) {
        setSelected([idx]);
        return;
      }
      const last = selected[selected.length - 1];
      const start = Math.min(idx, last);
      const end = Math.max(idx, last);
      const range = Array.from({ length: end - start + 1 }, (_, i) => i + start);
      setSelected(range);
      return;
    }

    if (checked) {
      setSelected([...selected, idx]);
    } else {
      setSelected(selected.filter(i => i !== idx));
    }
  };

  const handleBulkDelete = (indexes: number[]) => {
    indexes.sort((a, b) => b - a); // Desc order
    indexes.forEach(idx => onDeleteFile(idx));
    setSelected([]);
  };

  const handleBulkDecrypt = async (indexes: number[]) => {
    toast({
      title: "Bulk decrypt",
      description: `Decrypting ${indexes.length} files...`,
    });
  };

  const handleMove = (target: string) => {
    selected.forEach(idx => {
      const file = files[idx];
      if (file) {
        onUpdateFile(idx, { ...file, parent: target });
      }
    });
    setSelected([]);
  };

  const handleEncrypt = async (idx: number) => {
    const file = files[idx];
    if (!file) return;

    try {
      if (file.type === "image" || file.type === "video") {
        if (!file.decrypted) {
          toast({ title: "No decrypted data to encrypt." });
          return;
        }
        const response = await fetch(file.decrypted);
        const buffer = await response.arrayBuffer();
        const encrypted = await encryptData(buffer);
        onUpdateFile(idx, { ...file, encrypted, decrypted: undefined });
      } else {
        const encrypted = await encryptData(file.decrypted || "");
        onUpdateFile(idx, { ...file, encrypted, decrypted: undefined });
      }
      toast({ title: `"${file.name}" re-encrypted successfully.`, variant: "success" });
    } catch (err) {
      toast({ title: `Encryption failed for "${file.name}"`, description: String(err), variant: "destructive" });
      console.error("Encryption failed:", err);
    }
  };

  return {
    selected,
    setSelected,
    handleCheck,
    handleBulkDelete,
    handleBulkDecrypt,
    handleMove,
    handleEncrypt
  };
};
