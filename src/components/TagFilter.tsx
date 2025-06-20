
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter } from "lucide-react";
import { FileEntry } from "@/context/FileVaultContext";

type TagFilterProps = {
  files: FileEntry[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  filterMode: "and" | "or";
  onFilterModeChange: (mode: "and" | "or") => void;
};

const TagFilter = ({ 
  files, 
  selectedTags, 
  onTagsChange, 
  filterMode, 
  onFilterModeChange 
}: TagFilterProps) => {
  // Get all unique tags from all files
  const allTags = Array.from(new Set(
    files.flatMap(file => file.tags || [])
  )).sort();

  const addSelectedTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const removeSelectedTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-cyan-500" />
        <Select value={filterMode} onValueChange={onFilterModeChange}>
          <SelectTrigger className="w-20 bg-cyan-950/30 text-cyan-200 border-cyan-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
        
        <Select onValueChange={addSelectedTag}>
          <SelectTrigger className="w-40 bg-cyan-950/30 text-cyan-200 border-cyan-800">
            <SelectValue placeholder="Add tag filter..." />
          </SelectTrigger>
          <SelectContent>
            {allTags
              .filter(tag => !selectedTags.includes(tag))
              .map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))
            }
          </SelectContent>
        </Select>

        {selectedTags.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllTags}
            className="text-cyan-400 hover:text-cyan-200"
          >
            Clear
          </Button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map(tag => (
            <Badge 
              key={tag} 
              variant="outline" 
              className="border-cyan-600 text-cyan-300"
            >
              {tag}
              <button
                onClick={() => removeSelectedTag(tag)}
                className="ml-1 hover:text-cyan-100"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagFilter;
