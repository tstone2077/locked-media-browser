
import React from "react";

export type SourceType = "local" | "opendrive";

export interface FileInfo {
  name: string;
  type: "file" | "folder";
  path: string;
  size?: number;
  lastModified?: Date;
}

export interface SourceConfigProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  editIdx: number | null;
  handleAddOrSave: () => void;
  handleCancel: () => void;
  encryptionMethods: { name: string }[];
}

export interface SourceActionsProps {
  sourceIndex: number;
  onEdit: () => void;
  onDelete: () => void;
}

export interface ISource {
  // Configuration
  readonly type: SourceType;
  readonly name: string;
  readonly config: Record<string, any>;
  
  // UI Components
  ConfigComponent: React.FC<SourceConfigProps>;
  ActionsComponent: React.FC<SourceActionsProps>;
  
  // Core operations
  listdir(path: string): Promise<FileInfo[]>;
  read(path: string): Promise<string | ArrayBuffer>;
  write(path: string, content: string | ArrayBuffer): Promise<void>;
  mkdir(path: string): Promise<void>;
  
  // Validation
  validateConfig(config: Record<string, any>): Promise<string | null>;
}

export interface SourceConfig {
  name: string;
  type: SourceType;
  encryption: string;
  [key: string]: any; // Allow additional config properties
}
