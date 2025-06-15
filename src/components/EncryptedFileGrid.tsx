import React, { useState } from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { FileGridItem } from "./FileGridItem";
import { toast } from "@/hooks/use-toast";
import { useCrypto } from "@/hooks/useCrypto";
import { Button } from "@/components/ui/button";
import { useFileVault } from "@/context/FileVaultContext";
import { Folder, ChevronLeft } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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

  // NEW: currentPath is an array, each element a folder name (for easy up navigation)
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const [mediaViewer, setMediaViewer] = useState<{
    fileIdx: number;
    open: boolean;
  }>({ fileIdx: -1, open: false });

  const { encryptData, decryptData } = useCrypto(ENCRYPT_PASS);
  const { setFilesPerSource, filesPerSource } = useFileVault();

  // Utility to get string path from array for parent matching
  const currentFolder = currentPath.length ? currentPath[currentPath.length - 1] : undefined;

  // Find all folders that are children of the current parent
  function getSubfolders() {
    return files
      .map((f, idx) => ({ ...f, __idx: idx }))
      .filter(
        f =>
          f.type === "folder" &&
          ((currentFolder && f.parent === currentFolder) ||
            (!currentFolder && !f.parent))
      );
  }

  // Find all files in the current parent
  function getVisibleFiles() {
    return files
      .map((f, idx) => ({ ...f, __idx: idx }))
      .filter(
        f =>
          f.type !== "folder" &&
          ((currentFolder && f.parent === currentFolder) ||
            (!currentFolder && !f.parent))
      );
  }

  // NEW: Get folder chain for breadcrumbs
  function getBreadcrumbs() {
    return [
      { label: "Root", value: undefined },
      ...currentPath.map((folder, i) => ({
        label: folder,
        value: folder,
        idx: i
      })),
    ];
  }

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
      let content: string = "";
      if (file.type === "text") {
        content = new TextDecoder().decode(decryptedBuf);
      } else if (file.type === "image") {
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

  // --- Collect folders and files for this view ---
  const folders = getSubfolders();
  const filesInCurrent = getVisibleFiles();

  // For move menu (list of all folders; could be extended to avoid cyclic move)
  const allFolders = files.filter(f => f.type === "folder").map(f => f.name);

  // --- RENDER ---

  return (
    <div>
      {/* Breadcrumb trail */}
      <div className="mb-3">
        <Breadcrumb>
          <BreadcrumbList>
            {getBreadcrumbs().map((crumb, i, arr) => (
              <React.Fragment key={i}>
                <BreadcrumbItem>
                  {/* BreadcrumbLink for links (not last), BreadcrumbPage for current */}
                  {i < arr.length - 1 ? (
                    <BreadcrumbLink
                      asChild
                      className="cursor-pointer text-cyan-400 hover:text-cyan-100"
                      onClick={() => setCurrentPath(arr.slice(1, i + 1).map(c => c.label as string))}
                    >
                      <span>
                        {crumb.label === "Root" ? (
                          <ChevronLeft className="inline -mt-1 mr-1 w-4 h-4" />
                        ) : (
                          <Folder className="inline -mt-1 mr-1 w-4 h-4" />
                        )}
                        {crumb.label}
                      </span>
                    </BreadcrumbLink>
                  ) : (
                    <span className="font-semibold text-cyan-100">{crumb.label}</span>
                  )}
                </BreadcrumbItem>
                {i < arr.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-2 flex gap-2">
        {selected.length > 0 && (
          <>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete Selected
            </Button>
            {allFolders.length > 0 && (
              <div className="relative">
                <select
                  className="bg-cyan-950 border border-cyan-700 rounded px-2 py-1 text-cyan-200"
                  defaultValue=""
                  onChange={e => { if (e.target.value) handleMove(e.target.value); }}
                >
                  <option value="" disabled>Move selected to...</option>
                  {allFolders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* GRID */}
      <div className="grid gap-8 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 animate-fade-in">
        {/* --- Folders at top, clickable --- */}
        {folders.map(folder =>
          <FileGridItem
            key={folder.name + (folder as any).__idx}
            file={folder}
            checked={selected.includes((folder as any).__idx)}
            onCheck={checked => handleCheck((folder as any).__idx, checked)}
            onMove={() => null}
            onDelete={() => onDeleteFile((folder as any).__idx)}
            onDecrypt={() => null}
            onEncrypt={() => null}
            onDragStart={e => onDragStart(e, (folder as any).__idx)}
            draggable={false}
            // Folders: clicking opens view
            onClick={() => setCurrentPath([...currentPath, folder.name])}
          />
        )}

        {/* --- FILES in current folder --- */}
        {filesInCurrent.map(file =>
          <FileGridItem
            key={file.name + file.__idx}
            file={file}
            checked={selected.includes(file.__idx)}
            onCheck={checked => handleCheck(file.__idx, checked)}
            onMove={() => {
              if (!allFolders.length) return;
              const target = prompt("Move to which folder?", allFolders[0]);
              if (target) handleMove(target);
            }}
            onDelete={() => onDeleteFile(file.__idx)}
            onDecrypt={() => handleDecrypt(file.__idx)}
            onEncrypt={() => handleEncrypt(file.__idx)}
            onDragStart={e => onDragStart(e, file.__idx)}
            draggable={file.type !== "folder"}
            // Click opens media viewer if not folder
            onClick={() => {
              setMediaViewer({ fileIdx: file.__idx, open: true });
            }}
          />
        )}
      </div>
      {/* Media Viewer (outside grid): shows when open */}
      {mediaViewer.open && files[mediaViewer.fileIdx] ? (
        import('src/components/MediaViewer').then(({ default: MediaViewer }) => (
          <MediaViewer
            open={mediaViewer.open}
            setOpen={(open: boolean) => setMediaViewer(m => ({ ...m, open }))}
            file={files[mediaViewer.fileIdx]}
            onPrev={() => {
              // Previous file in the visible files
              const currentIdx = filesInCurrent.findIndex(f => f.__idx === mediaViewer.fileIdx);
              if (currentIdx > 0) {
                setMediaViewer({ fileIdx: filesInCurrent[currentIdx - 1].__idx, open: true });
              }
            }}
            onNext={() => {
              // Next file in the visible files
              const currentIdx = filesInCurrent.findIndex(f => f.__idx === mediaViewer.fileIdx);
              if (currentIdx < filesInCurrent.length - 1) {
                setMediaViewer({ fileIdx: filesInCurrent[currentIdx + 1].__idx, open: true });
              }
            }}
          />
        ))
      ) : null}
    </div>
  );
};

export default EncryptedFileGrid;
