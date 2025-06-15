
import { GPGConfig, GPGMethod } from "./gpg";
import { AES256Config, AES256Method } from "./aes256";

export type EncryptionMethodConfig = GPGConfig | AES256Config;

export const ENCRYPTION_METHODS = [GPGMethod, AES256Method];

export { GPGConfig, GPGMethod, AES256Config, AES256Method };
