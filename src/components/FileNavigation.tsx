
import React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileNavigationProps = {
  currentPath: string[];
  onPathChange: (path: string[]) => void;
};

const FileNavigation = ({ currentPath, onPathChange }: FileNavigationProps) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      {currentPath.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onPathChange(currentPath.slice(0, -1))}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}
      <div className="text-sm text-cyan-400 font-mono">
        {currentPath.length === 0 ? "Root" : currentPath.join(" / ")}
      </div>
    </div>
  );
};

export default FileNavigation;
