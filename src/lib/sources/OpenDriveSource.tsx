
import React from "react";
import { ISource, FileInfo, SourceConfigProps, SourceConfig, SourceActionsProps } from "./types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, HardDrive } from "lucide-react";

// UI Components
const SourceConfigOpenDrive: React.FC<SourceConfigProps> = ({
  form,
  setForm,
  editIdx,
  handleAddOrSave,
  handleCancel,
  encryptionMethods,
}) => (
  <div className="p-4 rounded-xl border border-green-700/50 bg-[#191f29] mb-2 animate-scale-in">
    <div className="mb-3 font-semibold text-lg text-green-400 flex items-center">
      <HardDrive className="mr-2" />
      {editIdx !== null ? "Edit OpenDrive Source" : "New OpenDrive Source"}
    </div>
    <div className="mb-2">
      <label className="text-sm">Name</label>
      <input
        className="w-full mt-1 p-2 rounded bg-[#10151e] border border-green-600 focus:outline-none"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        autoFocus
      />
    </div>
    <div className="mb-2">
      <label className="text-sm">Encryption Method</label>
      <select
        className="w-full mt-1 p-2 rounded bg-[#10151e] border border-green-600"
        value={form.encryption}
        onChange={e => setForm(f => ({ ...f, encryption: e.target.value }))}
      >
        <option value="">Choose...</option>
        {encryptionMethods.map((m, idx) => (
          <option key={m.name + idx} value={m.name}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
    <div className="mb-2">
      <label className="text-sm">OpenDrive Username</label>
      <input
        className="w-full mt-1 p-2 rounded bg-[#10151e] border border-green-600 focus:outline-none"
        value={form.username || ""}
        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
        autoFocus={false}
      />
    </div>
    <div className="mb-2">
      <label className="text-sm">OpenDrive Password</label>
      <input
        className="w-full mt-1 p-2 rounded bg-[#10151e] border border-green-600 focus:outline-none"
        type="password"
        value={form.password || ""}
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        autoFocus={false}
      />
    </div>
    <div className="mb-2">
      <label className="text-sm">Root Folder (e.g. / or /Vault, or a Folder ID)</label>
      <input
        className="w-full mt-1 p-2 rounded bg-[#10151e] border border-green-600 focus:outline-none"
        value={form.rootFolder || ""}
        onChange={e => setForm(f => ({ ...f, rootFolder: e.target.value }))}
        autoFocus={false}
      />
    </div>
    <div className="flex justify-end space-x-2 mt-3">
      <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
      <Button
        variant="default"
        className="bg-green-700 hover:bg-green-500"
        onClick={handleAddOrSave}
        disabled={!form.name || !form.encryption || !form.username || !form.password || !form.rootFolder}
      >
        {editIdx !== null ? "Save" : "Add"}
      </Button>
    </div>
  </div>
);

const OpenDriveSourceActions: React.FC<SourceActionsProps> = ({
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

export class OpenDriveSource implements ISource {
  readonly type = "opendrive" as const;
  readonly name: string;
  readonly config: SourceConfig & {
    username: string;
    password: string;
    rootFolder: string;
  };

  constructor(config: SourceConfig & { username: string; password: string; rootFolder: string }) {
    this.name = config.name;
    this.config = config;
  }

  ConfigComponent = SourceConfigOpenDrive;
  ActionsComponent = OpenDriveSourceActions;

  async listdir(path: string): Promise<FileInfo[]> {
    try {
      let folderId = this.config.rootFolder;
      if (folderId === "/") folderId = "0";
      
      // Navigate to the requested path
      if (path && path !== "/") {
        const pathParts = path.split("/").filter(p => p);
        let currentFolderId = folderId;
        
        for (const pathPart of pathParts) {
          const resp = await fetch("https://dev.opendrive.com/folder/list.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: this.config.username,
              passwd: this.config.password,
              folder_id: currentFolderId,
            }),
          });
          
          if (!resp.ok) throw new Error("Failed to list folders");
          const json = await resp.json();
          if (!json || !json.Folders) return [];
          
          const found = json.Folders.find((f: any) => f.Name === pathPart);
          if (!found) throw new Error(`Folder "${pathPart}" not found`);
          currentFolderId = found.FolderID;
        }
        folderId = currentFolderId;
      }

      const resp = await fetch("https://dev.opendrive.com/folder/list.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.config.username,
          passwd: this.config.password,
          folder_id: folderId,
        }),
      });

      if (!resp.ok) throw new Error("Failed to list directory");
      const json = await resp.json();
      if (!json) return [];

      const files: FileInfo[] = [];
      
      // Add folders
      if (json.Folders) {
        files.push(...json.Folders.map((f: any) => ({
          name: f.Name,
          type: "folder" as const,
          path: path ? `${path}/${f.Name}` : f.Name,
        })));
      }
      
      // Add files
      if (json.Files) {
        files.push(...json.Files.map((f: any) => ({
          name: f.Name,
          type: "file" as const,
          path: path ? `${path}/${f.Name}` : f.Name,
          size: f.Size,
          lastModified: new Date(f.DateModified),
        })));
      }

      return files;
    } catch (error) {
      console.error("[OpenDriveSource] Failed to list directory:", error);
      throw error;
    }
  }

  async read(path: string): Promise<string | ArrayBuffer> {
    // Implementation would depend on OpenDrive's file download API
    throw new Error("OpenDrive read not implemented yet");
  }

  async write(path: string, content: string | ArrayBuffer): Promise<void> {
    // Implementation would depend on OpenDrive's file upload API
    throw new Error("OpenDrive write not implemented yet");
  }

  async mkdir(path: string): Promise<void> {
    // Implementation would depend on OpenDrive's folder creation API
    throw new Error("OpenDrive mkdir not implemented yet");
  }

  async validateConfig(config: Record<string, any>): Promise<string | null> {
    if (!config.name || !config.encryption || !config.username || !config.password || !config.rootFolder) {
      return "All fields are required for OpenDrive source";
    }

    try {
      const resp = await fetch("https://dev.opendrive.com/folder/list.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: config.username,
          passwd: config.password,
          folder_id: config.rootFolder === "/" ? "0" : config.rootFolder,
        }),
      });

      if (!resp.ok) {
        return `Could not connect to OpenDrive (${resp.status}): ${resp.statusText}`;
      }
      
      const json = await resp.json();
      if (json && json.Error) {
        return json.Error;
      }
      
      return null;
    } catch (error) {
      return "Network error or unable to connect to OpenDrive";
    }
  }
}
