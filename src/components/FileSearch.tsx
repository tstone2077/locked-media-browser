
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type FileSearchProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
};

const FileSearch = ({ searchTerm, onSearchChange }: FileSearchProps) => {
  return (
    <div className="flex items-center gap-2">
      <Search className="w-4 h-4 text-cyan-500" />
      <Input
        type="search"
        placeholder="Search files..."
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        className="bg-cyan-950/30 text-cyan-200 border-cyan-800 focus-visible:ring-cyan-600"
      />
    </div>
  );
};

export default FileSearch;
