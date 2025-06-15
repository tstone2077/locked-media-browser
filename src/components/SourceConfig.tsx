
import { useState, useRef } from "react";
import { Image, Lock, Download, Upload, Edit, Trash2, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
-import { useSources, SourceConfig as SourceConfigType } from "@/lib/sources";
+import { useSources } from "@/lib/sources";
+import { SourceConfig } from "@/lib/sources";
import { useEncryptionMethods } from "@/lib/encryption";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { useFileVault, FileEntry } from "@/context/FileVaultContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/hooks/use-toast";

// ENCRYPTION for vault metadata
import { useCrypto } from "@/hooks/useCrypto";
import SourceConfigLocal from "./SourceConfigLocal";
import SourceConfigOpenDrive from "./SourceConfigOpenDrive";

// Utility to get generic file name for index
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

    // Build index and save generic files
    const indexData: any[] = [];
    files.forEach((file, idx) => {
      const genericName = getGenericFileName(idx);
      indexData.push({
        generic: genericName,
        name: file.name,
        type: file.type,
        parent: file.parent,
      });
      // Save encrypted payload with generic file name, except for folders (no content)
      if (file.type !== "folder") {
        folder.file(genericName, file.encrypted);
      }
    });

    // Encrypt the metadata index file and store in zip
    // Use passphrase for WebCrypto AES-GCM (same as file encryption, can be refactored to use user-selected method)
    const ENCRYPT_PASS = "vault-password";
    // The useCrypto hook requires React/useState. We'll create our own utility version here, since this runs outside component
    // Utility function for encryption (adapted from useCrypto)
    async function indexEncrypt(data: any): Promise<string> {
      const enc = new TextEncoder();
      const json = JSON.stringify(data);
      // Derive key
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
      // Encrypt
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(json)
      );
      // Export as iv:ciphertext, both base64
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
      // @ts-ignore
      const pickerOpts = {
        suggestedName: "safebox-vault.zip",
        types: [
          {
            description: "Zip Archive",
            accept: { "application/zip": [".zip"] },
          },
        ],
      };
      // @ts-ignore
      const handle = await window.showSaveFilePicker(pickerOpts);
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

// Utility decrypt - same logic as above, but for reading index on import.
async function indexDecrypt(encrypted: string): Promise<any[]> {
  const dec = new TextDecoder();
  // Key params same as in export
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
  // Split iv:ciphertext
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

      // Pass 1: find all index metadata files: source-idx/vault-index.json.enc
      const indexFileEntries: { sourceIdx: number; zipEntry: JSZip.JSZipObject; folderEntries: JSZip.JSZipObject[] }[] = [];
      zip.forEach((relativePath, zipEntry) => {
        const matchIdxFile = /^source-(\d+)\/vault-index\.json\.enc$/.exec(relativePath);
        if (matchIdxFile) {
          const sourceIdx = parseInt(matchIdxFile[1], 10);
          // Gather also all entries in this folder (except index file)
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

      // For each found source, process files using the index
      for (const { sourceIdx, zipEntry, folderEntries } of indexFileEntries) {
        const indexEnc = await zipEntry.async("text");
        const metaArr = await indexDecrypt(indexEnc);

        // Map generic fileName -> zipEntry for this folder
        const fileMap: Record<string, JSZip.JSZipObject> = {};
        for (const fe of folderEntries) {
          // Only files, no dir
          if (!fe.dir) {
            const fname = fe.name.replace(/^source-\d+\//, ""); // Remove path prefix to get generic name
            fileMap[fname] = fe;
          }
        }

        const sourceFiles: FileEntry[] = [];

        for (const meta of metaArr) {
          // For folders, no encrypted file needed, else map generic name to actual encrypted content
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

// Extend the source config type for OpenDrive credentials
type OpenDriveExtra = {
  username: string;
  password: string;
  rootFolder: string;
};

type SourceConfigWithExtras = {
  name: string;
  type: "local" | "opendrive";
  encryption: string;
  username?: string;
  password?: string;
  rootFolder?: string;
};

const SOURCE_TYPES = [
  { value: "local", label: "Local Storage" },
  { value: "opendrive", label: "OpenDrive" },
];

const SourceConfig = () => {
  const { sources, addSource, removeSource } = useSources();
  const { filesPerSource, setFilesPerSource } = useFileVault();
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  // Add OpenDrive fields to form state
  const [form, setForm] = useState<SourceConfigWithExtras>({
    name: "",
    type: "local",
    encryption: "",
    username: "",
    password: "",
    rootFolder: "",
  });
  const importRef = useRef<HTMLInputElement | null>(null);

  function startEdit(idx: number) {
    setEditIdx(idx);
    setShowAdd(true);
    // Handle OpenDrive extended fields if editing
    setForm({
      ...sources[idx],
      // Fallback values: ensure fields exist on form
      username: (sources[idx] as any).username || "",
      password: (sources[idx] as any).password || "",
      rootFolder: (sources[idx] as any).rootFolder || "",
    });
  }

  async function verifyOpenDriveConnection(form: SourceConfigWithExtras): Promise<null | string> {
    if (form.type !== "opendrive" || !form.username || !form.password || !form.rootFolder) return null;
    try {
      // OpenDrive API: https://dev.opendrive.com/folder/list
      // We'll check if we can list the rootFolder
      const resp = await fetch("https://dev.opendrive.com/folder/list.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: form.username,
          passwd: form.password,
          folder_id: form.rootFolder === "/" ? "0" : form.rootFolder // "0" is root in OpenDrive
        })
      });

      if (!resp.ok) {
        return `Could not connect to OpenDrive (${resp.status}): ${resp.statusText}`;
      }
      const json = await resp.json();
      // If API returns error or unauthorized
      if ((json && json.Error) || resp.status === 401 || resp.status === 403) {
        return json && json.Error ? json.Error : "Unauthorized OpenDrive credentials.";
      }
      // Otherwise, it worked!
      return null;
    } catch (err) {
      return "Network error or unable to connect to OpenDrive.";
    }
  }

  async function handleAddOrSave() {
    if (!form.name || !form.encryption) return;
    if (form.type === "opendrive" && (!form.username || !form.password || !form.rootFolder)) return;

    // OpenDrive: validate before saving!
    if (form.type === "opendrive") {
      const errorMsg = await verifyOpenDriveConnection(form);
      if (errorMsg) {
        toast({
          title: "OpenDrive Connection Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
    }
    // Prepare clean object
    const cleanForm: SourceConfigWithExtras = { ...form };
    if (form.type !== "opendrive") {
      delete cleanForm.username;
      delete cleanForm.password;
      delete cleanForm.rootFolder;
    }
    if (editIdx !== null) {
      const updatedSources = sources.map((s, i) => (i === editIdx ? cleanForm : s));
      Array(sources.length)
        .fill(0)
        .forEach((_, i) => removeSource(0));
      updatedSources.forEach(s => addSource(s));
    } else {
      addSource(cleanForm as any);
    }
    setEditIdx(null);
    setForm({
      name: "",
      type: "local",
      encryption: "",
      username: "",
      password: "",
      rootFolder: "",
    });
    setShowAdd(false);
  }

  function handleRemove(idx: number) {
    removeSource(idx);
    if (editIdx === idx) {
      setEditIdx(null);
      setShowAdd(false);
      setForm({
        name: "",
        type: "local",
        encryption: "",
        username: "",
        password: "",
        rootFolder: "",
      });
    }
  }

  function handleCancel() {
    setEditIdx(null);
    setShowAdd(false);
    setForm({
      name: "",
      type: "local",
      encryption: "",
      username: "",
      password: "",
      rootFolder: "",
    });
  }

  function triggerImport() {
    importRef.current?.click();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      importVault(e.target.files[0], setFilesPerSource);
      e.target.value = ""; // Reset for future imports
    }
  }

  // For encryption method choices
  const { methods } = useEncryptionMethods();

  return (
    <div>
      <ul className="space-y-4 mb-6">
        {sources.length === 0 && (
          <li className="opacity-70 text-sm">No data sources configured.</li>
        )}
        {sources.map((s, idx) => (
          <li
            key={s.name + idx}
            className={cn(
              "rounded-lg px-4 py-3 bg-[#28344a]/70 flex items-center justify-between border border-green-900/40 animate-fade-in"
            )}
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {s.type === "local" ? (
                  <HardDrive className="text-green-400" size={18} />
                ) : (
                  // OpenDrive icon fallback to Image
                  <Image className="text-green-400" size={18} />
                )}
                <span className="font-medium text-green-200">{s.name}</span>
                <span className="text-xs tracking-tight bg-green-900/30 text-green-200 px-2 py-0.5 rounded ml-2">
                  {s.type === "local" ? "LOCAL" : "OPENDRIVE"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock size={14} className="inline text-green-300/60" />
                <span>
                  Uses: <span className="opacity-90">{s.encryption}</span>
                  {s.type === "opendrive" && s.username && (
                    <> ({s.username})</>
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-6">
              {s.type === "local" ? (
                <>
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
                      onClick={() => startEdit(idx)}
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
                    onClick={() => handleRemove(idx)}
                    title="Delete Source"
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </>
              ) : (
                // For OpenDrive source
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(idx)}
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
                    onClick={() => handleRemove(idx)}
                    title="Delete Source"
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {/* ADD/EDIT SOURCE FORM */}
      {showAdd ? (
        form.type === "opendrive" ? (
          <SourceConfigOpenDrive
            form={form}
            setForm={setForm}
            editIdx={editIdx}
            handleAddOrSave={handleAddOrSave}
            handleCancel={handleCancel}
            encryptionMethods={methods}
          />
        ) : (
          <SourceConfigLocal
            form={form}
            setForm={setForm}
            editIdx={editIdx}
            handleAddOrSave={handleAddOrSave}
            handleCancel={handleCancel}
            encryptionMethods={methods}
          />
        )
      ) : (
        <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full mt-2 text-green-400 border-green-500 flex gap-2">
          <HardDrive size={16} /> Add Data Source
        </Button>
      )}
    </div>
  );
};

export default SourceConfig;
