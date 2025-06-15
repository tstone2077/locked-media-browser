import React from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { FileGridItem } from "./FileGridItem";
import { toast } from "@/hooks/use-toast";

type FileGridContentProps = {
  folders: any[];
  filesInCurrent: any[];
  selected: number[];
  handleCheck: (idx: number, checked: boolean, e?: React.MouseEvent) => void;
  setCurrentPath: (path: string[]) => void;
  currentPath: string[];
  allFolders: string[];
  onDeleteFile: (idx: number) => void;
  onDecrypt: (idx: number) => void;
  onEncrypt: (idx: number) => void;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDropOnFolder: (folderName: string) => void;
  onDragEnd: () => void;
  setMediaViewer: (view: { fileIdx: number; open: boolean }) => void;
};

const FileGridContent = ({
  folders,
  filesInCurrent,
  selected,
  handleCheck,
  setCurrentPath,
  currentPath,
  allFolders,
  onDeleteFile,
  onDecrypt,
  onEncrypt,
  onDragStart,
  onDropOnFolder,
  onDragEnd,
  setMediaViewer,
}: FileGridContentProps) => {
  return (
    <div className="grid gap-8 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 animate-fade-in">
      {folders.map(folder => (
        <div
          key={folder.name + folder.__idx}
          className="hover:bg-cyan-900/10 rounded-lg transition cursor-pointer"
          onClick={e => {
            if ((e.target as HTMLElement).closest(".skip-folder-open")) return;
            setCurrentPath([...currentPath, folder.name]);
          }}
          onDrop={e => { e.preventDefault(); onDropOnFolder(folder.name); }}
          onDragOver={e => e.preventDefault()}
        >
          <FileGridItem
            file={folder}
            checked={selected.includes(folder.__idx)}
            onCheck={(checked, e) => handleCheck(folder.__idx, checked, e as any)}
            onMove={() => null}
            onDelete={() => onDeleteFile(folder.__idx)}
            onDecrypt={() => null}
            onEncrypt={() => null}
            onDragStart={e => onDragStart(e, folder.__idx)}
            draggable={false}
            checkboxClassName="skip-folder-open"
          />
        </div>
      ))}
      {filesInCurrent.map(file =>
        <div
          key={file.name + file.__idx}
          className="hover:bg-cyan-900/10 rounded-lg transition cursor-pointer"
          onClick={() => {
            // If file is image or text and decrypted, open preview
            if (file.decrypted && (file.type === "image" || file.type === "text")) {
              setMediaViewer({ fileIdx: file.__idx, open: true });
            } else if ((file.type === "image" || file.type === "text")) {
              // Attempt to decrypt the file directly
              onDecrypt(file.__idx);
            }
            // For folders, do nothing (the grid treats folders specially)
          }}
        >
          <FileGridItem
            file={file}
            checked={selected.includes(file.__idx)}
            onCheck={(checked, e) => handleCheck(file.__idx, checked, e as any)}
            onMove={() => {
              if (!allFolders.length) return;
              const target = prompt("Move to which folder?", allFolders[0]);
              if (target) setCurrentPath([...currentPath, target]);
            }}
            onDelete={() => onDeleteFile(file.__idx)}
            onDecrypt={() => onDecrypt(file.__idx)}
            onEncrypt={() => onEncrypt(file.__idx)}
            onDragStart={e => onDragStart(e, file.__idx)}
            draggable={file.type !== "folder"}
            checkboxClassName=""
          />
        </div>
      )}
    </div>
  );
};

export default FileGridContent;
