
import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEncryptionMethods, EncryptionMethodConfig } from "@/lib/encryption";
import { Button } from "@/components/ui/button";

const EncryptionConfig = () => {
  const { methods, addMethod, removeMethod } = useEncryptionMethods();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<EncryptionMethodConfig>({
    name: "",
    type: "gpg",
    privateKey: "",
    password: "",
  });

  function handleAdd() {
    if (!form.name || !form.privateKey || !form.password) return;
    addMethod(form);
    setForm({
      name: "",
      type: "gpg",
      privateKey: "",
      password: "",
    });
    setShowAdd(false);
  }

  function handleRemove(idx: number) {
    removeMethod(idx);
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
            <Button
              size="sm"
              variant="destructive"
              className="ml-6"
              onClick={() => handleRemove(idx)}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      {showAdd ? (
        <div className="p-4 rounded-xl border border-cyan-700/50 bg-[#191f29] mb-2 animate-scale-in">
          <div className="mb-3 font-semibold text-lg text-cyan-400 flex items-center">
            <Lock className="mr-2" /> New GPG Key
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
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="default" onClick={handleAdd} className="bg-cyan-700 hover:bg-cyan-500">Add</Button>
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
