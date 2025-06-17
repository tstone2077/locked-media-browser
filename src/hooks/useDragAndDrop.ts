
import { useState } from "react";
import { FileEntry } from "@/context/FileVaultContext";

export const useDragAndDrop = (
  files: FileEntry[],
  onUpdateFile: (idx: number, updated: FileEntry) => void
) => {
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

  return {
    draggedIdx,
    handleDragStart,
    handleDragEnd,
    handleDropOnFolder
  };
};
