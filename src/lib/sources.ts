
import { useSessionStorage } from "./session-storage";

export type SourceConfig = {
  name: string;
  type: "local" | "dataurl";
  encryption: string; // Encryption method name
};

const SOURCES_KEY = "sources";

export function useSources() {
  const [sources, setSources] = useSessionStorage<SourceConfig[]>(SOURCES_KEY, []);

  function addSource(source: SourceConfig) {
    setSources([...sources, source]);
  }
  function removeSource(index: number) {
    setSources(sources.filter((_, idx) => idx !== index));
  }

  return {
    sources,
    addSource,
    removeSource,
  };
}
