
import React from "react";

export interface IEncryptionMethod {
  readonly type: string;
  readonly name: string;
  readonly config: EncryptionMethodConfig;
  
  // UI Components
  ConfigComponent: React.FC<EncryptionConfigProps>;
  ActionsComponent: React.FC<EncryptionActionsProps>;
  
  // Method operations
  encrypt(data: string | ArrayBuffer): Promise<string>;
  decrypt(data: string): Promise<ArrayBuffer>;
  validateConfig(config: Record<string, any>): Promise<string | null>;
}

export type EncryptionMethodConfig = GPGConfig | AES256Config;

export type GPGConfig = {
  name: string;
  type: "gpg";
  privateKey: string;
  password: string;
};

export type AES256Config = {
  name: string;
  type: "aes-256";
  password: string;
};

export interface EncryptionConfigProps {
  form: EncryptionMethodConfig;
  setForm: (form: EncryptionMethodConfig | ((prev: EncryptionMethodConfig) => EncryptionMethodConfig)) => void;
  editIdx: number | null;
  handleAddOrSave: () => void;
  handleCancel: () => void;
}

export interface EncryptionActionsProps {
  methodIndex: number;
  onEdit: () => void;
  onDelete: () => void;
}
