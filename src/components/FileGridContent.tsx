
import React from "react";
import { FileEntry } from "@/context/FileVaultContext";
import { FileGridItem } from "./FileGridItem";
import { toast } from "@/hooks/use-toast";
import { useCrypto } from "@/hooks/useCrypto";
import { generateVideoThumbnail } from "@/utils/videoThumbnail";

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
  onEditTags?: (idx: number) => void;
  onEditText?: (file: any, idx: number) => void;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDropOnFolder: (folderName: string) => void;
  onDragEnd: () => void;
  setMediaViewer: (view: { fileIdx: number; open: boolean }) => void;
  onUpdateFile: (idx: number, updatedFile: any) => void;
};

const ENCRYPT_PASS = "vault-password";

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
  onEditTags,
  onEditText,
  onDragStart,
  onDropOnFolder,
  onDragEnd,
  setMediaViewer,
  onUpdateFile,
}: FileGridContentProps) => {
  const { decryptData } = useCrypto(ENCRYPT_PASS);

  // Helper to validate encrypted string
  function isValidCiphertext(ciphertext: string) {
    if (typeof ciphertext !== "string") return false;
    if (!ciphertext.includes(":")) return false;
    const [iv, ct] = ciphertext.split(":");
    return Boolean(iv && ct);
  }

  // Enhanced direct decryption handler with proper video handling
  const handleDecrypt = async (file: any) => {
    try {
      if (!file.encrypted || !isValidCiphertext(file.encrypted)) {
        toast({
          title: "Decryption Error",
          description: "File missing or malformed ciphertext.",
          variant: "destructive",
        });
        return;
      }

      console.log(`[FileGridContent] Attempting to decrypt ${file.name}`, { 
        type: file.type, 
        hasEncrypted: !!file.encrypted 
      });

      // Decrypt the data
      const decryptedBuffer = await decryptData(file.encrypted);
      
      let decryptedDataUrl: string;
      
      if (file.type === "image" || file.type === "video") {
        // For media files, convert ArrayBuffer to blob and create object URL
        const mimeType = file.type === "image" ? "image/png" : "video/mp4";
        const blob = new Blob([decryptedBuffer], { type: mimeType });
        decryptedDataUrl = URL.createObjectURL(blob);
      } else {
        // For text files, convert to string
        const decoder = new TextDecoder();
        decryptedDataUrl = decoder.decode(decryptedBuffer);
      }

      console.log(`[FileGridContent] Successfully decrypted ${file.name}`, { 
        decryptedLength: decryptedDataUrl.length,
        isObjectUrl: decryptedDataUrl.startsWith('blob:')
      });

      // Generate thumbnail for videos
      let thumbnail: string | undefined;
      if (file.type === "video") {
        try {
          thumbnail = await generateVideoThumbnail(decryptedDataUrl);
          console.log(`[FileGridContent] Generated thumbnail for ${file.name}`);
        } catch (err) {
          console.warn(`[FileGridContent] Failed to generate thumbnail for ${file.name}:`, err);
        }
      }

      // Update the file with decrypted data using the proper update handler
      const updatedFile = { 
        ...file, 
        decrypted: decryptedDataUrl,
        ...(thumbnail && { thumbnail })
      };
      onUpdateFile(file.__idx, updatedFile);
      
      toast({
        title: "File decrypted!",
        description: `"${file.name}" successfully decrypted.`,
        variant: "success",
      });

      // If it's a media file, open the viewer immediately
      if (file.type === "image" || file.type === "video") {
        setMediaViewer({ fileIdx: file.__idx, open: true });
      }
      
    } catch (err) {
      console.error(`[FileGridContent] Decryption failed for ${file.name}:`, err);
      toast({
        title: "Decryption Failed",
        description: (err as Error)?.message || "Failed to decrypt the file.",
        variant: "destructive",
      });
    }
  };

  // Customized onDragStart: set x-vault-internal type for vault files/folders
  function handleDragStartForVault(e: React.DragEvent, idx: number) {
    e.dataTransfer.setData("application/x-vault-internal", "1");
    onDragStart(e, idx);
  }

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
            onEditTags={() => onEditTags?.(folder.__idx)}
            onDragStart={e => handleDragStartForVault(e, folder.__idx)}
            draggable={false}
            checkboxClassName="skip-folder-open"
          />
        </div>
      ))}
      {filesInCurrent.map(file =>
        <div
          key={file.name + file.__idx}
          className="hover:bg-cyan-900/10 rounded-lg transition cursor-pointer"
          onClick={async () => {
            if (file.type === "text") {
              // Open text files in the editor
              if (onEditText) {
                onEditText(file, file.__idx);
              }
            } else if (file.type === "image" || file.type === "video") {
              if (file.decrypted) {
                setMediaViewer({ fileIdx: file.__idx, open: true });
              } else {
                await handleDecrypt(file);
              }
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
              if (target) setCurrentPath([...currentPath, target]);
            }}
            onDelete={() => onDeleteFile(file.__idx)}
            onDecrypt={() => handleDecrypt(file)}
            onEncrypt={() => onEncrypt(file.__idx)}
            onEditTags={() => onEditTags?.(file.__idx)}
            onDragStart={e => handleDragStartForVault(e, file.__idx)}
            draggable={file.type !== "folder"}
            checkboxClassName=""
          />
        </div>
      )}
    </div>
  );
};

export default FileGridContent;
