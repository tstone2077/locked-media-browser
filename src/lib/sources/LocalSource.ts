
import React, { useRef } from "react";
import { ISource, FileInfo, SourceConfigProps, SourceConfig, SourceActionsProps } from "./types";
import { Button } from "@/components/ui/button";
import { Download, Upload, Edit, Trash2, HardDrive } from "lucide-react";
import { useFileVault, FileEntry } from "@/context/FileVaultContext";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";

// UI Components
const SourceConfigLocal: React.FC<SourceConfigProps> = ({
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
      {editIdx !== null ? "Edit Local Storage Source" : "New Local Storage Source"}
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
    <div className="flex justify-end space-x-2 mt-3">
      <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
      <Button
        variant="default"
        className="bg-green-700 hover:bg-green-500"
        onClick={handleAddOrSave}
        disabled={!form.name || !form.encryption}
      >
        {editIdx !== null ? "Save" : "Add"}
      </Button>
    </div>
  </div>
);

// Utility functions for export/import
function getGenericFileName(idx: number) {
  return `file-${idx}`;
}

function getIndexFileName() {
  return "vault-index.json.enc";
}

async function exportVault(filesPerSource: Record<number, FileEntry[]>) {
  const zip = new JSZip();

  for (const [sourceIdx, files] of Object.entries(filesPerSource)) {
    const folder = zip.folder(`source-${sourceIdx}`);
    if (!folder) continue;

    if (!files || !files.length) continue;

    const indexData: any[] = [];
    files.forEach((file, idx) => {
      const genericName = getGenericFileName(idx);
      indexData.push({
        generic: genericName,
        name: file.name,
        type: file.type,
        parent: file.parent,
      });
      if (file.type !== "folder") {
        folder.file(genericName, file.encrypted);
      }
    });

    const ENCRYPT_PASS = "vault-password";
    async function indexEncrypt(data: any): Promise<string> {
      const enc = new TextEncoder();
      const json = JSON.stringify(data);
      const salt = enc.encode("filevault-static-salt");
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(ENCRYPT_PASS),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );
      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(json)
      );
      function base64(buf: ArrayBuffer) {
        const bytes = new Uint8Array(buf);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(
            null,
            bytes.subarray(i, i + chunkSize) as unknown as number[]
          );
        }
        return btoa(binary);
      }
      return base64(iv) + ":" + base64(ciphertext);
    }
    const encryptedIndex = await indexEncrypt(indexData);
    folder.file(getIndexFileName(), encryptedIndex);
  }

  const blob = await zip.generateAsync({ type: "blob" });

  let usedPicker = false;
  if (
    typeof window !== "undefined" &&
    typeof (window as any).showSaveFilePicker === "function"
  ) {
    try {
      const pickerOpts = {
        suggestedName: "safebox-vault.zip",
        types: [
          {
            description: "Zip Archive",
            accept: { "application/zip": [".zip"] },
          },
        ],
      };
      const handle = await (window as any).showSaveFilePicker(pickerOpts);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      toast({
        title: "File Picker Used",
        description: "Exported using Save File Picker.",
      });
      usedPicker = true;
    } catch (e) {
      toast({
        title: "File Picker Cancelled",
        description: "Falling back to download.",
      });
    }
  }
  if (!usedPicker) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safebox-vault.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast({
      title: "Classic Download Used",
      description: "Exported using classic download.",
    });
  }
}

async function indexDecrypt(encrypted: string): Promise<any[]> {
  const dec = new TextDecoder();
  const ENCRYPT_PASS = "vault-password";
  const salt = new TextEncoder().encode("filevault-static-salt");
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ENCRYPT_PASS),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  if (!encrypted.includes(":")) throw new Error("Malformed encrypted index.");
  const [ivB64, ctB64] = encrypted.split(":");
  function fromB64(b64: string): Uint8Array {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  }
  const iv = fromB64(ivB64);
  const ct = fromB64(ctB64);
  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );
  const json = dec.decode(decryptedBuf);
  return JSON.parse(json);
}

