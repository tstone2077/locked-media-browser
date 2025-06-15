
import React from "react";
import { Progress } from "@/components/ui/progress";

type EncryptionProgressBarProps = {
  isEncrypting: boolean;
  fileName: string | null;
  progress: number;
};

const EncryptionProgressBar: React.FC<EncryptionProgressBarProps> = ({
  isEncrypting,
  fileName,
  progress
}) => {
  if (!isEncrypting) return null;
  return (
    <div className="w-full my-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-cyan-300">
          Encrypting {fileName ? <b>{fileName}</b> : ""}...
        </span>
        <span className="text-xs">{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
};

export default EncryptionProgressBar;
