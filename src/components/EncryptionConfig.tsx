import { useState } from "react";
import { Lock, Edit, Trash2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEncryptionMethods } from "@/lib/encryption";
import { EncryptionMethodConfig, ENCRYPTION_METHODS } from "@/lib/encryption-methods";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Utility type guards
function isGPG(config: EncryptionMethodConfig): config is { type: "gpg"; privateKey: string; password: string; } {
  return config.type === "gpg";
}
function isAES256(config: EncryptionMethodConfig): config is { type: "aes-256"; password: string; } {
  return config.type === "aes-256";
}
function isAge(config: EncryptionMethodConfig): config is { type: "age"; password: string; } {
  return config.type === "age";
}

const ENCRYPTION_TYPES = [
  { value: "gpg", label: "GPG" },
  { value: "aes-256", label: "AES-256" },
  { value: "age", label: "age" }, // add age method here
];

const EncryptionConfig = () => {
  const { methods, addMethod, removeMethod } = useEncryptionMethods();
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Default form, always have 'privateKey' to avoid TS errors; use type guards to show/hide
  const [form, setForm] = useState<EncryptionMethodConfig>({
    name: "",
    type: "gpg",
    privateKey: "",
    password: "",
  } as EncryptionMethodConfig);

  function handleEdit(idx: number) {
    setEditIdx(idx);
    setForm(methods[idx]);
    setShowAdd(true);
  }

  function handleAddOrSave() {
    // Validation for each type
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
    setForm({
      name: "",
      type: "gpg",
      privateKey: "",
      password: "",
    } as EncryptionMethodConfig);
    setEditIdx(null);
    setShowAdd(false);
  }

  function handleRemove(idx: number) {
    removeMethod(idx);
    if (editIdx === idx) {
      setEditIdx(null);
      setShowAdd(false);
      setForm({
        name: "",
        type: "gpg",
        privateKey: "",
        password: "",
      } as EncryptionMethodConfig);
    }
  }

  function handleCancel() {
    setEditIdx(null);
    setShowAdd(false);
    setForm({
      name: "",
      type: "gpg",
      privateKey: "",
      password: "",
    } as EncryptionMethodConfig);
  }

  return (
    <div>
      <ul className="space-y-4 mb-6">
        {methods.length === 0 && (
          <li className="opacity-70 text-sm">No encryption methods configured.</li>
        )}
        {methods.map((m, idx) => (
          <li
            key={m.name + idx}
            className={cn(
              "rounded-lg px-4 py-3 bg-[#28344a]/70 flex items-center justify-between border border-cyan-900/40 animate-fade-in"
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <Lock className="text-cyan-400" size={18} />
                <span className="font-medium text-cyan-200">{m.name}</span>
                <span className="text-xs tracking-tight bg-cyan-900/30 text-cyan-200 px-2 py-0.5 rounded ml-2">
                  {m.type === "gpg"
                    ? "GPG"
                    : m.type === "aes-256"
                      ? "AES-256"
                      : m.type === "age"
                        ? "age"
                        : ""}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isGPG(m)
                  ? <>GPG Key <span className="ml-2 opacity-70">{(m.privateKey ?? '').slice(0, 18)}...</span></>
                  : isAES256(m)
                    ? <>AES-256 Password</>
                    : isAge(m)
                      ? <>age Password</>
                      : null}
              </div>
            </div>
            <div className="flex gap-2 ml-6">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(idx)}
                title="Edit"
                className="border-cyan-500 text-cyan-400"
              >
                <Edit size={14} />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemove(idx)}
                title="Delete"
                className="ml-2"
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {showAdd ? (
        <div className="p-4 rounded-xl border border-cyan-700/50 bg-[#191f29] mb-2 animate-scale-in">
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
                  if (v === "gpg") {
                    return {
                      ...f,
                      type: v,
                      privateKey: typeof f.privateKey === "string" ? f.privateKey : "",
                    };
                  }
                  if (v === "aes-256") {
                    return {
                      ...f,
                      type: v,
                      password: f.password ?? "",
                    };
                  }
                  if (v === "age") {
                    return {
                      ...f,
                      type: v,
                      password: f.password ?? "",
                    };
                  }
                  return { ...f, type: v };
                });
              }}
              className="mb-2"
            >
              {ENCRYPTION_TYPES.map(opt => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className={
                    "px-4 py-2 rounded-xl data-[state=on]:bg-cyan-700 data-[state=on]:text-white data-[state=on]:border-cyan-400 border border-cyan-600 mx-0.5 " +
                    (form.type === opt.value ? "ring-2 ring-cyan-400" : "")
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
              className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600 focus:outline-none"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>
          {isGPG(form) && (
            <div className="mb-2">
              <label className="text-sm">Private Key</label>
              <textarea
                className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600 h-20"
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
                : isAge(form)
                ? "age Password"
                : "Password"}
            </label>
            <input
              type="password"
              className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div className="flex justify-end space-x-2 mt-3">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button variant="default" onClick={handleAddOrSave} className="bg-cyan-700 hover:bg-cyan-500">
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
