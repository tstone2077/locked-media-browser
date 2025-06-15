
import type { LocalSourceConfig } from "./local";
import type { OpenDriveSourceConfig } from "./opendrive";

export type SourceConfig = LocalSourceConfig | OpenDriveSourceConfig;
