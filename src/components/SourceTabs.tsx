
import { useSources } from "@/lib/sources";
import EncryptedFileGrid from "./EncryptedFileGrid";
import { useState } from "react";
import { Image } from "lucide-react";

const SourceTabs = () => {
  const { sources } = useSources();
  const [active, setActive] = useState(0);

  if (sources.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center opacity-60 py-24 animate-fade-in">
        <Image className="mx-auto mb-3 text-cyan-600" size={44} />
        <h2 className="font-semibold text-xl mb-2">No Sources Configured</h2>
        <p>
          Add a source in the <a href="/config" className="underline text-cyan-400 hover:text-cyan-200 duration-150">Configuration Page</a> to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-10 border-b border-cyan-900/50">
        {sources.map((s, idx) => (
          <button
            key={s.name + idx}
            onClick={() => setActive(idx)}
            className={`relative px-5 py-2 text-lg font-semibold rounded-t hover:bg-cyan-900/10 duration-100
            ${active === idx ? "bg-cyan-900/30 text-cyan-200 shadow-inner" : "text-cyan-400"}`}
            style={{ zIndex: active === idx ? 1 : 0 }}
          >
            {s.name}
            {active === idx && (
              <span className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 h-1 w-10 rounded bg-cyan-500" />
            )}
          </button>
        ))}
      </div>
      <EncryptedFileGrid sourceIndex={active} />
    </div>
  );
};

export default SourceTabs;
