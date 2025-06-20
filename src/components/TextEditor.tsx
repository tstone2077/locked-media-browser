
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, FileText, X } from "lucide-react";
import { useCrypto } from "@/hooks/useCrypto";
import { toast } from "@/hooks/use-toast";
import { useFileVault, FileEntry } from "@/context/FileVaultContext";

const ENCRYPT_PASS = "vault-password";

type TextEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceIndex: number;
  currentFolder?: string;
  existingFile?: FileEntry | null;
  fileIdx?: number;
};

const TextEditor = ({ 
  open, 
  onOpenChange, 
  sourceIndex, 
  currentFolder,
  existingFile,
  fileIdx 
}: TextEditorProps) => {
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { encryptData, decryptData } = useCrypto(ENCRYPT_PASS);
  const { setFilesPerSource } = useFileVault();

  // Load existing file content when editing
  useEffect(() => {
    if (open && existingFile) {
      setFileName(existingFile.name);
      if (existingFile.decrypted) {
        setContent(existingFile.decrypted);
        setHasChanges(false);
      } else if (existingFile.encrypted) {
        // Decrypt existing content
        loadExistingContent();
      }
    } else if (open && !existingFile) {
      // Reset for new file
      setFileName("");
      setContent("");
      setHasChanges(false);
    }
  }, [open, existingFile]);

  const loadExistingContent = async () => {
    if (!existingFile?.encrypted) return;
    
    try {
      const decryptedBuffer = await decryptData(existingFile.encrypted);
      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      setContent(decryptedText);
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to decrypt existing file:", err);
      toast({
        title: "Decryption failed",
        description: "Could not load the existing file content.",
        variant: "destructive",
      });
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleFileNameChange = (value: string) => {
    setFileName(value);
    setHasChanges(true);
  };

  const saveFile = async () => {
    if (!fileName.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a filename and content.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Encrypt the content
      const encrypted = await encryptData(content);

      const fileEntry: FileEntry = {
        name: fileName.trim().endsWith('.txt') ? fileName.trim() : `${fileName.trim()}.txt`,
        type: "text",
        encrypted,
        decrypted: content,
        parent: currentFolder
      };

      if (existingFile && typeof fileIdx === 'number') {
        // Update existing file
        setFilesPerSource((prev) => {
          const sourceFiles = prev[sourceIndex] ?? [];
          const updatedFiles = sourceFiles.slice();
          updatedFiles[fileIdx] = fileEntry;
          return {
            ...prev,
            [sourceIndex]: updatedFiles,
          };
        });
        
        toast({
          title: "File updated",
          description: `"${fileEntry.name}" has been updated and encrypted.`,
          variant: "default",
        });
      } else {
        // Create new file
        setFilesPerSource((prev) => {
          const sourceFiles = prev[sourceIndex] ?? [];
          return {
            ...prev,
            [sourceIndex]: [...sourceFiles, fileEntry],
          };
        });

        toast({
          title: "File saved",
          description: `"${fileEntry.name}" has been created and encrypted.`,
          variant: "default",
        });
      }

      setHasChanges(false);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save file:", err);
      toast({
        title: "Save failed",
        description: "Failed to encrypt and save the file.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
      if (!confirmClose) return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-cyan-800 w-full max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-cyan-200 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {existingFile ? "Edit Text File" : "Create New Text File"}
          </DialogTitle>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 hover:bg-cyan-900/40 rounded-full text-cyan-200"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan-200">
              File Name
            </label>
            <Input
              value={fileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              placeholder="Enter filename (e.g., my-notes.txt)"
              className="bg-cyan-950/30 text-cyan-200 border-cyan-800 focus-visible:ring-cyan-600"
            />
          </div>

          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <label className="text-sm font-medium text-cyan-200">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start typing your text content..."
              className="bg-cyan-950/30 text-cyan-200 border-cyan-800 focus-visible:ring-cyan-600 flex-1 min-h-0 resize-none"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-cyan-800">
            <div className="text-xs text-cyan-400">
              {hasChanges && "You have unsaved changes"}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="border-cyan-700 text-cyan-200 hover:bg-cyan-900/40"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveFile} 
                disabled={!fileName.trim() || !content.trim() || isLoading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : existingFile ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextEditor;
