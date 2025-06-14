
import { useState } from "react";
import { Lock, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEncryptionMethods, EncryptionMethodConfig } from "@/lib/encryption";
import { Button } from "@/components/ui/button";

const EncryptionConfig = () => {
  const { methods, addMethod, removeMethod } = useEncryptionMethods();
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<EncryptionMethodConfig>({
    name: "",
    type: "gpg",
    privateKey: "",
    password: "",
  });

  function handleEdit(idx: number) {
    setEditIdx(idx);
    setForm(methods[idx]);
    setShowAdd(true);
  }

  function handleAddOrSave() {
    if (!form.name || !form.privateKey || !form.password) return;
    if (editIdx !== null) {
      // Update the method in-place
      const updatedMethods = methods.map((m, i) => (i === editIdx ? form : m));
      // Overwrite all methods (using setMethods is not exposed, only add/remove)
      // So we clear all then re-add in order, using removeMethod for all, then addMethod for each
      // It's hacky but works with existing API
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
    });
    setEditIdx(null);
    setShowAdd(false);
  }

  function handleRemove(idx: number) {
    removeMethod(idx);
    // Reset edit if deleting the one being edited
    if (editIdx === idx) {
      setEditIdx(null);
      setShowAdd(false);
      setForm({
        name: "",
        type: "gpg",
        privateKey: "",
        password: "",
      });
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
    });
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
                  {m.type.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                GPG Key <span className="ml-2 opacity-70">{m.privateKey.slice(0, 18)}...</span>
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
            <Lock className="mr-2" /> {editIdx !== null ? "Edit GPG Key" : "New GPG Key"}
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
          <div className="mb-2">
            <label className="text-sm">Private Key</label>
            <textarea
              className="w-full mt-1 p-2 rounded bg-[#10151e] border border-cyan-600 h-20"
              value={form.privateKey}
              onChange={e => setForm(f => ({ ...f, privateKey: e.target.value }))}
            />
          </div>
          <div className="mb-2">
            <label className="text-sm">Password</label>
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
          <Lock size={16} /> Add GPG Encryption
        </Button>
      )}
    </div>
  );
};

export default EncryptionConfig;
