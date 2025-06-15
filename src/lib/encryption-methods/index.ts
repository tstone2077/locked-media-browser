import { GPGConfig, GPGMethod } from "./gpg";
import { AES256Config, AES256Method } from "./aes256";
import { AgeConfig, AgeMethod } from "./age";

export type EncryptionMethodConfig = GPGConfig | AES256Config | AgeConfig;

export const ENCRYPTION_METHODS = [GPGMethod, AES256Method, AgeMethod];

// Use type-only exports for isolatedModules compatibility:
export type { GPGConfig } from "./gpg";
export type { AES256Config } from "./aes256";
export type { AgeConfig } from "./age";
export { GPGMethod, AES256Method, AgeMethod };
