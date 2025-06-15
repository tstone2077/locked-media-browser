
import React from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type AddFolderModalProps = {
  open: boolean;
  folderName: string;
  setFolderName: (name: string) => void;
  onAddFolder: () => void;
  onClose: () => void;
  canSubmit: boolean;
};

const AddFolderModal: React.FC<AddFolderModalProps> = ({
  open,
  folderName,
  setFolderName,
  onAddFolder,
  onClose,
  canSubmit
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#10151e] p-6 rounded-lg shadow-lg w-80 flex flex-col animate-scale-in">
        <h2 className="text-lg font-semibold mb-3 text-cyan-300 flex items-center gap-2">
          <FolderPlus className="w-5 h-5" /> Add Folder
        </h2>
        <input
          type="text"
          placeholder="Folder name"
          className="mb-4 px-3 py-2 rounded bg-[#191f29] border border-cyan-700 text-white"
          value={folderName}
          onChange={e => setFolderName(e.target.value)}
          autoFocus
          maxLength={60}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-cyan-700 hover:bg-cyan-500"
            onClick={onAddFolder}
            disabled={!canSubmit}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddFolderModal;
