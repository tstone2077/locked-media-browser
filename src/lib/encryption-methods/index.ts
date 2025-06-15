
import { GPGConfig, GPGMethod } from "./gpg";
import { AES256Config, AES256Method } from "./aes256";

export type EncryptionMethodConfig = GPGConfig | AES256Config;

export const ENCRYPTION_METHODS = [GPGMethod, AES256Method];

// Use type-only exports for isolatedModules compatibility:
export type { GPGConfig } from "./gpg";
export type { AES256Config } from "./aes256";
export { GPGMethod, AES256Method };
