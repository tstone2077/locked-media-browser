
import { useState } from "react";
import { Image, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSources, SourceConfig as SourceConfigType } from "@/lib/sources";
import { useEncryptionMethods } from "@/lib/encryption";
import { Button } from "@/components/ui/button";

const SourceConfig = () => {
  const { sources, addSource, removeSource } = useSources();
  const { methods } = useEncryptionMethods();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<SourceConfigType>({
    name: "",
    type: "dataurl",
    encryption: "",
  });

  function handleAdd() {
    if (!form.name || !form.encryption) return;
    addSource(form);
    setForm({
      name: "",
      type: "dataurl",
      encryption: "",
    });
    setShowAdd(false);
  }

  function handleRemove(idx: number) {
    removeSource(idx);
  }

  return (
    <div>
      <ul className="space-y-4 mb-6">
        {sources.length === 0 && <li className="opacity-70 text-sm">No sources configured.</li>}
        {sources.map((s, idx) => (
          <li
            key={s.name + idx}
            className={cn(
              "rounded-lg px-4 py-3 bg-[#28344a]/70 flex items-center justify-between border border-green-900/40 animate-fade-in"
            )}
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Image className="text-green-400" size={18} />
                <span className="font-medium text-green-200">{s.name}</span>
                <span className="text-xs tracking-tight bg-green-900/30 text-green-200 px-2 py-0.5 rounded ml-2">{s.type.toUpperCase()}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock size={14} className="inline text-green-300/60" />
                <span>
                  Uses: <span className="opacity-90">{s.encryption}</span>
                </span>
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
        <div className="p-4 rounded-xl border border-green-700/50 bg-[#191f29] mb-2 animate-scale-in">
          <div className="mb-3 font-semibold text-lg text-green-400 flex items-center">
            <Image className="mr-2" /> New Data URL Source
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
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="default" className="bg-green-700 hover:bg-green-500" onClick={handleAdd}>Add</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full mt-2 text-green-400 border-green-500 flex gap-2">
          <Image size={16} /> Add Data URL Source
        </Button>
      )}
    </div>
  );
};

export default SourceConfig;
