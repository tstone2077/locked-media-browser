
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Save, Tag, FileText } from "lucide-react";
import TagInput from "./TagInput";
import { FileEntry } from "@/context/FileVaultContext";
import { useCrypto } from "@/hooks/useCrypto";
import { toast } from "@/hooks/use-toast";

const ENCRYPT_PASS = "vault-password";

type MetadataPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileEntry | null;
  fileIdx: number;
  onUpdateFile: (idx: number, updatedFile: FileEntry) => void;
};

const MetadataPanel = ({ open, onOpenChange, file, fileIdx, onUpdateFile }: MetadataPanelProps) => {
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { encryptData, decryptData } = useCrypto(ENCRYPT_PASS);

  // Load metadata when file changes
  useEffect(() => {
    if (file) {
      loadMetadata();
    }
  }, [file]);

  const loadMetadata = async () => {
    if (!file) return;

    try {
      if (file.encryptedMetadata) {
        // Decrypt existing metadata
        const decryptedBuffer = await decryptData(file.encryptedMetadata);
        const decryptedText = new TextDecoder().decode(decryptedBuffer);
        const metadata = JSON.parse(decryptedText);
        setTags(metadata.tags || []);
        setNotes(metadata.notes || "");
      } else {
        // Use legacy fields if available
        setTags(file.tags || []);
        setNotes(file.notes || "");
      }
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to load metadata:", err);
      // Fallback to legacy fields
      setTags(file.tags || []);
      setNotes(file.notes || "");
      setHasChanges(false);
    }
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    setHasChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  const saveMetadata = async () => {
    if (!file || fileIdx < 0) return;

    setIsLoading(true);
    try {
      // Prepare metadata object
      const metadata = { tags, notes };
      const metadataText = JSON.stringify(metadata);
      
      // Encrypt metadata
      const encryptedMetadata = await encryptData(metadataText);

      // Update file with encrypted metadata
      const updatedFile = {
        ...file,
        encryptedMetadata,
        // Keep legacy fields for backward compatibility
        tags,
        notes
      };

      onUpdateFile(fileIdx, updatedFile);
      setHasChanges(false);

      toast({
        title: "Metadata saved",
        description: "Tags and notes have been encrypted and saved.",
        variant: "default",
      });
    } catch (err) {
      console.error("Failed to save metadata:", err);
      toast({
        title: "Save failed",
        description: "Failed to encrypt and save metadata.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-cyan-800 w-96">
        <SheetHeader>
          <SheetTitle className="text-cyan-200 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            File Metadata
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="text-sm text-cyan-300 bg-cyan-950/30 p-3 rounded">
            <strong>{file.name}</strong>
            <div className="text-xs text-cyan-400 mt-1">
              Type: {file.type} • Encrypted: {file.encrypted ? 'Yes' : 'No'}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <TagInput 
              tags={tags} 
              onTagsChange={handleTagsChange}
              placeholder="Add tags..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes about this file..."
              className="bg-cyan-950/30 text-cyan-200 border-cyan-800 focus-visible:ring-cyan-600 min-h-32"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={saveMetadata} 
              disabled={!hasChanges || isLoading}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Metadata"}
            </Button>
          </div>

          {hasChanges && (
            <div className="text-xs text-yellow-400 bg-yellow-950/30 p-2 rounded">
              You have unsaved changes
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MetadataPanel;
