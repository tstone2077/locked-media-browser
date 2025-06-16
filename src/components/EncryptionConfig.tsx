
import { useState } from "react";
import { Lock, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEncryptionMethods } from "@/lib/encryption";
import { EncryptionMethodConfig } from "@/lib/encryption-methods/types";
import { GPGMethod } from "@/lib/encryption-methods/GPGMethod";
import { AES256Method } from "@/lib/encryption-methods/AES256Method";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ENCRYPTION_TYPES = [
  { value: "gpg", label: "GPG" },
  { value: "aes-256", label: "AES-256" },
];

const EncryptionConfig = () => {
  const { methods, methodConfigs, addMethod, removeMethod } = useEncryptionMethods();
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<EncryptionMethodConfig>(GPGMethod.defaultConfig());

  function handleEdit(idx: number) {
    setEditIdx(idx);
    setForm(methodConfigs[idx]);
    setShowAdd(true);
  }

  function handleAddOrSave() {
    if (!form.name || !form.password) return;
    if (form.type === "gpg" && !(form as any).privateKey) return;
    
    if (editIdx !== null) {
      const updatedMethods = methodConfigs.map((m, i) => (i === editIdx ? form : m));
      Array(methodConfigs.length)
        .fill(0)
        .forEach((_, i) => removeMethod(0));
      updatedMethods.forEach(m => addMethod(m));
    } else {
      addMethod(form);
    }
    setForm(GPGMethod.defaultConfig());
    setEditIdx(null);
    setShowAdd(false);
  }

  function handleRemove(idx: number) {
    removeMethod(idx);
    if (editIdx === idx) {
      setEditIdx(null);
      setShowAdd(false);
      setForm(GPGMethod.defaultConfig());
    }
  }

  function handleCancel() {
    setEditIdx(null);
    setShowAdd(false);
    setForm(GPGMethod.defaultConfig());
  }

  // Create temporary method instances to get their config components
  const gpgMethod = new GPGMethod(GPGMethod.defaultConfig());
  const aes256Method = new AES256Method(AES256Method.defaultConfig());

  return (
    <div className="px-1 sm:px-0">
      <ul className="space-y-4 mb-6">
        {methods.length === 0 && (
          <li className="opacity-70 text-sm">No encryption methods configured.</li>
        )}
        {methods.map((method, idx) => {
          const methodConfig = methodConfigs[idx];
          return (
            <li
              key={method.name + idx}
              className={cn(
                "rounded-lg px-3 py-3 sm:px-4 bg-[#28344a]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-cyan-900/40 animate-fade-in"
              )}
            >
              <div className="w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <Lock className="text-cyan-400" size={18} />
                  <span className="font-medium text-cyan-200 text-base">{method.name}</span>
                  <span className="text-xs tracking-tight bg-cyan-900/30 text-cyan-200 px-2 py-0.5 rounded ml-2">
                    {method.type === "gpg" ? "GPG" : method.type === "aes-256" ? "AES-256" : ""}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 break-all">
                  {method.type === "gpg"
                    ? <>GPG Key <span className="ml-2 opacity-70">{((methodConfig as any).privateKey ?? '').slice(0, 18)}...</span></>
                    : method.type === "aes-256"
                      ? <>AES-256 Password</>
                      : null}
                </div>
              </div>

              {/* Use method-specific actions component */}
              <method.ActionsComponent
                methodIndex={idx}
                onEdit={() => handleEdit(idx)}
                onDelete={() => handleRemove(idx)}
              />
            </li>
          );
        })}
      </ul>
      
      {showAdd ? (
        <div>
          {/* Type selector */}
          <div className="mb-2">
            <label className="text-sm block mb-1">Type</label>
            <ToggleGroup
              type="single"
              value={form.type}
              onValueChange={v => {
                if (!v) return;
                if (v === "gpg") {
                  setForm({
                    name: form.name ?? "",
                    type: "gpg",
                    privateKey: form.type === "gpg" ? (form as any).privateKey : "",
                    password: form.password ?? "",
                  });
                } else if (v === "aes-256") {
                  setForm({
                    name: form.name ?? "",
                    type: "aes-256",
                    password: form.password ?? "",
                  });
                }
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
          
          {/* Render the appropriate config component based on type */}
          {form.type === "gpg" ? (
            <gpgMethod.ConfigComponent
              form={form}
              setForm={setForm}
              editIdx={editIdx}
              handleAddOrSave={handleAddOrSave}
              handleCancel={handleCancel}
            />
          ) : (
            <aes256Method.ConfigComponent
              form={form}
              setForm={setForm}
              editIdx={editIdx}
              handleAddOrSave={handleAddOrSave}
              handleCancel={handleCancel}
            />
          )}
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
