import { useSources } from "@/lib/sources";
import EncryptedFileGrid from "./EncryptedFileGrid";
import { useState } from "react";
import { Image, FolderPlus, FilePlus } from "lucide-react";
import AddFileModal from "./AddFileModal";
import AddFolderModal from "./AddFolderModal";
import EncryptionProgressBar from "./EncryptionProgressBar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAsyncEncryption } from "@/hooks/useAsyncEncryption";
import { useFileVault, FileEntry } from "@/context/FileVaultContext";
import { toast } from "@/hooks/use-toast";

const initialFilesPerSource: Record<number, FileEntry[]> = {};

const SourceTabs = () => {
  const { sources } = useSources();
  const [active, setActive] = useState(0);

  // Use context for file state
  const { filesPerSource, setFilesPerSource } = useFileVault();

  // Modal state for "Add File"
  const [addFileOpen, setAddFileOpen] = useState(false);

  // New state for folder modal
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  // New: track navigation path (folder chain) for each tab
  const [currentPathPerSource, setCurrentPathPerSource] = useState<Record<number, string[]>>({});
  // current folder path for this tab
  const currentPath = currentPathPerSource[active] ?? [];
  const setCurrentPath = (path: string[]) => {
    setCurrentPathPerSource(paths => ({
      ...paths,
      [active]: path
    }));
  };
  const currentFolder = currentPath.length ? currentPath[currentPath.length - 1] : undefined;

  // encryption
  const { encrypt, isEncrypting, progress, reset } = useAsyncEncryption();
  const [encryptionFileName, setEncryptionFileName] = useState<string | null>(null);

  async function handleAddFile(dataUrl: string) {
    // Basic image/text type distinction
    const isImage = dataUrl.startsWith("data:image/");
    const name = isImage ? `Image-${Date.now()}.png` : `Text-${Date.now()}.txt`;
    setEncryptionFileName(name);

    try {
      // Actually encrypt in background, update progress
      const encrypted = await encrypt(dataUrl, {});
      setFilesPerSource(prev => {
        const sourceFiles = prev[active] ?? [];
        // Add to current folder (not root) if navigated
        return {
          ...prev,
          [active]: [
            ...sourceFiles,
            { name, type: isImage ? "image" : "text", encrypted, parent: currentFolder }
          ]
        };
      });
      setEncryptionFileName(null);
      reset();
      toast({ title: `${name} encrypted and added successfully.` });
      console.log(`[SourceTabs] File added: ${name}`, { encrypted });
    } catch (err) {
      setEncryptionFileName(null);
      reset();
      toast({ title: `Failed to add ${name}`, description: String(err), variant: "destructive" });
      console.error("[SourceTabs] Encryption failed:", err);
    }
  }

  function handleAddFolder() {
    if (!folderName.trim()) return;
    setFilesPerSource(prev => {
      const sourceFiles = prev[active] ?? [];
      // Prevent duplicate folder name in same parent
      if (
        sourceFiles.some(
          f =>
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
          }
        ]
      };
    });
    setFolderName("");
    setAddFolderOpen(false);
  }

  function handleDeleteFile(idx: number) {
    setFilesPerSource(prev => {
      const sourceFiles = prev[active] ?? [];
      return {
        ...prev,
        [active]: sourceFiles.filter((_, i) => i !== idx),
      };
    });
  }

  function handleUpdateFile(idx: number, updated: FileEntry) {
    setFilesPerSource(prev => {
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
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
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
          onClick={() => setAddFileOpen(true)}
          disabled={isEncrypting}
        >
          <FilePlus className="w-4 h-4" /> Add File
        </Button>
        <AddFileModal
          open={addFileOpen}
          onOpenChange={open => {
            if (!open) setEncryptionFileName(null);
            setAddFileOpen(open);
          }}
          onAddFile={handleAddFile}
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
