
import { ISource, FileInfo, SourceConfigProps, SourceConfig } from "./types";
import SourceConfigOpenDrive from "@/components/Sources/SourceConfigOpenDrive";
import OpenDriveSourceActions from "@/components/Sources/OpenDriveSourceActions";

export class OpenDriveSource implements ISource {
  readonly type = "opendrive" as const;
  readonly name: string;
  readonly config: SourceConfig & {
    username: string;
    password: string;
    rootFolder: string;
  };

  constructor(config: SourceConfig & { username: string; password: string; rootFolder: string }) {
    this.name = config.name;
    this.config = config;
  }

  ConfigComponent = SourceConfigOpenDrive;
  ActionsComponent = OpenDriveSourceActions;

  async listdir(path: string): Promise<FileInfo[]> {
    try {
      let folderId = this.config.rootFolder;
      if (folderId === "/") folderId = "0";
      
      // Navigate to the requested path
      if (path && path !== "/") {
        const pathParts = path.split("/").filter(p => p);
        let currentFolderId = folderId;
        
        for (const pathPart of pathParts) {
          const resp = await fetch("https://dev.opendrive.com/folder/list.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: this.config.username,
              passwd: this.config.password,
              folder_id: currentFolderId,
            }),
          });
          
          if (!resp.ok) throw new Error("Failed to list folders");
          const json = await resp.json();
          if (!json || !json.Folders) return [];
          
          const found = json.Folders.find((f: any) => f.Name === pathPart);
          if (!found) throw new Error(`Folder "${pathPart}" not found`);
          currentFolderId = found.FolderID;
        }
        folderId = currentFolderId;
      }

      const resp = await fetch("https://dev.opendrive.com/folder/list.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.config.username,
          passwd: this.config.password,
          folder_id: folderId,
        }),
      });

      if (!resp.ok) throw new Error("Failed to list directory");
      const json = await resp.json();
      if (!json) return [];

      const files: FileInfo[] = [];
      
      // Add folders
      if (json.Folders) {
        files.push(...json.Folders.map((f: any) => ({
          name: f.Name,
          type: "folder" as const,
          path: path ? `${path}/${f.Name}` : f.Name,
        })));
      }
      
      // Add files
      if (json.Files) {
        files.push(...json.Files.map((f: any) => ({
          name: f.Name,
          type: "file" as const,
          path: path ? `${path}/${f.Name}` : f.Name,
          size: f.Size,
          lastModified: new Date(f.DateModified),
        })));
      }

      return files;
    } catch (error) {
      console.error("[OpenDriveSource] Failed to list directory:", error);
      throw error;
    }
  }

  async read(path: string): Promise<string | ArrayBuffer> {
    // Implementation would depend on OpenDrive's file download API
    throw new Error("OpenDrive read not implemented yet");
  }

  async write(path: string, content: string | ArrayBuffer): Promise<void> {
    // Implementation would depend on OpenDrive's file upload API
    throw new Error("OpenDrive write not implemented yet");
  }

  async validateConfig(config: Record<string, any>): Promise<string | null> {
    if (!config.name || !config.encryption || !config.username || !config.password || !config.rootFolder) {
      return "All fields are required for OpenDrive source";
    }

    try {
      const resp = await fetch("https://dev.opendrive.com/folder/list.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: config.username,
          passwd: config.password,
          folder_id: config.rootFolder === "/" ? "0" : config.rootFolder,
        }),
      });

      if (!resp.ok) {
        return `Could not connect to OpenDrive (${resp.status}): ${resp.statusText}`;
      }
      
      const json = await resp.json();
      if (json && json.Error) {
        return json.Error;
      }
      
      return null;
    } catch (error) {
      return "Network error or unable to connect to OpenDrive";
    }
  }
}
