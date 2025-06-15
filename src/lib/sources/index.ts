
import type { LocalSourceConfig } from "./local";
import type { OpenDriveSourceConfig } from "./opendrive";

export type SourceConfig = LocalSourceConfig | OpenDriveSourceConfig;
export type { LocalSourceConfig, OpenDriveSourceConfig };
// export SourceConfig type from this index for single-source-of-truth

