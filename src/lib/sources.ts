
import { useSessionStorage } from "./session-storage";
import { ISource, SourceConfig } from "./sources/types";
import { SourceFactory } from "./sources/SourceFactory";

const SOURCES_KEY = "sources";

export function useSources() {
  const [sourceConfigs, setSourceConfigs] = useSessionStorage<SourceConfig[]>(SOURCES_KEY, []);

  // Convert configs to source instances
  const sources: ISource[] = sourceConfigs.map(config => SourceFactory.create(config));

  function addSource(config: SourceConfig) {
    setSourceConfigs([...sourceConfigs, config]);
  }

  function removeSource(index: number) {
    setSourceConfigs(sourceConfigs.filter((_, idx) => idx !== index));
  }

  function updateSource(index: number, config: SourceConfig) {
    setSourceConfigs(sourceConfigs.map((s, idx) => idx === index ? config : s));
  }

  return {
    sources,
    sourceConfigs,
    addSource,
    removeSource,
    updateSource,
  };
}
