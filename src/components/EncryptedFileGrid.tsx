import React, { useState, useEffect } from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { FileGridItem } from "./FileGridItem";
import { useCrypto } from "@/hooks/useCrypto";
import { useFileVault } from "@/context/FileVaultContext";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import MediaViewer from "./MediaViewer";
import BulkActionsBar from "./BulkActionsBar";
import FileGridContent from "./FileGridContent";
import { toast } from "@/hooks/use-toast";

type EncryptedFileGridProps = {
  sourceIndex: number;
  files: FileEntry[];
  onDeleteFile: (idx: number) => void;
  onUpdateFile: (idx: number, updated: FileEntry) => void;
  currentPath?: string[];
  onPathChange?: (path: string[]) => void;
};

const ENCRYPT_PASS = "vault-password";

// MOCKED: Fetch folders from OpenDrive API (replace this with real API if available)
async function fetchOpenDriveFolders(source: any, path: string[] = []): Promise<{ name: string; parent?: string }[]> {
  // Simulate API directory listing
  await new Promise(res => setTimeout(res, 500)); // Simulate delay
  // Example structure
  if (path.length === 0) {
    return [
      { name: "Photos" },
      { name: "Documents" },
    ];
  }
  if (path[path.length - 1] === "Photos") return [{ name: "Family", parent: "Photos" }, { name: "Vacation", parent: "Photos" }];
  if (path[path.length - 1] === "Documents") return [{ name: "Work", parent: "Documents" }];
  return [];
}

