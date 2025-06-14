
import { useSources } from "@/lib/sources";
import EncryptedFileGrid from "./EncryptedFileGrid";
import { useState } from "react";
import { Image, FolderPlus, FilePlus } from "lucide-react";
import AddFileModal from "./AddFileModal";
import { Button } from "@/components/ui/button";

type FileEntry = {
  name: string;
  type: "image" | "text";
  encrypted: string;
  decrypted?: string;
  liked?: boolean;
};

const initialFilesPerSource: Record<number, FileEntry[]> = {};

const SourceTabs = () => {
  const { sources } = useSources();
  const [active, setActive] = useState(0);

  // Each source has its own file list
  const [filesPerSource, setFilesPerSource] = useState<Record<number, FileEntry[]>>(initialFilesPerSource);

  // Modal state for "Add File"
  const [addFileOpen, setAddFileOpen] = useState(false);

  function handleAddFile(dataUrl: string) {
    // Add a new file to the current source's list
    setFilesPerSource((prev) => {
      const sourceFiles = prev[active] ?? [];
      // Basic image/text type distinction
      const isImage = dataUrl.startsWith("data:image/");
      const name = isImage
        ? `Image-${Date.now()}.png`
        : `Text-${Date.now()}.txt`;
      return {
        ...prev,
        [active]: [
          ...sourceFiles,
          {
            name,
            type: isImage ? "image" : "text",
            encrypted: btoa(dataUrl), // still "encrypted"
          },
        ],
      };
    });
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
          onClick={() => alert('Folder creation not implemented yet!')}
        >
          <FolderPlus className="w-4 h-4" /> Add Folder
        </Button>
        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={() => setAddFileOpen(true)}
        >
          <FilePlus className="w-4 h-4" /> Add File
        </Button>
        <AddFileModal
          open={addFileOpen}
          onOpenChange={setAddFileOpen}
          onAddFile={handleAddFile}
        />
      </div>
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
      {/* Pass current files, plus delete and update handlers */}
      <EncryptedFileGrid
        sourceIndex={active}
        files={currentFiles}
        onDeleteFile={handleDeleteFile}
        onUpdateFile={handleUpdateFile}
      />
    </div>
  );
};

export default SourceTabs;
