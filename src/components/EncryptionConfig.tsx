
import { useState } from "react";
import { Lock, Edit, Trash2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEncryptionMethods } from "@/lib/encryption";
import { GPGConfig, AES256Config, EncryptionMethodConfig, ENCRYPTION_METHODS } from "@/lib/encryption-methods";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Utility type guards
function isGPG(config: EncryptionMethodConfig): config is GPGConfig {
  return config.type === "gpg";
}
function isAES256(config: EncryptionMethodConfig): config is AES256Config {
  return config.type === "aes-256";
}

const ENCRYPTION_TYPES = [
  { value: "gpg", label: "GPG" },
  { value: "aes-256", label: "AES-256" },
];

const getDefaultConfig = (type: "gpg" | "aes-256"): EncryptionMethodConfig => {
  if (type === "gpg") {
    return {
      name: "",
      type: "gpg",
      privateKey: "",
      password: "",
    };
  }
  // aes-256
  return {
    name: "",
    type: "aes-256",
    password: "",
  };
};

const EncryptionConfig = () => {
  const { methods, addMethod, removeMethod } = useEncryptionMethods();
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Default form, always have all required fields present; type guards to show/hide
  const [form, setForm] = useState<EncryptionMethodConfig>(getDefaultConfig("gpg"));

  function handleEdit(idx: number) {
    setEditIdx(idx);
    setForm(methods[idx]);
    setShowAdd(true);
  }

  function handleAddOrSave() {
    if (!form.name || !form.password) return;
    if (isGPG(form) && !form.privateKey) return;
    if (editIdx !== null) {
      const updatedMethods = methods.map((m, i) => (i === editIdx ? form : m));
      Array(methods.length)
        .fill(0)
        .forEach((_, i) => removeMethod(0));
      updatedMethods.forEach(m => addMethod(m));
    } else {
      addMethod(form);
    }
    setForm(getDefaultConfig("gpg"));
    setEditIdx(null);
    setShowAdd(false);
  }

  function handleRemove(idx: number) {
    removeMethod(idx);
    if (editIdx === idx) {
      setEditIdx(null);
      setShowAdd(false);
      setForm(getDefaultConfig("gpg"));
    }
  }

  function handleCancel() {
    setEditIdx(null);
    setShowAdd(false);
    setForm(getDefaultConfig("gpg"));
  }

  return (
    <div className="px-1 sm:px-0">
      <ul className="space-y-4 mb-6">
        {methods.length === 0 && (
          <li className="opacity-70 text-sm">No encryption methods configured.</li>
        )}
        {methods.map((m, idx) => (
          <li
            key={m.name + idx}
            className={cn(
              "rounded-lg px-3 py-3 sm:px-4 bg-[#28344a]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-cyan-900/40 animate-fade-in"
            )}
          >
            <div className="w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <Lock className="text-cyan-400" size={18} />
                <span className="font-medium text-cyan-200 text-base">{m.name}</span>
                <span className="text-xs tracking-tight bg-cyan-900/30 text-cyan-200 px-2 py-0.5 rounded ml-2">
                  {m.type === "gpg"
                    ? "GPG"
                    : m.type === "aes-256"
                      ? "AES-256"
                      : ""}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 break-all">
                {isGPG(m)
                  ? <>GPG Key <span className="ml-2 opacity-70">{(m.privateKey ?? '').slice(0, 18)}...</span></>
                  : isAES256(m)
                    ? <>AES-256 Password</>
                    : null}
              </div>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(idx)}
                title="Edit"
                className="border-cyan-500 text-cyan-400 flex-1 sm:flex-initial w-full sm:w-auto"
              >
                <Edit size={14} />
                <span className="ml-1">Edit</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemove(idx)}
                title="Delete"
                className="ml-0 sm:ml-2 flex-1 sm:flex-initial w-full sm:w-auto"
              >
                <Trash2 size={14} />
                <span className="ml-1">Delete</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {showAdd ? (
        <div className="p-2 sm:p-4 rounded-xl border border-cyan-700/50 bg-[#191f29] mb-2 animate-scale-in max-w-full sm:max-w-none w-full overflow-y-auto">
          <div className="mb-3 font-semibold text-lg text-cyan-400 flex items-center">
            <Lock className="mr-2" /> {editIdx !== null ? "Edit Encryption Method" : "New Encryption Method"}
          </div>
          {/* ToggleGroup for encryption type */}
          <div className="mb-2">
            <label className="text-sm block mb-1">Type</label>
            <ToggleGroup
              type="single"
              value={form.type}
              onValueChange={v => {
                if (!v) return;
                setForm(f => {
                  // Always base new value off of defaults for this type, keeping name and password if possible
                  if (v === "gpg") {
                    return {
                      name: f.name ?? "",
                      type: "gpg",
                      privateKey: isGPG(f) ? f.privateKey : "",
                      password: f.password ?? "",
                    };
                  }
                  if (v === "aes-256") {
                    return {
                      name: f.name ?? "",
                      type: "aes-256",
                      password: f.password ?? "",
                    };
                  }
                  return getDefaultConfig("gpg");
                });
              }}
              className="mb-2 flex-wrap"
            >
              {ENCRYPTION_TYPES.map(opt => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className={
                    "px-4 py-2 rounded-xl data-[state=on]:bg-cyan-700 data-[state=on]:text-white data-[state=on]:border-cyan-400 border border-cyan-600 mx-0.5 text-sm" +
                    (form.type === opt.value ? " ring-2 ring-cyan-400" : "")
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
              className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600 focus:outline-none text-base"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>
          {isGPG(form) && (
            <div className="mb-2">
              <label className="text-sm">Private Key</label>
              <textarea
                className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600 h-20 text-sm"
                value={form.privateKey ?? ""}
                onChange={e =>
                  setForm(f =>
                    isGPG(f)
                      ? { ...f, privateKey: e.target.value }
                      : f
                  )
                }
              />
            </div>
          )}
          <div className="mb-2">
            <label className="text-sm">
              {isGPG(form)
                ? "Password"
                : isAES256(form)
                ? "AES-256 Password"
                : "Password"}
            </label>
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
      ) : (
        <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full mt-2 text-cyan-400 border-cyan-500 flex gap-2">
          <KeyRound size={16} /> Add Encryption Method
        </Button>
      )}
    </div>
  );
};

export default EncryptionConfig;

// NOTE: This file is getting quite long (270+ lines). Consider asking the assistant to refactor it into smaller files/components.

