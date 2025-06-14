
import { X, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  file: {
    name: string;
    type: "image" | "text";
    decrypted?: string;
    liked?: boolean;
  };
  onPrev: () => void;
  onNext: () => void;
};

const MediaViewer = ({ open, setOpen, file, onPrev, onNext }: Props) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md animate-fade-in">
      <div className="relative bg-[#1d2639] rounded-xl max-w-2xl min-w-[340px] shadow-2xl p-7 flex flex-col items-center">
        <button
          className="absolute right-3 top-3 p-2 rounded-full hover:bg-cyan-900/40 text-cyan-200"
          onClick={() => setOpen(false)}
        >
          <X size={22} />
        </button>
        <div className="flex items-center mb-4 gap-3">
          <button onClick={onPrev} className="p-2 hover:bg-cyan-900/40 rounded-xl">
            <ArrowLeft size={28} />
          </button>
          <div className="text-xl font-semibold text-cyan-200">{file.name}</div>
          <button onClick={onNext} className="p-2 hover:bg-cyan-900/40 rounded-xl">
            <ArrowRight size={28} />
          </button>
        </div>
        <div className="w-full flex items-center justify-center min-h-[230px]">
          {file.type === "image" && file.decrypted ? (
            <img
              src={"/placeholder.svg"}
              alt={file.name}
              className="rounded-xl max-h-80 max-w-[420px] shadow-md border border-cyan-900/50 animate-fade-in"
            />
          ) : (
            <div className="border border-cyan-600 rounded-md p-4 bg-cyan-900/20 w-full text-left text-cyan-100 max-h-80 overflow-auto animate-fade-in whitespace-pre-line">
              {file.decrypted || ""}
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center gap-6 w-full justify-center">
          <button className={cn(
            "px-3 py-1 rounded bg-pink-600/90 text-white font-bold shadow hover:scale-105 transition",
            file.liked && "ring-2 ring-pink-400"
          )}>
            {file.liked ? "♥ Liked" : "Like"}
          </button>
          <button
            className="px-3 py-1 rounded bg-cyan-900/40 text-cyan-300 shadow hover:bg-cyan-600/50 transition"
            title="Lock & Delete Decrypted Data"
          >
            <Lock className="inline -mt-1 mr-1" size={18} /> Lock
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
