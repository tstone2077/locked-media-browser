
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TagInput from "./TagInput";
import { FileEntry } from "@/context/FileVaultContext";

type TagEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileEntry | null;
  onSave: (tags: string[]) => void;
};

const TagEditModal = ({ open, onOpenChange, file, onSave }: TagEditModalProps) => {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (file) {
      setTags(file.tags || []);
    }
  }, [file]);

  const handleSave = () => {
    onSave(tags);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-cyan-800">
        <DialogHeader>
          <DialogTitle className="text-cyan-200">
            Edit Tags - {file?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <TagInput 
            tags={tags} 
            onTagsChange={setTags} 
            placeholder="Add tags..."
          />
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-cyan-400 hover:text-cyan-200"
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Tags
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagEditModal;
