
import React from "react";
import { Button } from "@/components/ui/button";
import { HardDrive } from "lucide-react";

type LocalProps = {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  editIdx: number | null;
  handleAddOrSave: () => void;
  handleCancel: () => void;
  encryptionMethods: { name: string }[];
};

const SourceConfigLocal: React.FC<LocalProps> = ({
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

export default SourceConfigLocal;
