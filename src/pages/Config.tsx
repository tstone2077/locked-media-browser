
import EncryptionConfig from "@/components/EncryptionConfig";
import SourceConfig from "@/components/SourceConfig";

const Config = () => {
  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-[#161d29] via-[#1f2833] to-[#232946] text-white">
      <div className="m-auto flex w-full max-w-6xl flex-col md:flex-row gap-8 py-16">
        <section className="flex-1 bg-[#23243c] rounded-xl shadow-xl p-8 flex flex-col animate-fade-in">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            Encryption Methods
          </h2>
          <EncryptionConfig />
        </section>
        <section className="flex-1 bg-[#23243c] rounded-xl shadow-xl p-8 flex flex-col animate-fade-in delay-100">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            Data Sources
          </h2>
          <SourceConfig />
        </section>
      </div>
    </div>
  );
};

export default Config;
