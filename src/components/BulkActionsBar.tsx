
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileEntry } from "@/context/FileVaultContext";

type BulkActionsBarProps = {
  files: FileEntry[];
  selected: number[];
  setSelected: (sel: number[]) => void;
  allFolders: string[];
  onBulkDecrypt: (indexes: number[]) => Promise<void>;
  onBulkDelete: (indexes: number[]) => void;
  onMove: (target: string) => void;
};

const BulkActionsBar = ({
  files,
  selected,
  setSelected,
  allFolders,
  onBulkDecrypt,
  onBulkDelete,
  onMove
}: BulkActionsBarProps) => {
  const isAllSelected = selected.length > 0 && selected.length === files.length;

  function handleSelectAllToggle() {
    if (isAllSelected) setSelected([]);
    else setSelected(files.map((_, i) => i));
  }

  return (
    <div className="mb-2 flex gap-2 items-center">
      <input
        type="checkbox"
        checked={isAllSelected}
        onChange={handleSelectAllToggle}
        className="accent-cyan-400 w-4 h-4 rounded border-cyan-700 focus:ring-cyan-500 cursor-pointer"
        aria-label="Select all files"
      />
      <span className="text-sm text-cyan-200 select-none mr-3">Select All</span>
      {selected.length > 0 && (
        <>
          <Button
            variant="default"
            onClick={() => {
              onBulkDecrypt(selected);
              toast({ title: `Decryption done for ${selected.length} file(s)` });
            }}
            className="flex items-center gap-2"
          >
            Decrypt Selected
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onBulkDelete(selected);
              toast({ title: "Deleted selected items" });
            }}
            className="flex items-center gap-2"
          >
            Delete Selected
          </Button>
          {allFolders.length > 0 && (
            <div className="relative">
              <select
                className="bg-cyan-950 border border-cyan-700 rounded px-2 py-1 text-cyan-200"
                defaultValue=""
                onChange={e => { if (e.target.value) onMove(e.target.value); }}
              >
                <option value="" disabled>Move selected to...</option>
                {allFolders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BulkActionsBar;
