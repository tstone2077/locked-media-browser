
import { ISource, FileInfo, SourceConfigProps, SourceConfig } from "./types";
import SourceConfigLocal from "@/components/Sources/SourceConfigLocal";
import LocalSourceActions from "@/components/Sources/LocalSourceActions";

export class LocalSource implements ISource {
  readonly type = "local" as const;
  readonly name: string;
  readonly config: SourceConfig;

  constructor(config: SourceConfig) {
    this.name = config.name;
    this.config = config;
  }

  ConfigComponent = SourceConfigLocal;
  ActionsComponent = LocalSourceActions;

  async listdir(path: string): Promise<FileInfo[]> {
    // For local storage, we'll return empty array since we don't have a real filesystem
    // This would be implemented based on your local storage structure
    return [];
  }

  async read(path: string): Promise<string | ArrayBuffer> {
    // For local storage, implement reading from your storage mechanism
    const key = `local-file-${path}`;
    const data = localStorage.getItem(key);
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }
    return data;
  }

  async write(path: string, content: string | ArrayBuffer): Promise<void> {
    // For local storage, implement writing to your storage mechanism
    const key = `local-file-${path}`;
    const stringContent = typeof content === 'string' ? content : 
      new TextDecoder().decode(content);
    localStorage.setItem(key, stringContent);
  }

  async validateConfig(config: Record<string, any>): Promise<string | null> {
    if (!config.name || !config.encryption) {
      return "Name and encryption method are required";
    }
    return null;
  }
}
