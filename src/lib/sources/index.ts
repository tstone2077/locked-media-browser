import type { LocalSourceConfig } from "./local";
import type { OpenDriveSourceConfig } from "./opendrive";

export * from "./types";
export * from "./LocalSource";
export * from "./OpenDriveSource";
export * from "./SourceFactory";

// Keep the existing types for backward compatibility
export type { LocalSourceConfig } from "./local";
export type { OpenDriveSourceConfig } from "./opendrive";
export type { SourceConfig as LegacySourceConfig } from "./local";
