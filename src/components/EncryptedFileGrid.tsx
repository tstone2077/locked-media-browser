import React, { useState, useEffect } from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { FileGridItem } from "./FileGridItem";
import { toast } from "@/hooks/use-toast";
import { useCrypto } from "@/hooks/useCrypto";
import { Button } from "@/components/ui/button";
import { useFileVault } from "@/context/FileVaultContext";
import { Folder, ChevronLeft, Trash2 } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import MediaViewer from "./MediaViewer";

type EncryptedFileGridProps = {
  sourceIndex: number;
  files: FileEntry[];
  onDeleteFile: (idx: number) => void;
  onUpdateFile: (idx: number, updated: FileEntry) => void;
  currentPath?: string[]; // passed in from parent (SourceTabs) for context
  onPathChange?: (path: string[]) => void; // called when navigated
};

const ENCRYPT_PASS = "vault-password";

const findFolderNames = (files: FileEntry[]) =>
  files.filter(f => f.type === "folder").map(f => f.name);

const EncryptedFileGrid = ({
  sourceIndex,
  files,
  onDeleteFile,
  onUpdateFile,
  currentPath: controlledPath,      // Controlled "currentPath" for parent sync
  onPathChange,                     // Handler for navigating folders
}: EncryptedFileGridProps) => {
  // Internal state only if uncontrolled
  const [uncontrolledPath, setUncontrolledPath] = useState<string[]>([]);

  // Use controlled "currentPath" if present, else internal state
  const currentPath = controlledPath ?? uncontrolledPath;
  const setCurrentPath = onPathChange ?? setUncontrolledPath;

  const [selected, setSelected] = useState<number[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const [mediaViewer, setMediaViewer] = useState<{
    fileIdx: number;
    open: boolean;
  }>({ fileIdx: -1, open: false });

  const { encryptData, decryptData } = useCrypto(ENCRYPT_PASS);
  const { setFilesPerSource } = useFileVault();

  const currentFolder = currentPath.length ? currentPath[currentPath.length - 1] : undefined;

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

  function getBreadcrumbs() {
    return [
      { label: "Root", value: undefined, idx: -1 },
      ...currentPath.map((folder, i) => ({
        label: folder,
        value: folder,
        idx: i
      })),
    ];
  }

  function handleCheck(idx: number, checked: boolean, event?: React.MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
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

  // Add: Select All
  const isAllSelected = selected.length > 0 && selected.length === files.length;
  function handleSelectAllToggle() {
    if (isAllSelected) {
      setSelected([]);
    } else {
      setSelected(files.map((_, i) => i));
    }
  }

  // Bulk decryption
  async function handleDecryptSelected() {
    // Only decrypt files that are not yet decrypted (not folders)
    const fileUpdates: { idx: number; updated: FileEntry }[] = [];

    for (const idx of selected) {
      const file = files[idx];
      if (file.type !== "folder" && !file.decrypted && file.encrypted) {
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
          // Debug log:
          console.log("[handleDecryptSelected] Decrypted", file.name, "type:", file.type, "->", !!content);
          fileUpdates.push({ idx, updated: { ...file, decrypted: content } });
        } catch (e: any) {
          console.error("[handleDecryptSelected] Decryption failed", file.name, e);
        }
      }
    }

    if (fileUpdates.length > 0) {
      // Batch update all decrypted files at once
      setFilesPerSource(prev => {
        const old = prev[sourceIndex] ?? [];
        const patched = old.map((entry, idx) => {
          const patch = fileUpdates.find(fu => fu.idx === idx);
          return patch ? patch.updated : entry;
        });
        return { ...prev, [sourceIndex]: patched };
      });
    }

    setSelected([]);
    toast({ title: "Decryption done for selected" });
  }

  // Bulk delete (extracted from previous button, not inline anymore)
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
      console.log("[EncryptedFileGrid] handleDecrypt for", file.name, file); // DEBUG
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
      console.log("[EncryptedFileGrid] Decrypted content:", content); // DEBUG
      onUpdateFile(idx, { ...file, decrypted: content });
      toast({ title: "Decryption successful" });
    } catch (e: any) {
      console.error("[EncryptedFileGrid] Decryption failed", e); // DEBUG
      toast({ title: "Decryption failed", description: e.message });
    }
  }

  async function handleEncrypt(idx: number) {
    const file = files[idx];
    // Only encrypt text/image files, skip folders
    if (file.type === "folder" || !file.decrypted) return;
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
      toast({
        title: "Encryption successful",
        description: `${file.name} is now encrypted.`,
        variant: "default",
      });
    } catch (e: any) {
      toast({ title: "Encryption failed", description: e.message, variant: "destructive" });
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

  // Only allow passing text/image files to viewer
  const selectedMediaFile = files[mediaViewer.fileIdx];
  const canShowMediaViewer =
    mediaViewer.open &&
    selectedMediaFile &&
    (selectedMediaFile.type === "image" || selectedMediaFile.type === "text");

  // -- updated toast and strict prop typing for MediaViewer --
  // Add a simple preview thumbnail technique for locked images:
  function getThumbnail(file: FileEntry) {
    // If decrypted available, use that.
    if (file.decrypted) return file.decrypted;
    // For images, if possible, derive from encrypted (in real scenario, store thumbnail field)
    // But if not possible, use a placeholder
    if (file.type === "image") {
      // Placeholder thumbnail (could make more advanced, but let's keep it simple for now)
      return "/placeholder.svg";
    }
    return undefined;
  }

  return (
    <div>
      {/* Breadcrumb trail */}
      <div className="mb-3">
        <Breadcrumb>
          <BreadcrumbList>
            {getBreadcrumbs().map((crumb, i, arr) => (
              <span key={i}>
                <BreadcrumbItem>
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
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* SELECT ALL + Bulk Actions */}
      <div className="mb-2 flex gap-2 items-center">
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={handleSelectAllToggle}
          className="accent-cyan-400 w-4 h-4 rounded border-cyan-700 focus:ring-cyan-500 cursor-pointer"
          aria-label="Select all files"
        />
        <span className="text-sm text-cyan-200 select-none mr-3">Select All</span>
        {selected.length > 0 && (
          <>
            <Button
              variant="default"
              onClick={handleDecryptSelected}
              className="flex items-center gap-2"
            >
              Decrypt Selected
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2"
            >
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
        {folders.map(folder => (
          <div
            key={folder.name + (folder as any).__idx}
            className="hover:bg-cyan-900/10 rounded-lg transition cursor-pointer"
            onClick={e => {
              // Prevent open folder on checkbox or elements with .skip-folder-open
              if (
                (e.target as HTMLElement).closest(".skip-folder-open")
              ) {
                return;
              }
              setCurrentPath([...currentPath, folder.name]);
            }}
            onDrop={e => { e.preventDefault(); onDropOnFolder(folder.name); }}
            onDragOver={e => e.preventDefault()}
          >
            <FileGridItem
              file={folder}
              checked={selected.includes((folder as any).__idx)}
              onCheck={(checked, e) => handleCheck((folder as any).__idx, checked, e as any)}
              onMove={() => null}
              onDelete={() => onDeleteFile((folder as any).__idx)}
              onDecrypt={() => null}
              onEncrypt={() => null}
              onDragStart={e => onDragStart(e, (folder as any).__idx)}
              draggable={false}
              checkboxClassName="skip-folder-open"
            />
          </div>
        ))}

        {/* --- FILES in current folder --- */}
        {filesInCurrent.map(file =>
          <div
            key={file.name + file.__idx}
            className="hover:bg-cyan-900/10 rounded-lg transition cursor-pointer"
            onClick={() => {
              // Only show media viewer if file is decrypted
              if (file.decrypted && (file.type === "image" || file.type === "text")) {
                setMediaViewer({ fileIdx: file.__idx, open: true });
              }
            }}
          >
            <FileGridItem
              file={file}
              checked={selected.includes(file.__idx)}
              onCheck={(checked, e) => handleCheck(file.__idx, checked, e as any)}
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
              checkboxClassName=""
            />
          </div>
        )}
      </div>
      {/* Media Viewer (outside grid): only shows if file is decrypted and supported */}
      {canShowMediaViewer && selectedMediaFile.decrypted ? (
        <MediaViewer
          open={mediaViewer.open}
          setOpen={(open: boolean) => setMediaViewer(m => ({ ...m, open }))}
          file={{
            name: selectedMediaFile.name,
            type: selectedMediaFile.type as "image" | "text",
            decrypted: selectedMediaFile.decrypted ||
              (selectedMediaFile.type === "image" ? getThumbnail(selectedMediaFile) : ""),
            liked: selectedMediaFile.liked,
          }}
          onPrev={() => {
            const currentIdx = filesInCurrent.findIndex(f => f.__idx === mediaViewer.fileIdx);
            // Only navigate to previous decrypted file
            for (let i = currentIdx - 1; i >= 0; i--) {
              if (filesInCurrent[i].decrypted && (filesInCurrent[i].type === "image" || filesInCurrent[i].type === "text")) {
                setMediaViewer({ fileIdx: filesInCurrent[i].__idx, open: true });
                break;
              }
            }
          }}
          onNext={() => {
            const currentIdx = filesInCurrent.findIndex(f => f.__idx === mediaViewer.fileIdx);
            for (let i = currentIdx + 1; i < filesInCurrent.length; i++) {
              if (filesInCurrent[i].decrypted && (filesInCurrent[i].type === "image" || filesInCurrent[i].type === "text")) {
                setMediaViewer({ fileIdx: filesInCurrent[i].__idx, open: true });
                break;
              }
            }
          }}
        />
      ) : null}
    </div>
  );
};

export default EncryptedFileGrid;
