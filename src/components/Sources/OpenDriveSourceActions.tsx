
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface OpenDriveSourceActionsProps {
  sourceIndex: number;
  onEdit: () => void;
  onDelete: () => void;
}

const OpenDriveSourceActions: React.FC<OpenDriveSourceActionsProps> = ({
  sourceIndex,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-center gap-2 ml-6">
      <Button
        size="sm"
        variant="outline"
        onClick={onEdit}
        title="Edit"
        className="border-green-500 text-green-400"
      >
        <Edit size={14} />
        Edit
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="ml-0"
        onClick={onDelete}
        title="Delete Source"
      >
        <Trash2 size={14} />
        Delete
      </Button>
    </div>
  );
};

export default OpenDriveSourceActions;
