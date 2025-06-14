import { useState, useRef } from "react";
import { Image, Lock, Download, Upload, Edit, Trash2, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSources, SourceConfig as SourceConfigType } from "@/lib/sources";
import { useEncryptionMethods } from "@/lib/encryption";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { useFileVault, FileEntry } from "@/context/FileVaultContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function exportVault(filesPerSource: Record<number, FileEntry[]>) {
  const zip = new JSZip();

  Object.entries(filesPerSource).forEach(([sourceIdx, files]) => {
    const folder = zip.folder(`source-${sourceIdx}`);
    files.forEach(file => {
      // Save encrypted file content, retain original file name
      folder?.file(file.name, file.encrypted);
    });
  });

  zip.generateAsync({ type: 'blob' }).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safebox-vault.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  });
}

function importVault(file: File, setFilesPerSource: (updater: (old: Record<number, FileEntry[]>) => Record<number, FileEntry[]>) => void) {
  const reader = new FileReader();
  reader.onload = async () => {
    const arrayBuffer = reader.result as ArrayBuffer;
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const newFiles: Record<number, FileEntry[]> = {};

      const filePromises: Promise<void>[] = [];
      zip.forEach((relativePath, zipEntry) => {
        // Expect format: source-INDEX/filename...
        const match = /^source-(\d+)\/(.+)$/.exec(relativePath);
        if (!zipEntry.dir && match) {
          const sourceIdx = parseInt(match[1], 10);
          const fileName = match[2];
          // Try to guess file type - fallback to text if unknown
          let type: "image" | "text" = fileName.endsWith(".png") ? "image" : "text";
          filePromises.push(
            zipEntry.async("text").then(content => {
              if (!newFiles[sourceIdx]) newFiles[sourceIdx] = [];
              newFiles[sourceIdx].push({
                name: fileName,
                type,
                encrypted: content,
              });
            })
          );
        }
      });

      await Promise.all(filePromises);
      setFilesPerSource(prev => {
        // Merge: overwrite only the affected sources, preserve others
        return {
          ...prev,
          ...newFiles,
        };
      });
      alert("Import successful! Reload the vault tab to view imported files.");
    } catch (e) {
      alert("Error unpacking vault zip: " + (e as Error).message);
    }
  };
  reader.readAsArrayBuffer(file);
}

const SOURCE_TYPES = [
  { value: "local", label: "Local Storage" },
  { value: "dataurl", label: "Data URL" },
];

const SourceConfig = () => {
  const { sources, addSource, removeSource } = useSources();
  const { filesPerSource, setFilesPerSource } = useFileVault();
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<SourceConfigType>({
    name: "",
    type: "local",
    encryption: "",
  });
  const importRef = useRef<HTMLInputElement | null>(null);

  function startEdit(idx: number) {
    setEditIdx(idx);
    setShowAdd(true);
    setForm(sources[idx]);
  }

  function handleAddOrSave() {
    if (!form.name || !form.encryption) return;
    if (editIdx !== null) {
      const updatedSources = sources.map((s, i) => (i === editIdx ? form : s));
      Array(sources.length)
        .fill(0)
        .forEach((_, i) => removeSource(0));
      updatedSources.forEach(s => addSource(s));
    } else {
      addSource(form);
    }
    setEditIdx(null);
    setForm({
      name: "",
      type: "local",
      encryption: "",
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
                  <Image className="text-green-400" size={18} />
                )}
                <span className="font-medium text-green-200">{s.name}</span>
                <span className="text-xs tracking-tight bg-green-900/30 text-green-200 px-2 py-0.5 rounded ml-2">{s.type === "local" ? "LOCAL" : s.type.toUpperCase()}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock size={14} className="inline text-green-300/60" />
                <span>
                  Uses: <span className="opacity-90">{s.encryption}</span>
                </span>
              </div>
            </div>

            {/* Actions - change arrangement here */}
            <div className="flex items-center gap-2 ml-6">
              {s.type === "local" ? (
                <>
                  {/* Vertical button stack for Export, Import, Edit */}
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
                  {/* Delete button to the right, vertically centered */}
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
                // For non-local data sources, keep layout as before
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
        <AddEditSourceDialog
          key={`add-edit-${editIdx !== null ? editIdx : "add"}`}
          form={form}
          setForm={setForm}
          editIdx={editIdx}
          handleAddOrSave={handleAddOrSave}
          handleCancel={handleCancel}
        />
      ) : (
        <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full mt-2 text-green-400 border-green-500 flex gap-2">
          <HardDrive size={16} /> Add Data Source
        </Button>
      )}
    </div>
  );
};

// Factor out dialog so hook call gets latest methods *on each render*
function AddEditSourceDialog({ form, setForm, editIdx, handleAddOrSave, handleCancel }: {
  form: SourceConfigType;
  setForm: React.Dispatch<React.SetStateAction<SourceConfigType>>;
  editIdx: number | null;
  handleAddOrSave: () => void;
  handleCancel: () => void;
}) {
  const { methods } = useEncryptionMethods(); // Reads latest on each render

  return (
    <div className="p-4 rounded-xl border border-green-700/50 bg-[#191f29] mb-2 animate-scale-in">
      <div className="mb-3 font-semibold text-lg text-green-400 flex items-center">
        <HardDrive className="mr-2" /> {editIdx !== null ? (form.type === "local" ? "Edit Local Storage Source" : "Edit Data URL Source") : (form.type === "local" ? "New Local Storage Source" : "New Data URL Source")}
      </div>
      {/* ToggleGroup for Source Type */}
      <div className="mb-2">
        <label className="text-sm block mb-1">Type</label>
        <ToggleGroup
          type="single"
          value={form.type}
          onValueChange={v => {
            if (!v) return;
            setForm(f => ({
              ...f,
              type: v as "local" | "dataurl"
            }));
          }}
          className="mb-2"
        >
          {SOURCE_TYPES.map(opt => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className={
                "px-4 py-2 rounded-xl data-[state=on]:bg-green-700 data-[state=on]:text-white data-[state=on]:border-green-400 border border-green-600 mx-0.5 " +
                (form.type === opt.value ? "ring-2 ring-green-400" : "")
              }
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
          {methods.map((m, idx) => (
            <option key={m.name + idx} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-2 mt-3">
        <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
        <Button variant="default" className="bg-green-700 hover:bg-green-500" onClick={handleAddOrSave}>
          {editIdx !== null ? "Save" : "Add"}
        </Button>
      </div>
    </div>
  );
}

export default SourceConfig;
