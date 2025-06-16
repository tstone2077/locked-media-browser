
import { useState } from "react";
import { Image, Lock, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSources } from "@/lib/sources";
import type { SourceConfig } from "@/lib/sources/index";
import { useEncryptionMethods } from "@/lib/encryption";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import SourceConfigLocal from "./Sources/SourceConfigLocal";
import SourceConfigOpenDrive from "./Sources/SourceConfigOpenDrive";

// Simple form type for editing
type SourceConfigForm = {
  name: string;
  type: "local" | "opendrive";
  encryption: string;
  [key: string]: any; // Allow additional config properties
};

const SourceConfigPanel = () => {
  const { sources, sourceConfigs, addSource, removeSource } = useSources();
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<SourceConfigForm>({
    name: "",
    type: "local",
    encryption: "",
  });

  function startEdit(idx: number) {
    setEditIdx(idx);
    setShowAdd(true);
    const sourceConfig = sourceConfigs[idx];
    setForm({ ...sourceConfig });
  }

  async function handleAddOrSave() {
    if (!form.name || !form.encryption) return;

    // Use the source's validation if available
    let validationError: string | null = null;
    if (editIdx !== null && sources[editIdx]) {
      validationError = await sources[editIdx].validateConfig(form);
      if (validationError) {
        toast({
          title: "Validation Failed",
          description: validationError,
          variant: "destructive",
        });
        return;
      }
    }

    if (editIdx !== null) {
      const updatedSources = sourceConfigs.map((s, i) => (i === editIdx ? form as SourceConfig : s));
      Array(sourceConfigs.length)
        .fill(0)
        .forEach((_, i) => removeSource(0));
      updatedSources.forEach(s => addSource(s));
    } else {
      addSource(form as SourceConfig);
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

  const { methods } = useEncryptionMethods();

  return (
    <div>
      <ul className="space-y-4 mb-6">
        {sources.length === 0 && (
          <li className="opacity-70 text-sm">No data sources configured.</li>
        )}
        {sources.map((source, idx) => {
          const sourceConfig = sourceConfigs[idx];
          return (
            <li
              key={source.name + idx}
              className={cn(
                "rounded-lg px-4 py-3 bg-[#28344a]/70 flex items-center justify-between border border-green-900/40 animate-fade-in"
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {source.type === "local" ? (
                    <HardDrive className="text-green-400" size={18} />
                  ) : (
                    <Image className="text-green-400" size={18} />
                  )}
                  <span className="font-medium text-green-200">{source.name}</span>
                  <span className="text-xs tracking-tight bg-green-900/30 text-green-200 px-2 py-0.5 rounded ml-2">
                    {source.type === "local" ? "LOCAL" : "OPENDRIVE"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock size={14} className="inline text-green-300/60" />
                  <span>
                    Uses: <span className="opacity-90">{sourceConfig.encryption}</span>
                    {source.type === "opendrive" && (sourceConfig as any).username && (
                      <> ({(sourceConfig as any).username})</>
                    )}
                  </span>
                </div>
              </div>

              {/* Use source-specific actions component */}
              <source.ActionsComponent
                sourceIndex={idx}
                onEdit={() => startEdit(idx)}
                onDelete={() => handleRemove(idx)}
              />
            </li>
          );
        })}
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

export default SourceConfigPanel;
