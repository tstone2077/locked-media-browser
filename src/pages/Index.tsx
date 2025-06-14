import { Link } from "react-router-dom";
import SourceTabs from "@/components/SourceTabs";
import { ArrowRight } from "lucide-react";
import ConfigModal from "@/components/ConfigModal";
import { useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Show config modal if /config route is active
  // This lets the modal display over main browser interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#13203c] via-[#1f2833] to-[#22273b] w-full text-white">
      <header className="px-8 py-4 flex justify-between items-center border-b border-border sticky top-0 z-20 bg-[#10151e]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-wide text-cyan-300">SafeBox</span>
          <span className="text-xs font-mono px-2 py-1 rounded bg-cyan-900/30 text-cyan-200 hidden sm:inline">Encrypted Media Vault</span>
        </div>
        <button
          onClick={() => navigate("/config")}
          className="bg-cyan-700 hover:bg-cyan-500 transition px-4 py-2 rounded-lg flex items-center gap-2 shadow story-link"
        >
          Configure
          <ArrowRight size={18} />
        </button>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <SourceTabs />
      </main>
      <ConfigModal />
    </div>
  );
};

export default Index;
