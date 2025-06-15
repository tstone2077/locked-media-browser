import { useSources } from "@/lib/sources";
import EncryptedFileGrid from "./EncryptedFileGrid";
import { useState, useRef } from "react";
import { Image, FolderPlus, FilePlus } from "lucide-react";
import AddFileModal from "./AddFileModal";
import AddFolderModal from "./AddFolderModal";
import EncryptionProgressBar from "./EncryptionProgressBar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCrypto } from "@/hooks/useCrypto";
import { useFileVault, FileEntry } from "@/context/FileVaultContext";
import { toast } from "@/hooks/use-toast";

// Drag-and-drop helpers
function isFileImage(file: File) {
  return file.type.startsWith("image/");
}
function isFileText(file: File) {
  return file.type.startsWith("text/");
}

const initialFilesPerSource: Record<number, FileEntry[]> = {};

const ENCRYPT_PASS = "vault-password";

const SourceTabs = () => {
  const { sources } = useSources();
  const [active, setActive] = useState(0);

  // Use context for file state
  const { filesPerSource, setFilesPerSource } = useFileVault();

  // Modal state for "Add File"
  const [addFileOpen, setAddFileOpen] = useState(false);
  // NEW: To prefill modal with data URL if drag+drop
  const [addFilePrefill, setAddFilePrefill] = useState<string | undefined>(undefined);

  // New state for folder modal
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  // New: track navigation path (folder chain) for each tab
  const [currentPathPerSource, setCurrentPathPerSource] = useState<Record<number, string[]>>({});
  // current folder path for this tab
  const currentPath = currentPathPerSource[active] ?? [];
  const setCurrentPath = (path: string[]) => {
    setCurrentPathPerSource((paths) => ({
      ...paths,
      [active]: path,
    }));
  };
  const currentFolder = currentPath.length ? currentPath[currentPath.length - 1] : undefined;

  // encryption with WebCrypto API
  const { encryptData, progress } = useCrypto(ENCRYPT_PASS);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionFileName, setEncryptionFileName] = useState<string | null>(null);

  // DRAG AND DROP
  const [isDragOver, setIsDragOver] = useState(false);
  const dragTargetCount = useRef(0); // Track nested dragenter/dragleave

  // Handle drag events on top-level container
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  }
  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragTargetCount.current += 1;
    setIsDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    dragTargetCount.current -= 1;
    if (dragTargetCount.current <= 0) {
      setIsDragOver(false);
      dragTargetCount.current = 0;
    }
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    dragTargetCount.current = 0;

    const files = e.dataTransfer.files;
    const droppedText = e.dataTransfer.getData("text/plain")?.trim();

    // Helper function to check if text is a valid dataUrl
    const isDataUrl = (text: string) =>
      typeof text === "string" &&
      (text.startsWith("data:image/") || text.startsWith("data:text/"));

    // 1. Try file drop (image/text only)
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          setAddFilePrefill(result); // set to prefill modal
          setAddFileOpen(true);
        } else {
          toast({
            title: "Could not read the dropped file.",
            description: "FileReader result was not a string.",
            variant: "destructive"
          });
        }
      };

      // Only support image and text files for now
      if (isFileImage(file) || isFileText(file)) {
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Unsupported file type",
          description: "Only image and text files are supported for now.",
          variant: "destructive"
        });
      }
      return; // nothing else to check
    }

    // 2. If not a file, try dropped text (data URL as string)
    if (droppedText) {
      if (isDataUrl(droppedText)) {
        setAddFilePrefill(droppedText);
        setAddFileOpen(true);
      } else {
        toast({
          title: "Dropped text is not a valid data URL.",
          description: "Please drop a valid data URL (e.g. data:image/png;base64,...)",
          variant: "destructive"
        });
      }
      return; // handled
    }

    // 3. If neither, show error
    toast({
      title: "Unsupported drop",
      description: "Please drop an image/text file or a valid data URL.",
      variant: "destructive"
    });
  }

  async function handleAddFile(dataUrl: string) {
    const isImage = dataUrl.startsWith("data:image/");
    const name = isImage ? `Image-${Date.now()}.png` : `Text-${Date.now()}.txt`;
    setEncryptionFileName(name);
    setIsEncrypting(true);
    try {
      let encrypted: string;
      if (isImage) {
        // For image, need to convert dataUrl -> ArrayBuffer
        const response = await fetch(dataUrl);
        const buf = await response.arrayBuffer();
        encrypted = await encryptData(buf);
      } else {
        // For text, encrypt text directly
        // Remove "data:text/plain;base64," prefix if present
        let raw = dataUrl;
        const prefix = "data:text/plain;base64,";
        if (raw.startsWith(prefix)) {
          raw = atob(raw.slice(prefix.length));
        }
        encrypted = await encryptData(raw);
      }
      setFilesPerSource((prev) => {
        const sourceFiles = prev[active] ?? [];
        return {
          ...prev,
          [active]: [
            ...sourceFiles,
            { name, type: isImage ? "image" : "text", encrypted, parent: currentFolder }
          ]
        };
      });
      setEncryptionFileName(null);
      setIsEncrypting(false);
      toast({ title: `${name} encrypted and added successfully.`, variant: "success" });
      console.log(`[SourceTabs] File added: ${name}`, { encrypted });
    } catch (err) {
      setEncryptionFileName(null);
      setIsEncrypting(false);
      toast({ title: `Failed to add ${name}`, description: String(err), variant: "destructive" });
      console.error("[SourceTabs] Encryption failed:", err);
    }
  }

  function handleAddFolder() {
    if (!folderName.trim()) return;
    setFilesPerSource((prev) => {
      const sourceFiles = prev[active] ?? [];
      // Prevent duplicate folder name in same parent
      if (
        sourceFiles.some(
          (f) =>
            f.type === "folder" &&
            f.name === folderName.trim() &&
            ((currentFolder && f.parent === currentFolder) || (!currentFolder && !f.parent))
        )
      ) {
        toast({ title: "Folder already exists in this directory." });
        return prev;
      }
      return {
        ...prev,
        [active]: [
          ...sourceFiles,
          {
            name: folderName.trim(),
            type: "folder",
            encrypted: "",
            parent: currentFolder,
          },
        ],
      };
    });
    setFolderName("");
    setAddFolderOpen(false);
  }

  function handleDeleteFile(idx: number) {
    setFilesPerSource((prev) => {
      const sourceFiles = prev[active] ?? [];
      return {
        ...prev,
        [active]: sourceFiles.filter((_, i) => i !== idx),
      };
    });
  }

  function handleUpdateFile(idx: number, updated: FileEntry) {
    setFilesPerSource((prev) => {
      const files = prev[active] ?? [];
      const updatedFiles = files.slice();
      updatedFiles[idx] = updated;
      return {
        ...prev,
        [active]: updatedFiles,
      };
    });
  }

  // Show file count for the current tab
  const currentFiles = filesPerSource[active] ?? [];
  const fileCount = currentFiles.length;

  if (sources.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center opacity-60 py-24 animate-fade-in">
        <Image className="mx-auto mb-3 text-cyan-600" size={44} />
        <h2 className="font-semibold text-xl mb-2">No Sources Configured</h2>
        <p>
          Add a source in the <a href="/config" className="underline text-cyan-400 hover:text-cyan-200 duration-150">Configuration Page</a> to begin.
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full relative ${isDragOver ? "z-50" : ""}`}
      style={{ minHeight: 300 }}
    >
      {/* Overlay for drag */}
      {isDragOver && (
        <div className="absolute inset-0 bg-cyan-800/60 flex flex-col justify-center items-center z-50 pointer-events-none animate-fade-in-fast rounded-2xl border-4 border-cyan-300">
          <div className="text-cyan-50 text-2xl font-bold mb-2">
            Drop file to add to vault
          </div>
          <div className="text-cyan-100 font-mono text-base opacity-90">Supported: Images, Text</div>
        </div>
      )}
      <div className={`flex items-center gap-4 mb-6 ${isDragOver ? "opacity-40 pointer-events-none" : ""}`}>
        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={() => setAddFolderOpen(true)}
        >
          <FolderPlus className="w-4 h-4" /> Add Folder
        </Button>
        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={() => {
            setAddFileOpen(true);
            setAddFilePrefill(undefined);
          }}
          disabled={isEncrypting}
        >
          <FilePlus className="w-4 h-4" /> Add File
        </Button>
        <AddFileModal
          open={addFileOpen}
          onOpenChange={open => {
            if (!open) {
              setEncryptionFileName(null);
              setAddFilePrefill(undefined);
            }
            setAddFileOpen(open);
          }}
          onAddFile={handleAddFile}
          // @ts-ignore (extra prop for prefill)
          prefill={addFilePrefill}
        />
      </div>

      {/* Add Folder Modal */}
      <AddFolderModal
        open={addFolderOpen}
        folderName={folderName}
        setFolderName={setFolderName}
        onAddFolder={handleAddFolder}
        onClose={() => {
          setAddFolderOpen(false);
          setFolderName("");
        }}
        canSubmit={!!folderName.trim()}
      />

      {/* Progress bar overlay */}
      <EncryptionProgressBar
        isEncrypting={isEncrypting}
        fileName={encryptionFileName}
        progress={progress}
      />

      <div className="flex gap-2 mb-10 border-b border-cyan-900/50">
        {sources.map((s, idx) => (
          <button
            key={s.name + idx}
            onClick={() => setActive(idx)}
            className={`relative px-5 py-2 text-lg font-semibold rounded-t hover:bg-cyan-900/10 duration-100
            ${active === idx ? "bg-cyan-900/30 text-cyan-200 shadow-inner" : "text-cyan-400"}`}
            style={{ zIndex: active === idx ? 1 : 0 }}
          >
            {s.name}
            {active === idx && (
              <span className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 h-1 w-10 rounded bg-cyan-500" />
            )}
          </button>
        ))}
      </div>
      <div className="flex justify-between items-end mb-3">
        <div>
          <span className="text-cyan-300 text-sm font-semibold">
            {fileCount} file{fileCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      {/* Pass current files, plus delete and update handlers and navigation path */}
      <EncryptedFileGrid
        sourceIndex={active}
        files={currentFiles}
        onDeleteFile={handleDeleteFile}
        onUpdateFile={handleUpdateFile}
        currentPath={currentPath}
        onPathChange={setCurrentPath}
      />
    </div>
  );
};

export default SourceTabs;
