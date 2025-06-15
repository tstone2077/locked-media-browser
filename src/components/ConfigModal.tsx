
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import EncryptionConfig from "@/components/EncryptionConfig";
import SourceConfigPanel from "@/components/SourceConfig";
import { useEncryptionMethods } from "@/lib/encryption";
import { useMemo } from "react";
import { X } from "lucide-react";

export default function ConfigModal() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only open modal if route is exactly /config
  const open = location.pathname === "/config";
  const { methods } = useEncryptionMethods();
  const methodsKey = useMemo(
    () => methods.map(m => m.name).join(",") + ":" + methods.length,
    [methods]
  );

  const handleClose = () => {
    // Go back to home
    navigate("/");
  };

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) handleClose(); }}>
      <DialogContent
        className="max-w-4xl w-full p-0 bg-[#181E29] border border-green-800/[0.6] shadow-2xl"
        onInteractOutside={handleClose}
      >
        {/* Visually hidden accessible title */}
        <DialogTitle>
          <span className="sr-only">Configuration Modal</span>
        </DialogTitle>
        <button
          className="absolute right-4 top-4 text-green-300 hover:text-green-100 transition p-2 rounded focus:outline-none"
          aria-label="Close"
          onClick={handleClose}
        >
          <X size={22} />
        </button>
        <div className="flex flex-col md:flex-row w-full">
          <section className="flex-1 bg-[#23243c] rounded-l-xl shadow-none p-8 flex flex-col min-h-[480px]">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              Encryption Methods
            </h2>
            <EncryptionConfig />
          </section>
          <section className="flex-1 bg-[#23243c] rounded-r-xl shadow-none p-8 flex flex-col min-h-[480px] delay-100">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              Data Sources
            </h2>
            {/* the key ensures SourceConfig re-mounts when methods change */}
            <SourceConfigPanel key={methodsKey} />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
