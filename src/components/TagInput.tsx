
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Tag } from "lucide-react";

type TagInputProps = {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
};

const TagInput = ({ tags, onTagsChange, placeholder = "Add tags..." }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onTagsChange([...tags, trimmedValue]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-cyan-950/30 text-cyan-200 border-cyan-800 focus-visible:ring-cyan-600"
        />
        <Button 
          type="button" 
          onClick={addTag} 
          size="sm"
          variant="secondary"
          disabled={!inputValue.trim()}
        >
          <Tag className="w-4 h-4" />
        </Button>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="bg-cyan-900/50 text-cyan-200 hover:bg-cyan-900/70"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
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

export default TagInput;
