
import React, { useState, useMemo } from "react";
import { FileEntry } from "@/context/FileVaultContext";
import FileNavigation from "./FileNavigation";
import FileSearch from "./FileSearch";
import BulkActionsBar from "./BulkActionsBar";
import FileGridContent from "./FileGridContent";
import MediaViewer from "./MediaViewer";
import { useMediaViewer } from "@/hooks/useMediaViewer";
import { useFileOperations } from "@/hooks/useFileOperations";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

type EncryptedFileGridProps = {
  sourceIndex: number;
  files: FileEntry[];
  onDeleteFile: (idx: number) => void;
  onUpdateFile: (idx: number, updated: FileEntry) => void;
  currentPath: string[];
  onPathChange: (path: string[]) => void;
};

const EncryptedFileGrid = ({
  sourceIndex,
  files,
  onDeleteFile,
  onUpdateFile,
  currentPath,
  onPathChange,
}: EncryptedFileGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { mediaViewer, setMediaViewer, navigatePrev, navigateNext } = useMediaViewer();
  
  const {
    selected,
    setSelected,
    handleCheck,
    handleBulkDelete,
    handleBulkDecrypt,
    handleMove,
    handleEncrypt
  } = useFileOperations(files, onDeleteFile, onUpdateFile);

  const {
    handleDragStart,
    handleDragEnd,
    handleDropOnFolder
  } = useDragAndDrop(files, onUpdateFile);

  const folders = useMemo(() => {
    return files.filter(f => f.type === "folder" && (f.parent === undefined || f.parent === currentPath[currentPath.length - 1]));
  }, [files, currentPath]);

  const filesInCurrent = useMemo(() => {
    return files.filter(f => f.type !== "folder" && (f.parent === undefined ? currentPath.length === 0 : f.parent === currentPath[currentPath.length - 1]));
  }, [files, currentPath]);

  const allFolders = useMemo(() => {
    return files.filter(f => f.type === "folder").map(f => f.name);
  }, [files]);

  const filteredFiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filesInCurrent;
    return filesInCurrent.filter(file => file.name.toLowerCase().includes(term));
  }, [filesInCurrent, searchTerm]);

  return (
    <div className="w-full">
      <FileNavigation currentPath={currentPath} onPathChange={onPathChange} />

      <div className="flex justify-between items-center mb-4">
        <FileSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <BulkActionsBar
          files={files}
          selected={selected}
          setSelected={setSelected}
          allFolders={allFolders}
          onBulkDecrypt={handleBulkDecrypt}
          onBulkDelete={handleBulkDelete}
          onMove={handleMove}
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
        file={files[mediaViewer.fileIdx] && files[mediaViewer.fileIdx].type !== "folder" ? {
          name: files[mediaViewer.fileIdx].name,
          type: files[mediaViewer.fileIdx].type as "image" | "text" | "video",
          decrypted: files[mediaViewer.fileIdx].decrypted,
          liked: files[mediaViewer.fileIdx].liked
        } : { name: "", type: "text" as const, decrypted: "", liked: false }}
        onPrev={() => navigatePrev(0)}
        onNext={() => navigateNext(files.length - 1)}
      />
    </div>
  );
};

export default EncryptedFileGrid;
