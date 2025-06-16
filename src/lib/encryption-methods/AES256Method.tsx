
import React from "react";
import { IEncryptionMethod, AES256Config, EncryptionConfigProps, EncryptionActionsProps } from "./types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Lock } from "lucide-react";

// UI Components
const AES256ConfigComponent: React.FC<EncryptionConfigProps> = ({
  form,
  setForm,
  editIdx,
  handleAddOrSave,
  handleCancel,
}) => (
  <div className="p-2 sm:p-4 rounded-xl border border-cyan-700/50 bg-[#191f29] mb-2 animate-scale-in max-w-full sm:max-w-none w-full overflow-y-auto">
    <div className="mb-3 font-semibold text-lg text-cyan-400 flex items-center">
      <Lock className="mr-2" /> {editIdx !== null ? "Edit AES-256 Method" : "New AES-256 Method"}
    </div>
    <div className="mb-2">
      <label className="text-sm">Name</label>
      <input
        className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600 focus:outline-none text-base"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        autoFocus
      />
    </div>
    <div className="mb-2">
      <label className="text-sm">AES-256 Password</label>
      <input
        type="password"
        className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600 text-base"
        value={form.password}
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
      />
    </div>
    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
      <Button variant="ghost" onClick={handleCancel} className="w-full sm:w-auto">Cancel</Button>
      <Button variant="default" onClick={handleAddOrSave} className="bg-cyan-700 hover:bg-cyan-500 w-full sm:w-auto">
        {editIdx !== null ? "Save" : "Add"}
      </Button>
    </div>
  </div>
);

const AES256ActionsComponent: React.FC<EncryptionActionsProps> = ({
  methodIndex,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
      <Button
        size="sm"
        variant="outline"
        onClick={onEdit}
        title="Edit"
        className="border-cyan-500 text-cyan-400 flex-1 sm:flex-initial w-full sm:w-auto"
      >
        <Edit size={14} />
        <span className="ml-1">Edit</span>
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
        title="Delete"
        className="ml-0 sm:ml-2 flex-1 sm:flex-initial w-full sm:w-auto"
      >
        <Trash2 size={14} />
        <span className="ml-1">Delete</span>
      </Button>
    </div>
  );
};

export class AES256Method implements IEncryptionMethod {
  readonly type = "aes-256" as const;
  readonly name: string;  
  readonly config: AES256Config;

  constructor(config: AES256Config) {
    this.name = config.name;
    this.config = config;
  }

  ConfigComponent = AES256ConfigComponent;
  ActionsComponent = AES256ActionsComponent;

  async encrypt(data: string | ArrayBuffer): Promise<string> {
    // AES-256 encryption implementation would go here
    throw new Error("AES-256 encryption not implemented yet");
  }

  async decrypt(data: string): Promise<ArrayBuffer> {
    // AES-256 decryption implementation would go here
    throw new Error("AES-256 decryption not implemented yet");
  }

  async validateConfig(config: Record<string, any>): Promise<string | null> {
    if (!config.name || !config.password) {
      return "All fields are required for AES-256 method";
    }
    return null;
  }

  static defaultConfig(): AES256Config {
    return {
      name: "",
      type: "aes-256",
      password: "",
    };
  }
}
