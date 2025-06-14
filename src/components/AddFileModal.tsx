
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type AddFileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFile: (dataUrl: string) => void;
};

const AddFileModal = ({ open, onOpenChange, onAddFile }: AddFileModalProps) => {
  const [dataUrl, setDataUrl] = useState("");

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
