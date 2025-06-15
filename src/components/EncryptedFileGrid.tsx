// This new implementation supports drag-and-drop folder move and checkboxes for selection
import React, { useState } from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { FileGridItem } from "./FileGridItem";
import { toast } from "@/hooks/use-toast";
import { useCrypto } from "@/hooks/useCrypto";
import { Button } from "@/components/ui/button";
import { useFileVault } from "@/context/FileVaultContext";

type EncryptedFileGridProps = {
  sourceIndex: number;
  files: FileEntry[];
  onDeleteFile: (idx: number) => void;
  onUpdateFile: (idx: number, updated: FileEntry) => void;
};

const ENCRYPT_PASS = "vault-password"; // TODO: make dynamic

const findFolderNames = (files: FileEntry[]) =>
  files.filter(f => f.type === "folder").map(f => f.name);

const EncryptedFileGrid = ({
  sourceIndex,
  files,
  onDeleteFile,
  onUpdateFile,
}: EncryptedFileGridProps) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const { encryptData, decryptData } = useCrypto(ENCRYPT_PASS);
  const { setFilesPerSource, filesPerSource } = useFileVault();

  // FILTER root, but EXCLUDE folders
  const visibleFiles = files.filter(f => !f.parent && f.type !== "folder");
  // Only root-level folders
  const folderNames = findFolderNames(files).filter(folderName => {
    // Only folders with no parent (root folders). You can extend to subfolders later.
    const folderEntry = files.find(f => f.type === "folder" && f.name === folderName);
    return folderEntry && !folderEntry.parent;
  });

  function handleCheck(idx: number, checked: boolean) {
    setSelected(s => checked ? [...s, idx] : s.filter(i => i !== idx));
  }

  function handleMove(targetFolder: string) {
    setFilesPerSource(prev => {
      const old = prev[sourceIndex] ?? [];
      return {
        ...prev,
        [sourceIndex]: old.map((entry, idx) =>
          selected.includes(idx) && entry.type !== "folder"
            ? { ...entry, parent: targetFolder }
            : entry
        ),
      };
    });
    setSelected([]);
    toast({ title: `Moved ${selected.length} item(s) to ${targetFolder}.` });
  }

  function handleDeleteSelected() {
    setFilesPerSource(prev => {
      const old = prev[sourceIndex] ?? [];
      return {
        ...prev,
        [sourceIndex]: old.filter((_, idx) => !selected.includes(idx)),
      };
    });
    setSelected([]);
    toast({ title: "Deleted selected items" });
  }

  async function handleDecrypt(idx: number) {
    const file = files[idx];
    if (!file.encrypted || !file.encrypted.includes(":")) {
      toast({ title: "Invalid encrypted data." });
      return;
    }
    try {
      const decryptedBuf = await decryptData(file.encrypted);
      // handle text/image differently
      let content: string = "";
      if (file.type === "text") {
        content = new TextDecoder().decode(decryptedBuf);
      } else if (file.type === "image") {
        // Try create data url (assuming original was a data url string, base64 encoded)
        const blob = new Blob([decryptedBuf]);
        content = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      onUpdateFile(idx, { ...file, decrypted: content });
      toast({ title: "Decryption successful" });
    } catch (e: any) {
      toast({ title: "Decryption failed", description: e.message });
    }
  }

  async function handleEncrypt(idx: number) {
    const file = files[idx];
    try {
      let encrypted: string = "";
      if (file.type === "text" && file.decrypted) {
        encrypted = await encryptData(file.decrypted);
      } else if (file.type === "image" && file.decrypted) {
        // Convert dataURL to array buffer
        const response = await fetch(file.decrypted);
        const buf = await response.arrayBuffer();
        encrypted = await encryptData(buf);
      }
      onUpdateFile(idx, { ...file, decrypted: undefined, encrypted });
      toast({ title: "Encryption successful" });
    } catch (e: any) {
      toast({ title: "Encryption failed", description: e.message });
    }
  }

  // Drag and drop
  function onDragStart(e: React.DragEvent, idx: number) {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDropOnFolder(folderName: string) {
    if (draggedIdx == null) return;
    setFilesPerSource(prev => {
      const old = prev[sourceIndex] ?? [];
      return {
        ...prev,
        [sourceIndex]: old.map((file, idx) =>
          idx === draggedIdx && file.type !== "folder"
            ? { ...file, parent: folderName }
            : file
        ),
      };
    });
    setDraggedIdx(null);
    toast({ title: "Item moved" });
  }
  function onDragEnd() {
    setDraggedIdx(null);
  }

  return (
    <div>
      <div className="mb-2 flex gap-2">
        {selected.length > 0 && (
          <>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete Selected
            </Button>
            {folderNames.length > 0 && (
              <div className="relative">
                <select
                  className="bg-cyan-950 border border-cyan-700 rounded px-2 py-1 text-cyan-200"
                  defaultValue=""
                  onChange={e => { if (e.target.value) handleMove(e.target.value); }}
                >
                  <option value="" disabled>Move selected to...</option>
                  {folderNames.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 animate-fade-in">
        {/* Only show FILE grid items (no root folders) */}
        {visibleFiles.map((file, idx) => (
          <FileGridItem
            key={file.name + idx}
            file={file}
            checked={selected.includes(idx)}
            onCheck={checked => handleCheck(idx, checked)}
            onMove={() => {
              if (!folderNames.length) return;
              const target = prompt("Move to which folder?", folderNames[0]);
              if (target) handleMove(target);
            }}
            onDelete={() => onDeleteFile(idx)}
            onDecrypt={() => handleDecrypt(idx)}
            onEncrypt={() => handleEncrypt(idx)}
            onDragStart={e => onDragStart(e, idx)}
            draggable={file.type !== "folder"}
          />
        ))}
        {/* Folder containers: show inline contents (1 level only for now) */}
        {folderNames.map(folderName => (
          <div
            key={folderName}
            className="bg-cyan-950 border border-cyan-800 rounded-lg p-3 col-span-1 relative"
            onDrop={e => { e.preventDefault(); onDropOnFolder(folderName); }}
            onDragOver={e => e.preventDefault()}
          >
            <div className="flex items-center gap-2 mb-2">
              <span>
                <span className="inline-block bg-cyan-700/30 rounded-full px-2 py-1 text-cyan-300">{folderName}</span>
              </span>
            </div>
            <div className="grid gap-2">
              {files
                .map((f, fileIdx) => ({ ...f, __idx: fileIdx }))
                .filter(f => f.type !== "folder" && f.parent === folderName)
                .map(f => (
                  <FileGridItem
                    key={f.name}
                    file={f}
                    checked={selected.includes((f as any).__idx)}
                    onCheck={checked => handleCheck((f as any).__idx, checked)}
                    onMove={() => { /* Individual move handled at parent*/ }}
                    onDelete={() => onDeleteFile((f as any).__idx)}
                    onDecrypt={() => handleDecrypt((f as any).__idx)}
                    onEncrypt={() => handleEncrypt((f as any).__idx)}
                    onDragStart={e => onDragStart(e, (f as any).__idx)}
                    draggable
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EncryptedFileGrid;
