
import React from "react";
import { IEncryptionMethod, GPGConfig, EncryptionConfigProps, EncryptionActionsProps } from "./types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Lock } from "lucide-react";

// UI Components
const GPGConfigComponent: React.FC<EncryptionConfigProps> = ({
  form,
  setForm,
  editIdx,
  handleAddOrSave,
  handleCancel,
}) => (
  <div className="p-2 sm:p-4 rounded-xl border border-cyan-700/50 bg-[#191f29] mb-2 animate-scale-in max-w-full sm:max-w-none w-full overflow-y-auto">
    <div className="mb-3 font-semibold text-lg text-cyan-400 flex items-center">
      <Lock className="mr-2" /> {editIdx !== null ? "Edit GPG Method" : "New GPG Method"}
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
      <label className="text-sm">Private Key</label>
      <textarea
        className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600 h-20 text-sm"
        value={(form as GPGConfig).privateKey ?? ""}
        onChange={e =>
          setForm(f => ({ ...f, privateKey: e.target.value }))
        }
      />
    </div>
    <div className="mb-2">
      <label className="text-sm">Password</label>
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

const GPGActionsComponent: React.FC<EncryptionActionsProps> = ({
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

export class GPGMethod implements IEncryptionMethod {
  readonly type = "gpg" as const;
  readonly name: string;
  readonly config: GPGConfig;

  constructor(config: GPGConfig) {
    this.name = config.name;
    this.config = config;
  }

  ConfigComponent = GPGConfigComponent;
  ActionsComponent = GPGActionsComponent;

  async encrypt(data: string | ArrayBuffer): Promise<string> {
    // GPG encryption implementation would go here
    throw new Error("GPG encryption not implemented yet");
  }

  async decrypt(data: string): Promise<ArrayBuffer> {
    // GPG decryption implementation would go here
    throw new Error("GPG decryption not implemented yet");
  }

  async validateConfig(config: Record<string, any>): Promise<string | null> {
    if (!config.name || !config.password || !config.privateKey) {
      return "All fields are required for GPG method";
    }
    return null;
  }

  static defaultConfig(): GPGConfig {
    return {
      name: "",
      type: "gpg",
      privateKey: "",
      password: "",
    };
  }
}
