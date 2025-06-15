
import { LocalSourceConfig } from "./local";
import { OpenDriveSourceConfig } from "./opendrive";

export type SourceConfig = LocalSourceConfig | OpenDriveSourceConfig;
