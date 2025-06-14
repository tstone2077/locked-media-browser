
import { useSources } from "@/lib/sources";
import { useEncryptionMethods } from "@/lib/encryption";
import { useState } from "react";
import { Lock, Image as ImageIcon } from "lucide-react";
import MediaViewer from "./MediaViewer";
import { toast } from "@/hooks/use-toast";

type FileEntry = {
  name: string;
  type: "image" | "text";
  encrypted: string; // Simulate encrypted data, in real case would be bytes
  decrypted?: string; // Data URL or text, for now
  liked?: boolean;
};

const mockFiles: FileEntry[] = [
  {
    name: "VacationPhoto.jpg",
    type: "image",
    encrypted: btoa("data:image/jpeg;base64," + "photo-1488590528505-98d2b5aba04b"), // Use placeholder key as data
  },
  {
    name: "Note.txt",
    type: "text",
    encrypted: btoa("Hello, world! This is a secret note."),
  },
];

const EncryptedFileGrid = ({ sourceIndex }: { sourceIndex: number }) => {
  const { sources } = useSources();
  const { methods } = useEncryptionMethods();
  const [files, setFiles] = useState<FileEntry[]>(mockFiles); // Simulate for now
  const [decrypted, setDecrypted] = useState<Record<number, string>>({});
  const [openViewer, setOpenViewer] = useState<null | number>(null);

  const source = sources[sourceIndex];
  if (!source) return null;
  const encryption = methods.find(m => m.name === source.encryption);

  function handleDecrypt(idx: number) {
    const file = files[idx];
    if (!encryption) {
      toast({ title: "Encryption method not found." });
      return;
    }
    // Simulate decryption
    const decryptedData = atob(file.encrypted);
    setFiles(fs => {
      const updated = [...fs];
      updated[idx] = { ...updated[idx], decrypted: decryptedData };
      return updated;
    });
    toast({ title: "Decryption successful" });
  }

  function handleLock(idx: number) {
    setFiles(fs => {
      const updated = [...fs];
      delete updated[idx].decrypted;
      return updated;
    });
    toast({ title: "Decrypted data removed" });
  }

  function handleLike(idx: number) {
    setFiles(fs => {
      const updated = [...fs];
      updated[idx].liked = !updated[idx].liked;
      return updated;
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 animate-fade-in">
      {files.map((file, idx) => (
        <div
          key={file.name + idx}
          className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#161e2f] shadow-lg border border-cyan-900/40 relative group"
        >
          {/* Lock or Thumbnail */}
          {!file.decrypted ? (
            <button
              className="h-28 w-28 rounded bg-gradient-to-tr from-cyan-800/60 to-cyan-900/60 flex items-center justify-center border-2 border-cyan-700 hover:scale-105 transition-hover ring-2 ring-cyan-700/40 mb-3"
              onClick={() => handleDecrypt(idx)}
              title="Unlock & Decrypt"
            >
              <Lock className="w-10 h-10 text-cyan-400 animate-pulse" />
            </button>
          ) : (
            <button
              className="group relative w-28 h-28 overflow-hidden rounded bg-gray-700 mb-3"
              onClick={() => setOpenViewer(idx)}
              title={file.name}
            >
              {file.type === "image" ? (
                <img
                  src={"/placeholder.svg"}
                  alt={file.name}
                  className="w-full h-full object-cover animate-fade-in"
                  style={{
                    background: "rgba(20,30,40,0.4)",
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl text-cyan-300 bg-[#182232]">
                  <ImageIcon />
                </div>
              )}
              <span className="absolute right-2 bottom-2 bg-cyan-900/60 px-2 py-0.5 rounded text-xs">{file.type}</span>
            </button>
          )}

          {/* Filename */}
          <div className="text-lg font-semibold mt-1 text-cyan-200">{file.name}</div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            {file.decrypted ? (
              <button
                onClick={() => handleLock(idx)}
                className="px-3 py-1 rounded bg-cyan-900/40 hover:bg-cyan-700/70 text-cyan-300 text-xs hover:scale-105 shadow transition"
                title="Lock & Delete Decrypted Data"
              >
                Lock
              </button>
            ) : (
              <span className="text-xs text-gray-500 opacity-70">Locked</span>
            )}
            <button
              onClick={() => handleLike(idx)}
              className={`px-3 py-1 rounded ${file.liked ? "bg-pink-600/80 text-white" : "bg-pink-900/40 text-pink-200"} text-xs hover:scale-110 shadow transition`}
              title={file.liked ? "Unlike" : "Like"}
            >
              ♥
            </button>
          </div>
          {/* Open viewer modal */}
          {openViewer === idx && file.decrypted && (
            <MediaViewer
              open={Boolean(openViewer !== null)}
              setOpen={open => setOpenViewer(open ? idx : null)}
              file={file}
              onPrev={() => setOpenViewer(idx > 0 ? idx - 1 : files.length - 1)}
              onNext={() => setOpenViewer(idx < files.length - 1 ? idx + 1 : 0)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default EncryptedFileGrid;