const EncryptedFileGrid = ({
  sourceIndex,
  files,
  onDeleteFile,
  onUpdateFile,
  currentPath: controlledPath,
  onPathChange,
}: EncryptedFileGridProps) => {
  const [uncontrolledPath, setUncontrolledPath] = useState<string[]>([]);
  const currentPath = controlledPath ?? uncontrolledPath;
  const setCurrentPath = onPathChange ?? setUncontrolledPath;
  const [selected, setSelected] = useState<number[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [mediaViewer, setMediaViewer] = useState<{ fileIdx: number; open: boolean }>({ fileIdx: -1, open: false });
  const { encryptData, decryptData } = useCrypto(ENCRYPT_PASS);
  const { setFilesPerSource, filesPerSource } = useFileVault();
  const currentFolder = currentPath.length ? currentPath[currentPath.length - 1] : undefined;

  // NEW: Detect config of this source to check for OpenDrive
  const sourceConfigs = JSON.parse(window.sessionStorage.getItem("sources") || "[]");
  const thisSource = sourceConfigs[sourceIndex];

  // Update folders from OpenDrive when source is of type opendrive.
  useEffect(() => {
    let mounted = true;
    async function loadFoldersIfOpenDrive() {
      if (!thisSource || thisSource.type !== "opendrive") return;
      // Fetch folders from OpenDrive API (replace this with real API)
      const foundFolders = await fetchOpenDriveFolders(thisSource, currentPath);
      // Map to folder FileEntries
      setFilesPerSource(prev => {
        const prevArr = prev[sourceIndex] ?? [];
        // Remove all folders at this level for the opendrive source
        const nonFolder = prevArr.filter(f => f.type !== "folder" || (f.parent && f.parent !== currentFolder));
        const newFolders = foundFolders.map(({ name, parent }) => ({
          name,
          type: "folder",
          encrypted: "",
          parent: parent ?? (currentPath.length > 0 ? currentFolder : undefined),
        }));
        // Only add folders not already present
        const updated = [
          ...nonFolder,
          ...newFolders.filter(nf => !prevArr.some(f => f.type === "folder" && f.name === nf.name && f.parent === nf.parent)),
        ];
        return { ...prev, [sourceIndex]: updated };
      });
    }
    loadFoldersIfOpenDrive();
    return () => { mounted = false; };
    // eslint-disable-next-line
  }, [sourceIndex, JSON.stringify(currentPath)]);

  // Utility functions for getting visible files/folders
  function getSubfolders() {
    return files
      .map((f, idx) => ({ ...f, __idx: idx }))
      .filter(f =>
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
    if (event) event.stopPropagation();
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
  }
  const allFolders = files.filter(f => f.type === "folder").map(f => f.name);
  const folders = getSubfolders();
  const filesInCurrent = getVisibleFiles();

  // Bulk actions that will be passed to our bar
  async function handleBulkDecrypt(idxList: number[]) {
    const fileUpdates: { idx: number; updated: FileEntry }[] = [];
    let errorCount = 0;
    for (const idx of idxList) {
      const file = files[idx];
      if (file.type !== "folder" && !file.decrypted && file.encrypted) {
        if (typeof file.encrypted !== "string" || !file.encrypted.includes(":")) {
          errorCount++;
          toast({ title: `File ${file.name} is missing or malformed ciphertext`, variant: "destructive" });
          continue;
        }
        try {
          const decryptedBuf = await decryptData(file.encrypted);
          let content: string = "";
          if (file.type === "text") content = new TextDecoder().decode(decryptedBuf);
          else if (file.type === "image") {
            const blob = new Blob([decryptedBuf]);
            content = await new Promise<string>(resolve => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
          fileUpdates.push({ idx, updated: { ...file, decrypted: content } });
          console.log(`[EncryptedFileGrid] Bulk decrypted ${file.name}`, { decrypted: content });
        } catch (e) {
          errorCount++;
          toast({ title: `Decryption failed for ${file.name}`, variant: "destructive" });
          console.error(`[EncryptedFileGrid] Failed to decrypt file ${file.name}:`, e);
        }
      }
    }
    if (fileUpdates.length > 0) {
      setFilesPerSource(prev => {
        const old = prev[sourceIndex] ?? [];
        const patched = old.map((entry, idx) => {
          const patch = fileUpdates.find(fu => fu.idx === idx);
          return patch ? patch.updated : entry;
        });
        return { ...prev, [sourceIndex]: patched };
      });
      toast({ title: `Decryption done for ${fileUpdates.length} file(s)` });
    }
    if (fileUpdates.length === 0 && errorCount === 0) {
      toast({ title: "No files decrypted.", variant: "default" });
    }
    setSelected([]);
  }
  function handleBulkDelete(idxList: number[]) {
    setFilesPerSource(prev => {
      const old = prev[sourceIndex] ?? [];
      return {
        ...prev,
        [sourceIndex]: old.filter((_, idx) => !idxList.includes(idx)),
      };
    });
    setSelected([]);
  }
  async function handleDecrypt(idx: number) {
    const file = files[idx];
    if (!file.encrypted || !file.encrypted.includes(":")) {
      toast({ title: "File missing or malformed ciphertext", variant: "destructive" });
      return;
    }
    try {
      const decryptedBuf = await decryptData(file.encrypted);
      let content: string = "";
      if (file.type === "text") content = new TextDecoder().decode(decryptedBuf);
      else if (file.type === "image") {
        const blob = new Blob([decryptedBuf]);
        content = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      onUpdateFile(idx, { ...file, decrypted: content });
      toast({ title: `${file.name} decrypted successfully` });
      console.log(`[EncryptedFileGrid] Decrypted ${file.name}`, { decrypted: content });
    } catch (e) {
      toast({ title: `Decryption failed for ${file.name}`, variant: "destructive" });
      console.error(`[EncryptedFileGrid] Failed to decrypt file ${file.name}:`, e);
    }
  }
  async function handleEncrypt(idx: number) {
    const file = files[idx];
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
    } catch {}
  }
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
  }
  function onDragEnd() {
    setDraggedIdx(null);
  }

  // Thumbnail preview
  function getThumbnail(file: FileEntry) {
    if (file.decrypted) return file.decrypted;
    if (file.type === "image") return "/placeholder.svg";
    return undefined;
  }
  const selectedMediaFile = files[mediaViewer.fileIdx];
  const canShowMediaViewer =
    mediaViewer.open &&
    selectedMediaFile &&
    (selectedMediaFile.type === "image" || selectedMediaFile.type === "text");

  return (
    <div>
      {/* Breadcrumb */}
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
      {/* Bulk Actions Bar */}
      <BulkActionsBar
        files={files}
        selected={selected}
        setSelected={setSelected}
        allFolders={allFolders}
        onBulkDecrypt={handleBulkDecrypt}
        onBulkDelete={handleBulkDelete}
        onMove={handleMove}
      />
      {/* Main grid */}
      <FileGridContent
        folders={folders}
        filesInCurrent={filesInCurrent}
        selected={selected}
        handleCheck={handleCheck}
        setCurrentPath={setCurrentPath}
        currentPath={currentPath}
        allFolders={allFolders}
        onDeleteFile={onDeleteFile}
        onDecrypt={handleDecrypt}
        onEncrypt={handleEncrypt}
        onDragStart={onDragStart}
        onDropOnFolder={onDropOnFolder}
        onDragEnd={onDragEnd}
        setMediaViewer={setMediaViewer}
      />
      {/* Media Viewer */}
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
