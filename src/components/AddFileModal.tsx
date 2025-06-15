
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

type AddFileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFile: (dataUrl: string) => void;
  prefill?: string; // NEW prop for default value (optional)
};

function isImageDataUrl(url: string) {
  return url.startsWith("data:image/");
}

const AddFileModal = ({ open, onOpenChange, onAddFile, prefill }: AddFileModalProps) => {
  const [dataUrl, setDataUrl] = useState("");

  // Populate field with prefill, if provided (e.g. when drag & drop)
  useEffect(() => {
    if (prefill) setDataUrl(prefill);
    else if (open === true) setDataUrl(""); // reset only on open
  }, [prefill, open]);

  function handleAdd() {
    if (!dataUrl.trim()) return;
    onAddFile(dataUrl.trim());
    setDataUrl("");
    onOpenChange(false);
  }

  function handleClose() {
    setDataUrl("");
    onOpenChange(false);
  }

  const showPreview = !!dataUrl && isImageDataUrl(dataUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add File by Data URL</DialogTitle>
          <DialogDescription>
            Paste a valid <span className="font-mono">data:</span> URL to add a new file. (e.g. <code>data:image/png;base64,...</code>)
          </DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          placeholder="data:image/png;base64,..."
          value={dataUrl}
          onChange={e => setDataUrl(e.target.value)}
          autoFocus
        />
        {showPreview && (
          <div className="flex justify-center mt-4">
            <img
              src={dataUrl}
              alt="Preview"
              className="max-h-40 max-w-full rounded border border-cyan-800 shadow"
              style={{ background: "#131b29" }}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!dataUrl.trim()}>
            Add File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFileModal;