function importVault(
  file: File,
  setFilesPerSource: (
    updater: (old: Record<number, FileEntry[]>) => Record<number, FileEntry[]>
  ) => void
) {
  const reader = new FileReader();
  reader.onload = async () => {
    const arrayBuffer = reader.result as ArrayBuffer;
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const newFiles: Record<number, FileEntry[]> = {};

      const indexFileEntries: { sourceIdx: number; zipEntry: JSZip.JSZipObject; folderEntries: JSZip.JSZipObject[] }[] = [];
      zip.forEach((relativePath, zipEntry) => {
        const matchIdxFile = /^source-(\d+)\/vault-index\.json\.enc$/.exec(relativePath);
        if (matchIdxFile) {
          const sourceIdx = parseInt(matchIdxFile[1], 10);
          const filesInFolder: JSZip.JSZipObject[] = [];
          zip.forEach((path2, zipEntry2) => {
            const folderPrefix = `source-${sourceIdx}/`;
            if (
              path2.startsWith(folderPrefix) &&
              path2 !== `source-${sourceIdx}/vault-index.json.enc`
            ) {
              filesInFolder.push(zipEntry2);
            }
          });
          indexFileEntries.push({ sourceIdx, zipEntry, folderEntries: filesInFolder });
        }
      });

      for (const { sourceIdx, zipEntry, folderEntries } of indexFileEntries) {
        const indexEnc = await zipEntry.async("text");
        const metaArr = await indexDecrypt(indexEnc);

        const fileMap: Record<string, JSZip.JSZipObject> = {};
        for (const fe of folderEntries) {
          if (!fe.dir) {
            const fname = fe.name.replace(/^source-\d+\//, "");
            fileMap[fname] = fe;
          }
        }

        const sourceFiles: FileEntry[] = [];

        for (const meta of metaArr) {
          if (meta.type === "folder") {
            sourceFiles.push({
              name: meta.name,
              type: "folder",
              encrypted: "",
              parent: meta.parent,
            });
          } else {
            const zipObj = fileMap[meta.generic];
            const encPayload =
              zipObj && !zipObj.dir ? await zipObj.async("text") : "";
            sourceFiles.push({
              name: meta.name,
              type: meta.type,
              encrypted: encPayload,
              parent: meta.parent,
            });
          }
        }
        newFiles[sourceIdx] = sourceFiles;
      }

      setFilesPerSource((prev) => ({
        ...prev,
        ...newFiles,
      }));
      toast({
        title: "Import successful!",
        description: "Imported files are now visible below.",
      });
    } catch (e) {
      alert("Error unpacking vault zip: " + (e as Error).message);
    }
  };
  reader.readAsArrayBuffer(file);
}

const LocalSourceActions: React.FC<SourceActionsProps> = ({
  sourceIndex,
  onEdit,
  onDelete,
}) => {
  const { filesPerSource, setFilesPerSource } = useFileVault();
  const importRef = useRef<HTMLInputElement | null>(null);

  function triggerImport() {
    importRef.current?.click();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      importVault(e.target.files[0], setFilesPerSource);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2 ml-6">
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-green-500 text-green-400 flex gap-1"
          onClick={() => exportVault(filesPerSource)}
          title="Export all files"
        >
          <Download size={14} />
          Export Vault
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-green-500 text-green-400 flex gap-1"
          onClick={triggerImport}
          title="Import files"
        >
          <Upload size={14} />
          Import Vault
          <input
            type="file"
            accept=".zip"
            ref={importRef}
            onChange={handleImport}
            className="hidden"
          />
        </Button>
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
      </div>
      <Button
        size="sm"
        variant="destructive"
        className="ml-4 self-center"
        onClick={onDelete}
        title="Delete Source"
      >
        <Trash2 size={14} />
        Delete
      </Button>
    </div>
  );
};

export class LocalSource implements ISource {
  readonly type = "local" as const;
  readonly name: string;
  readonly config: SourceConfig;

  constructor(config: SourceConfig) {
    this.name = config.name;
    this.config = config;
  }

  ConfigComponent = SourceConfigLocal;
  ActionsComponent = LocalSourceActions;

  async listdir(path: string): Promise<FileInfo[]> {
    // For local storage, we'll return empty array since we don't have a real filesystem
    // This would be implemented based on your local storage structure
    return [];
  }

  async read(path: string): Promise<string | ArrayBuffer> {
    // For local storage, implement reading from your storage mechanism
    const key = `local-file-${path}`;
    const data = localStorage.getItem(key);
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }
    return data;
  }

  async write(path: string, content: string | ArrayBuffer): Promise<void> {
    // For local storage, implement writing to your storage mechanism
    const key = `local-file-${path}`;
    const stringContent = typeof content === 'string' ? content : 
      new TextDecoder().decode(content);
    localStorage.setItem(key, stringContent);
  }

  async mkdir(path: string): Promise<void> {
    // For local storage, create a directory marker
    const key = `local-dir-${path}`;
    localStorage.setItem(key, "");
  }

  async validateConfig(config: Record<string, any>): Promise<string | null> {
    if (!config.name || !config.encryption) {
      return "Name and encryption method are required";
    }
    return null;
  }
}
