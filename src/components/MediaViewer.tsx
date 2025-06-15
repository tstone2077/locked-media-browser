import { X, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useRef, useState } from "react";
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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const MAX_ZOOM = 6;
const MIN_ZOOM = 1;
const ZOOM_STEP = 0.2;

const MediaViewer = ({ open, setOpen, file, onPrev, onNext }: Props) => {
  // Zoom/pan state, only used for images
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // Reset zoom/pan when image changes or viewer opens/closes
  const lastFile = useRef(file?.decrypted);
  if (!open) return null;
  if (lastFile.current !== file?.decrypted) {
    lastFile.current = file?.decrypted;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  // Wheel to zoom
  function handleWheelImage(e: React.WheelEvent<HTMLDivElement>) {
    // Do not zoom text
    if (file.type !== "image" || !file.decrypted) return;
    e.preventDefault();

    let nextZoom = zoom - Math.sign(e.deltaY) * ZOOM_STEP;
    nextZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

    // Keep the center under mouse if possible
    if (nextZoom !== zoom) {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2 - offset.x;
      const my = e.clientY - rect.top - rect.height / 2 - offset.y;
      const scale = nextZoom / zoom;
      setOffset({
        x: offset.x - mx * (scale - 1),
        y: offset.y - my * (scale - 1),
      });
      setZoom(nextZoom);
    }
  }

  // Mouse drag for panning (when over-zoomed)
  function handleMouseDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (file.type !== "image" || zoom === 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragging) return;
    setOffset({
      x: offsetStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetStart.current.y + (e.clientY - dragStart.current.y),
    });
  }

  function handleMouseUp() {
    setDragging(false);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  // Double click to reset
  function handleDoubleClick() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  // Prevent scroll on overlay (otherwise background scrolls)
  function preventScroll(e: React.WheelEvent) {
    e.preventDefault();
  }

  // -- NEW: check if we're showing a locked image (i.e., fallback/placeholder image) --
  const isImageLocked =
    file.type === "image" && (!file.decrypted || file.decrypted === "/placeholder.svg");

  return (
    // Full screen overlay, no padding
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-lg animate-fade-in"
      onWheel={preventScroll}
      tabIndex={-1}
    >
      {/* Main box - fills screen, centered content */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <button
          className="absolute right-8 top-8 p-3 z-20 rounded-full hover:bg-cyan-900/40 text-cyan-100 bg-black/40"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <X size={28} />
        </button>
        <div className="absolute left-1/2 top-8 -translate-x-1/2 flex items-center mb-4 gap-3 z-10">
          <button onClick={onPrev} className="p-2 hover:bg-cyan-900/40 rounded-xl">
            <ArrowLeft size={30} />
          </button>
          <div className="text-2xl font-semibold text-cyan-200 px-6">{file.name}</div>
          <button onClick={onNext} className="p-2 hover:bg-cyan-900/40 rounded-xl">
            <ArrowRight size={30} />
          </button>
        </div>
        {/* Main media area */}
        <div
          className="flex flex-1 items-center justify-center w-full h-full"
          style={{ minHeight: 0, minWidth: 0 }}
        >
          {file.type === "image" ? (
            file.decrypted ? (
              <div
                className="relative flex items-center justify-center w-full h-full select-none"
                onWheel={handleWheelImage}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                style={{
                  cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
                  userSelect: "none"
                }}
              >
                <img
                  src={file.decrypted}
                  alt={file.name}
                  draggable={false}
                  className={
                    "shadow-lg border border-cyan-900/60 bg-black rounded-lg animate-fade-in" +
                    (isImageLocked ? " opacity-60 blur" : "")
                  }
                  style={{
                    display: "block",
                    maxWidth: "94vw",
                    maxHeight: "80vh",
                    width: "auto",
                    height: "auto",
                    // Zoom and pan
                    transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})`,
                    transition: dragging ? "none" : "transform 0.18s cubic-bezier(.66,-0.41,.46,1.36)",
                    boxShadow: "0 8px 42px 4px #090c2c66"
                  }}
                />
                {/* Helper overlay for zoom state */}
                <div className="absolute left-4 bottom-3 bg-black/50 text-cyan-100 rounded px-3 py-1 text-xs select-none pointer-events-none">
                  {isImageLocked
                    ? "Encrypted preview (unlock to view in full quality)"
                    : `Zoom: ${zoom.toFixed(2)}x | ${zoom > 1 ? "Drag to pan, double-click to reset" : "Scroll to zoom"}`}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full">
                <img
                  src="/placeholder.svg"
                  alt="Locked/Encrypted"
                  className="w-32 h-32 opacity-70 mb-4"
                  draggable={false}
                />
                <div className="text-cyan-200 text-xl font-semibold">This image is encrypted</div>
                <div className="mt-2 text-cyan-300 text-sm">Unlock with your password to view.</div>
              </div>
            )
          ) : (
            <div className="border border-cyan-600 rounded-md p-4 bg-cyan-900/20 w-full max-w-3xl text-left text-cyan-100 max-h-[65vh] overflow-auto animate-fade-in whitespace-pre-line">
              {file.decrypted || ""}
            </div>
          )}
        </div>
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-6 w-auto justify-center z-20">
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
