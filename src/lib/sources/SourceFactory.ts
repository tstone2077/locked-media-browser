
import { ISource, SourceConfig } from "./types";
import { LocalSource } from "./LocalSource";
import { OpenDriveSource } from "./OpenDriveSource";

export class SourceFactory {
  static create(config: SourceConfig): ISource {
    switch (config.type) {
      case "local":
        return new LocalSource(config);
      case "opendrive":
        if (!config.username || !config.password || !config.rootFolder) {
          throw new Error("OpenDrive source requires username, password, and rootFolder");
        }
        return new OpenDriveSource(config as SourceConfig & { username: string; password: string; rootFolder: string });
      default:
        throw new Error(`Unknown source type: ${(config as any).type}`);
    }
  }
}
