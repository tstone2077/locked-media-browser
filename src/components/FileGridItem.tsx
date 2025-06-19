import React from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { FolderPlus, FilePlus, Lock, Image as ImageIcon, Trash2, Folder, Move, Unlock, Video } from "lucide-react";

type FileGridItemProps = {
  file: FileEntry;
  checked: boolean;
  onCheck: (checked: boolean, event?: React.MouseEvent) => void;
  onMove?: () => void;
  onDelete?: () => void;
  onDecrypt?: () => void;
  onEncrypt?: () => void;
  onDragStart?: (e: React.DragEvent, file: FileEntry) => void;
  onDrop?: (file: FileEntry) => void;
  onDragOver?: (e: React.DragEvent) => void;
  draggable?: boolean;
  checkboxClassName?: string;
};

export const FileGridItem: React.FC<FileGridItemProps> = ({
  file,
  checked,
  onCheck,
  onMove,
  onDelete,
  onDecrypt,
  onEncrypt,
  onDragStart,
  onDrop,
  onDragOver,
  draggable,
  checkboxClassName = "",
}) => {
  // Check for valid encrypted value (non-empty string with a ":")
  const canDecrypt = file.type !== "folder" && !!file.encrypted && file.encrypted.includes(":") && !file.decrypted;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={
            "flex flex-col items-center justify-center p-6 rounded-xl bg-[#161e2f] shadow-lg border border-cyan-900/40 relative group" +
            (draggable ? " cursor-move" : "")
          }
          draggable={draggable}
          onDragStart={e => onDragStart && onDragStart(e, file)}
          onDrop={e => {
            e.preventDefault();
            onDrop && onDrop(file);
          }}
          onDragOver={onDragOver}
        >
          {/* Checkbox */}
          <span className={`absolute left-2 top-2 z-20 ${checkboxClassName}`}>
            <Checkbox
              checked={checked}
              onClick={e => e.stopPropagation()}
              onCheckedChange={c => onCheck(!!c, (window.event || undefined) as any)}
            />
          </span>

          {/* Icon/preview */}
          <div className="mb-2">
            {file.type === "folder" ? (
              <Folder className="w-12 h-12 text-cyan-400" />
            ) : file.type === "image" ? (
              file.decrypted ? (
                <img
                  src={file.decrypted}
                  alt={file.name}
                  className="w-16 h-16 object-cover rounded animate-fade-in"
                  draggable={false}
                />
              ) : (
                <Lock className="w-12 h-12 text-cyan-600 animate-pulse" />
              )
            ) : file.type === "video" ? (
              file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt={file.name}
                  className="w-16 h-16 object-cover rounded animate-fade-in relative"
                  draggable={false}
                />
              ) : file.decrypted ? (
                <Video className="w-12 h-12 text-cyan-200" />
              ) : (
                <Lock className="w-12 h-12 text-cyan-600 animate-pulse" />
              )
            ) : file.decrypted ? (
              <ImageIcon className="w-12 h-12 text-cyan-200" />
            ) : (
              <Lock className="w-12 h-12 text-cyan-600 animate-pulse" />
            )}
          </div>
          <div className="text-base font-semibold text-cyan-200 truncate">{file.name}</div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {canDecrypt && (
          <ContextMenuItem onClick={onDecrypt}>
            <Unlock className="w-4 h-4 mr-2" /> Decrypt
          </ContextMenuItem>
        )}
        {file.type !== "folder" && file.decrypted && (
          <ContextMenuItem onClick={onEncrypt}>
            <Lock className="w-4 h-4 mr-2" /> Encrypt
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={onMove}>
          <Move className="w-4 h-4 mr-2" /> Move
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
