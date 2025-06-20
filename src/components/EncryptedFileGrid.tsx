import React, { useState, useMemo } from "react";
import { FileEntry } from "@/context/FileVaultContext";
import FileNavigation from "./FileNavigation";
import FileSearch from "./FileSearch";
import TagFilter from "./TagFilter";
import BulkActionsBar from "./BulkActionsBar";
import FileGridContent from "./FileGridContent";
import MediaViewer from "./MediaViewer";
import TagEditModal from "./TagEditModal";
import TextEditor from "./TextEditor";
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<"and" | "or">("or");
  const [tagEditModal, setTagEditModal] = useState<{ open: boolean; file: FileEntry | null; fileIdx: number }>({
    open: false,
    file: null,
    fileIdx: -1
  });
  const [textEditor, setTextEditor] = useState<{ open: boolean; file: FileEntry | null; fileIdx: number }>({
    open: false,
    file: null,
    fileIdx: -1
  });
  
  // Always call hooks in the same order
  const mediaViewerHook = useMediaViewer();
  const fileOperationsHook = useFileOperations(files, onDeleteFile, onUpdateFile);
  const dragAndDropHook = useDragAndDrop(files, onUpdateFile);

  // Destructure after all hooks are called
  const { mediaViewer, setMediaViewer, navigatePrev, navigateNext } = mediaViewerHook;
  const {
    selected,
    setSelected,
    handleCheck,
    handleBulkDelete,
    handleBulkDecrypt,
    handleMove,
    handleEncrypt
  } = fileOperationsHook;
  const {
    handleDragStart,
    handleDragEnd,
    handleDropOnFolder
  } = dragAndDropHook;

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
    let result = filesInCurrent;
    
    // Apply search filter
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(file => file.name.toLowerCase().includes(term));
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      result = result.filter(file => {
        const fileTags = file.tags || [];
        if (tagFilterMode === "and") {
          return selectedTags.every(tag => fileTags.includes(tag));
        } else {
          return selectedTags.some(tag => fileTags.includes(tag));
        }
      });
    }
    
    return result;
  }, [filesInCurrent, searchTerm, selectedTags, tagFilterMode]);

  // Add index property to files for proper tracking
  const indexedFiles = useMemo(() => {
    return files.map((file, index) => ({ ...file, __idx: index }));
  }, [files]);

  const indexedFolders = useMemo(() => {
    return folders.map(folder => {
      const originalIndex = files.findIndex(f => f === folder);
      return { ...folder, __idx: originalIndex };
    });
  }, [folders, files]);

  const indexedFilteredFiles = useMemo(() => {
    return filteredFiles.map(file => {
      const originalIndex = files.findIndex(f => f === file);
      return { ...file, __idx: originalIndex };
    });
  }, [filteredFiles, files]);

  // Get all non-folder files for navigation
  const allMediaFiles = useMemo(() => {
    return indexedFiles.filter(f => f.type !== "folder");
  }, [indexedFiles]);

  // Get current file for media viewer - now includes full file data
  const currentFile = useMemo(() => {
    if (mediaViewer.fileIdx >= 0 && mediaViewer.fileIdx < allMediaFiles.length) {
      const file = allMediaFiles[mediaViewer.fileIdx];
      if (file && file.type !== "folder") {
        return {
          name: file.name,
          type: file.type as "image" | "text" | "video",
          decrypted: file.decrypted,
          liked: file.liked,
          encrypted: file.encrypted,
          __idx: file.__idx
        };
      }
    }
    return { name: "", type: "text" as const, decrypted: "", liked: false };
  }, [mediaViewer.fileIdx, allMediaFiles]);

  // Get full file data for metadata panel
  const currentFullFile = useMemo(() => {
    if (mediaViewer.fileIdx >= 0 && mediaViewer.fileIdx < allMediaFiles.length) {
      return allMediaFiles[mediaViewer.fileIdx];
    }
    return null;
  }, [mediaViewer.fileIdx, allMediaFiles]);

  const handleEditTags = (fileIdx: number) => {
    const file = files[fileIdx];
    if (file) {
      setTagEditModal({ open: true, file, fileIdx });
    }
  };

  const handleEditText = (file: FileEntry, fileIdx: number) => {
    setTextEditor({ open: true, file, fileIdx });
  };

  const handleSaveTags = (tags: string[]) => {
    if (tagEditModal.fileIdx >= 0) {
      const updatedFile = { ...files[tagEditModal.fileIdx], tags };
      onUpdateFile(tagEditModal.fileIdx, updatedFile);
    }
    setTagEditModal({ open: false, file: null, fileIdx: -1 });
  };

  const currentFolder = currentPath.length ? currentPath[currentPath.length - 1] : undefined;

  return (
    <div className="w-full">
      <FileNavigation currentPath={currentPath} onPathChange={onPathChange} />

      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="flex-1 space-y-2">
          <FileSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <TagFilter 
            files={files}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            filterMode={tagFilterMode}
            onFilterModeChange={setTagFilterMode}
          />
        </div>
        <BulkActionsBar
          files={indexedFiles}
          selected={selected}
          setSelected={setSelected}
          allFolders={allFolders}
          onBulkDecrypt={handleBulkDecrypt}
          onBulkDelete={handleBulkDelete}
          onMove={handleMove}
        />
      </div>

      <FileGridContent
        folders={indexedFolders}
        filesInCurrent={indexedFilteredFiles}
        selected={selected}
        handleCheck={handleCheck}
        setCurrentPath={onPathChange}
        currentPath={currentPath}
        allFolders={allFolders}
        onDeleteFile={onDeleteFile}
        onDecrypt={() => { }}
        onEncrypt={handleEncrypt}
        onEditTags={handleEditTags}
        onEditText={handleEditText}
        onDragStart={handleDragStart}
        onDropOnFolder={handleDropOnFolder}
        onDragEnd={handleDragEnd}
        setMediaViewer={setMediaViewer}
        onUpdateFile={onUpdateFile}
      />

      <MediaViewer
        open={mediaViewer.open}
        setOpen={open => setMediaViewer({ ...mediaViewer, open })}
        file={currentFile}
        fullFile={currentFullFile}
        onPrev={() => navigatePrev(0)}
        onNext={() => navigateNext(allMediaFiles.length - 1)}
        onUpdateFile={onUpdateFile}
      />

      <TagEditModal
        open={tagEditModal.open}
        onOpenChange={(open) => setTagEditModal(prev => ({ ...prev, open }))}
        file={tagEditModal.file}
        onSave={handleSaveTags}
      />

      <TextEditor
        open={textEditor.open}
        onOpenChange={(open) => setTextEditor(prev => ({ ...prev, open }))}
        sourceIndex={sourceIndex}
        currentFolder={currentFolder}
        existingFile={textEditor.file}
        fileIdx={textEditor.fileIdx}
      />
    </div>
  );
};

export default EncryptedFileGrid;
