import React, { useState, useMemo, useCallback } from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { ChevronLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FileGridContent from "./FileGridContent";
import BulkActionsBar from "./BulkActionsBar";
import MediaViewer from "./MediaViewer";
import { useCrypto } from "@/hooks/useCrypto";
import { toast } from "@/hooks/use-toast";

type EncryptedFileGridProps = {
  sourceIndex: number;
  files: FileEntry[];
  onDeleteFile: (idx: number) => void;
  onUpdateFile: (idx: number, updated: FileEntry) => void;
  currentPath: string[];
  onPathChange: (path: string[]) => void;
};

const ENCRYPT_PASS = "vault-password";

const EncryptedFileGrid = ({
  sourceIndex,
  files,
  onDeleteFile,
  onUpdateFile,
  currentPath,
  onPathChange,
}: EncryptedFileGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [mediaViewer, setMediaViewer] = useState<{ fileIdx: number; open: boolean }>({ fileIdx: -1, open: false });
  const { encryptData, decryptData } = useCrypto(ENCRYPT_PASS);

  const folders = useMemo(() => {
    return files.filter(f => f.type === "folder" && (f.parent === undefined || f.parent === currentPath[currentPath.length - 1]));
  }, [files, currentPath]);

  const filesInCurrent = useMemo(() => {
    return files.filter(f => f.type !== "folder" && (f.parent === undefined ? currentPath.length === 0 : f.parent === currentPath[currentPath.length - 1]));
  }, [files, currentPath]);

  const allFolders = useMemo(() => {
    return files.filter(f => f.type === "folder").map(f => f.name);
  }, [files]);

  const handleCheck = (idx: number, checked: boolean, e?: React.MouseEvent) => {
    if (e?.shiftKey) {
      // SHIFT-SELECT: select range
      if (!selected.length) {
        // Nothing selected yet, just select this
        setSelected([idx]);
        return;
      }
      // Find the last selected index
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

  const handleSelectAll = () => {
    if (selected.length === files.length) {
      setSelected([]);
    } else {
      setSelected(files.map((_, i) => i));
    }
  };

  const handleBulkDelete = () => {
    selected.sort((a, b) => b - a); // Desc order
    selected.forEach(idx => onDeleteFile(idx));
    setSelected([]);
  };

  const handleEncrypt = async (idx: number) => {
    const file = files[idx];
    if (!file) return;

    try {
      if (file.type === "image" || file.type === "video") {
        // Encrypt image/video
        if (!file.decrypted) {
          toast({ title: "No decrypted data to encrypt." });
          return;
        }
        const response = await fetch(file.decrypted);
        const buffer = await response.arrayBuffer();
        const encrypted = await encryptData(buffer);
        onUpdateFile(idx, { ...file, encrypted, decrypted: undefined });
      } else {
        // Encrypt text
        const encrypted = await encryptData(file.decrypted || "");
        onUpdateFile(idx, { ...file, encrypted, decrypted: undefined });
      }
      toast({ title: `"${file.name}" re-encrypted successfully.`, variant: "success" });
    } catch (err) {
      toast({ title: `Encryption failed for "${file.name}"`, description: String(err), variant: "destructive" });
      console.error("Encryption failed:", err);
    }
  };

  const handleDecrypt = () => {
    toast({
      title: "Not implemented",
      description: "Decrypting multiple files at once is not yet implemented.",
    });
  };

  // Drag and drop state + handlers
  const [draggedIdx, setDraggedIdx] = useState(-1);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedIdx(-1);
  };

  const handleDropOnFolder = (folderName: string) => {
    if (draggedIdx === -1) return;
    const file = files[draggedIdx];
    if (!file) return;
    onUpdateFile(draggedIdx, { ...file, parent: folderName });
  };

  const filteredFiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filesInCurrent;
    return filesInCurrent.filter(file => file.name.toLowerCase().includes(term));
  }, [filesInCurrent, searchTerm]);

  return (
    <div className="w-full">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 mb-4">
        {currentPath.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onPathChange(currentPath.slice(0, -1))}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div className="text-sm text-cyan-400 font-mono">
          {currentPath.length === 0 ? "Root" : currentPath.join(" / ")}
        </div>
      </div>

      {/* Search and bulk actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-500" />
          <Input
            type="search"
            placeholder="Search files..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-cyan-950/30 text-cyan-200 border-cyan-800 focus-visible:ring-cyan-600"
          />
        </div>
        <BulkActionsBar
          selectedCount={selected.length}
          onSelectAll={handleSelectAll}
          onDelete={handleBulkDelete}
          onEncrypt={handleDecrypt}
        />
      </div>

      <FileGridContent
        folders={folders}
        filesInCurrent={filteredFiles}
        selected={selected}
        handleCheck={handleCheck}
        setCurrentPath={onPathChange}
        currentPath={currentPath}
        allFolders={allFolders}
        onDeleteFile={onDeleteFile}
        onDecrypt={() => { }}
        onEncrypt={handleEncrypt}
        onDragStart={handleDragStart}
        onDropOnFolder={handleDropOnFolder}
        onDragEnd={handleDragEnd}
        setMediaViewer={setMediaViewer}
        onUpdateFile={onUpdateFile}
      />

      <MediaViewer
        open={mediaViewer.open}
        setOpen={open => setMediaViewer({ ...mediaViewer, open })}
        file={files[mediaViewer.fileIdx]}
        onPrev={() => {
          const prevIdx = Math.max(0, mediaViewer.fileIdx - 1);
          setMediaViewer({ fileIdx: prevIdx, open: true });
        }}
        onNext={() => {
          const nextIdx = Math.min(files.length - 1, mediaViewer.fileIdx + 1);
          setMediaViewer({ fileIdx: nextIdx, open: true });
        }}
      />
    </div>
  );
};

export default EncryptedFileGrid;
